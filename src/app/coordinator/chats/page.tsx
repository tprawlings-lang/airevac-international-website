import Link from 'next/link';

import { csrfToken, requireUser, CSRF_FIELD } from '@/server/auth/guard';
import { activeChatsFor, queuedChats } from '@/server/chat/sessions';
import { MAX_CONCURRENT_CHATS } from '@/lib/chat-constants';
import { PresenceToggle } from '@/components/chat/PresenceToggle';
import { AutoRefresh } from '@/components/chat/AutoRefresh';
import { availableCoordinators } from '@/server/chat/presence';

/**
 * The chat queue.
 *
 * The intake shown in the queue preview is logistics only: role, name,
 * callback number, route, timeframe. That is the whole point of the intake
 * being an allowlist. A coordinator deciding whether to claim a conversation
 * does not need clinical detail, and the queue is the one screen that might be
 * left open on an unattended machine.
 */

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  taken: 'Another coordinator claimed that conversation first.',
  at_capacity: `You already have ${MAX_CONCURRENT_CHATS} conversations open. Close one before claiming another.`,
  not_yours: 'That conversation is assigned to someone else.',
  csrf: 'Your session expired before the form was submitted. Try again.',
};

const TIMEFRAMES: Record<string, string> = {
  immediate: 'As soon as possible',
  within_24h: 'Within 24 hours',
  within_72h: 'Within 3 days',
  planning: 'Still planning',
};

function age(from: Date): string {
  const minutes = Math.max(0, Math.round((Date.now() - from.getTime()) / 60_000));
  return minutes < 1 ? 'just now' : `${minutes} min ago`;
}

export default async function ChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const token = await csrfToken();
  const { error } = await searchParams;

  const [queue, mine, available] = await Promise.all([
    queuedChats(),
    activeChatsFor(user.id),
    availableCoordinators(),
  ]);

  const isAvailable = available.some((coordinator) => coordinator.userId === user.id);
  const atCapacity = mine.length >= MAX_CONCURRENT_CHATS;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/coordinator/console" className="text-sm text-support-700 underline">
        ← Console
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-navy-900">Chat</h1>

      {error !== undefined && (
        <p role="alert" className="mt-4 rounded-panel border border-urgent-600 bg-urgent-50 px-4 py-3 text-sm">
          {ERRORS[error] ?? 'That did not work.'}
        </p>
      )}

      {/* The queue changes when a visitor arrives or another coordinator
          claims one, neither of which this page would otherwise notice. */}
      <AutoRefresh seconds={5} />

      <div className="mt-6">
        <PresenceToggle initial={isAvailable} />
      </div>

      {/* ---------------- mine ---------------- */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy-900">
          Your conversations{' '}
          <span className={atCapacity ? 'text-urgent-600' : 'text-ink-500'}>
            ({mine.length} of {MAX_CONCURRENT_CHATS})
          </span>
        </h2>

        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-ink-700">None open.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mine.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/coordinator/chats/${chat.id}`}
                  className="flex min-h-[44px] flex-wrap items-center justify-between gap-2 rounded-panel border border-navy-800 bg-white px-4 py-3 hover:bg-support-50"
                >
                  <span className="font-semibold text-navy-900">
                    {chat.intake.contactName} · {chat.intake.role}
                  </span>
                  <span className="text-sm text-ink-700">
                    {chat.publicRef} · {age(chat.lastActivityAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- queue ---------------- */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-navy-900">Waiting ({queue.length})</h2>

        {queue.length === 0 ? (
          <p className="mt-2 text-sm text-ink-700">Nobody is waiting.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {queue.map((chat) => (
              <li key={chat.id} className="rounded-panel border border-ink-300 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">
                      {chat.intake.contactName}
                      <span className="ml-2 text-sm font-normal text-ink-700">
                        {chat.intake.role}
                        {chat.intake.organization !== undefined &&
                          chat.intake.organization !== '' &&
                          ` · ${chat.intake.organization}`}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink-700">
                      {/* The callback number is shown in the queue on purpose:
                          if the chat drops before anyone claims it, this is how
                          the case is recovered. */}
                      {chat.intake.phone}
                      {chat.intake.originCity !== undefined && chat.intake.originCity !== '' && (
                        <> · from {chat.intake.originCity}</>
                      )}
                      {chat.intake.destinationCity !== undefined &&
                        chat.intake.destinationCity !== '' && <> to {chat.intake.destinationCity}</>}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      {TIMEFRAMES[chat.intake.timeframe ?? 'planning']} ·{' '}
                      {chat.visitorLanguage === 'es' ? 'Spanish' : 'English'} · waiting{' '}
                      {age(chat.startedAt)} · {chat.publicRef}
                    </p>
                  </div>

                  <form method="POST" action="/coordinator/api/chat/claim">
                    <input type="hidden" name={CSRF_FIELD} value={token} />
                    <input type="hidden" name="chat_id" value={chat.id} />
                    <button
                      type="submit"
                      disabled={atCapacity}
                      title={atCapacity ? 'You are at capacity' : undefined}
                      className="min-h-[44px] rounded-panel bg-navy-900 px-4 py-2 font-semibold text-white hover:bg-navy-950 disabled:opacity-50"
                    >
                      Claim
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
