import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { FEATURES } from '@/content/site';
import { chatIsStaffed } from '@/server/chat/presence';
import { startChat } from '@/server/chat/sessions';
import { setChatCookie } from '@/server/chat/visitor-cookie';
import { publish } from '@/server/chat/events';
import { consume } from '@/lib/rate-limit';
import { coarsenIp } from '@/lib/redact';

/**
 * Opens a chat from the pre-chat intake form.
 *
 * THE FIELD LIST IS AN ALLOWLIST, and `.strict()` means an unknown key is a
 * validation error rather than an ignored extra. This is the same shape the
 * callback form uses and for the same reason: the way PHI reaches a system is
 * usually a field somebody added without thinking about what would be typed
 * into it.
 *
 * The intake deliberately has no free-text box. Everything a coordinator needs
 * before saying hello is structured, and the conversation itself is where
 * anything else belongs. That does not stop patient details arriving once the
 * chat is open, which is why the transcript store is treated as PHI from the
 * first message, but it does keep them out of the queue preview a coordinator
 * sees before claiming.
 *
 * A CALLBACK NUMBER IS REQUIRED. A chat drops when a phone loses signal in a
 * hospital basement; the number is what turns that from a lost case into a
 * returned call.
 */

const StartSchema = z
  .object({
    role: z.enum(['family', 'hospital', 'cruise', 'insurer']),
    contactName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(40),
    organization: z.string().trim().max(160).optional().default(''),
    originCity: z.string().trim().max(120).optional().default(''),
    destinationCity: z.string().trim().max(120).optional().default(''),
    timeframe: z
      .enum(['immediate', 'within_24h', 'within_72h', 'planning'])
      .optional()
      .default('planning'),
    preferredLanguage: z.enum(['en', 'es']),
  })
  .strict();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!FEATURES.secureChat) {
    return NextResponse.json({ error: 'chat_disabled' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  // Reuses the chat-start limit the blueprint already sets: 3 per 10 minutes
  // per IP. Enough for a dropped connection and a retry, not enough to script.
  const limit = await consume('chatStart', coarsenIp(ip));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 },
    );
  }

  /*
   * Checked again here, not only in the widget. The widget asks before showing
   * the form, and a coordinator can sign off during the thirty seconds someone
   * spends filling it in. Opening a conversation nobody is watching is the
   * exact failure this feature must not have.
   */
  if (!(await chatIsStaffed())) {
    return NextResponse.json({ error: 'nobody_available' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = StartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid',
        // Field names only. Never the submitted values.
        fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))],
      },
      { status: 400 },
    );
  }

  const { record, visitorToken } = await startChat(parsed.data, { ip });
  await setChatCookie(visitorToken);

  // Wakes every coordinator console watching the queue.
  publish({ kind: 'queue' });

  return NextResponse.json({
    chatId: record.id,
    reference: record.publicRef,
    status: record.status,
  });
}
