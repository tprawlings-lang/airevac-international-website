import { EventEmitter } from 'node:events';

/**
 * In-process fan-out for the live chat streams.
 *
 * SINGLE INSTANCE ONLY, AND THAT IS A REAL LIMIT. A message posted to instance
 * B never reaches a stream held open on instance A, so running two web
 * instances would silently break half the conversations: each side would see
 * their own messages and not the other's, which is worse than an outage because
 * it looks like the other person has stopped replying.
 *
 * The fix when scaling is Postgres `LISTEN`/`NOTIFY`, which needs no new
 * infrastructure because the database is already there. This module is the seam
 * for it: `publish` becomes a `NOTIFY` and `subscribe` becomes a `LISTEN` on a
 * dedicated connection, and no caller changes. Until then, the Render service
 * must stay at one instance.
 *
 * The events carry no message content. A subscriber is told that a chat
 * changed and re-reads from the database, which keeps one access path to the
 * conversation rather than two, and means the audit trail and the retention
 * sweep cannot be bypassed by listening to the bus.
 */

export type ChatEventKind = 'message' | 'claimed' | 'closed' | 'queue';

export interface ChatEvent {
  kind: ChatEventKind;
  /** Absent for `queue`, which concerns the queue as a whole. */
  chatId?: string;
}

/**
 * Every SSE stream is one listener, so the ceiling is concurrent conversations
 * plus signed-in coordinators. Node warns at ten by default, which a handful of
 * coordinators would trip while behaving perfectly normally.
 */
const emitter = new EventEmitter();
emitter.setMaxListeners(200);

const CHANNEL = 'chat';

export function publish(event: ChatEvent): void {
  emitter.emit(CHANNEL, event);
}

/**
 * Subscribes to chat events. Returns the unsubscribe function.
 *
 * The caller MUST call it when the stream closes. A leaked listener holds a
 * closure over the request for the life of the process, and on a long-running
 * server that is a slow memory leak rather than a visible failure.
 */
export function subscribe(listener: (event: ChatEvent) => void): () => void {
  emitter.on(CHANNEL, listener);
  return () => emitter.off(CHANNEL, listener);
}

/** Test-only. */
export function __listenerCount(): number {
  return emitter.listenerCount(CHANNEL);
}
