import Link from 'next/link';
import { notFound } from 'next/navigation';

import { csrfToken, requireUser, CSRF_FIELD } from '@/server/auth/guard';
import { findById } from '@/server/chat/sessions';
import { audit } from '@/server/audit';
import { CoordinatorChat } from '@/components/chat/CoordinatorChat';

/**
 * One conversation.
 *
 * OPENING THIS IS AN AUDITED READ. The transcript contains whatever the visitor
 * typed, which on this site means patient details. "Who opened this
 * conversation" is the question an investigation asks, and a log that records
 * only writes cannot answer it.
 */

export const dynamic = 'force-dynamic';

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const token = await csrfToken();

  const chat = await findById(id);
  if (chat === undefined) notFound();

  // Assigned coordinator or an admin. Anyone else does not learn it exists.
  if (chat.assignedUserId !== user.id && user.role !== 'admin') notFound();

  await audit({
    actorUserId: user.id,
    action: 'chat.transcript_read',
    targetType: 'chat',
    targetId: chat.id,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/coordinator/chats" className="text-sm text-support-700 underline">
        ← Chat queue
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">{chat.intake.contactName}</h1>
          <p className="mt-1 text-sm text-ink-700">
            {chat.intake.role}
            {chat.intake.organization !== undefined && chat.intake.organization !== '' && (
              <> · {chat.intake.organization}</>
            )}{' '}
            ·{' '}
            <a href={`tel:${chat.intake.phone.replace(/[^\d+]/g, '')}`} className="underline">
              {chat.intake.phone}
            </a>
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {chat.publicRef} · {chat.visitorLanguage === 'es' ? 'Spanish' : 'English'}
            {chat.intake.originCity !== undefined && chat.intake.originCity !== '' && (
              <> · from {chat.intake.originCity}</>
            )}
            {chat.intake.destinationCity !== undefined && chat.intake.destinationCity !== '' && (
              <> to {chat.intake.destinationCity}</>
            )}
          </p>
        </div>

        {chat.status === 'active' && (
          <form method="POST" action="/coordinator/api/chat/close">
            <input type="hidden" name={CSRF_FIELD} value={token} />
            <input type="hidden" name="chat_id" value={chat.id} />
            <button
              type="submit"
              className="min-h-[44px] rounded-panel border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-ink-50"
            >
              End conversation
            </button>
          </form>
        )}
      </div>

      {/* The one thing the chat cannot do, said where a coordinator will be
          tempted to ask for it. */}
      <p className="mt-4 rounded-panel bg-support-50 px-3 py-2 text-xs text-ink-700">
        Records and documents do not come through chat. Ask for them by email to
        ops@aeiamericas.com or fax to (619) 330-4551.
      </p>

      <CoordinatorChat
        chatId={chat.id}
        visitorLanguage={chat.visitorLanguage}
        visitorName={chat.intake.contactName}
      />
    </main>
  );
}
