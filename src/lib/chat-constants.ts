/**
 * Chat constants shared between the browser and the server.
 *
 * SEPARATE FROM src/server/chat/* ON PURPOSE. Those modules import the
 * Postgres client, and a client component importing one of them drags `pg`
 * into the browser bundle. That is not a build error, which is what makes it
 * worth a file: it fails quietly as a much larger bundle and a module that
 * cannot work if it is ever actually called.
 *
 * Anything imported by a `'use client'` component belongs here.
 */

/**
 * How often an open console renews its availability window.
 *
 * Comfortably inside the 75-second server-side TTL, so one dropped request
 * does not make a coordinator flicker offline mid-conversation.
 */
export const HEARTBEAT_INTERVAL_SECONDS = 30;

/** Conversations one coordinator may hold at once. */
export const MAX_CONCURRENT_CHATS = 3;
