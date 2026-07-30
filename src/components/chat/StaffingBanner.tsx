import Link from 'next/link';

import { chatIsStaffed } from '@/server/chat/presence';

/**
 * Says, on every console page, when nobody is answering chat.
 *
 * The widget already handles an unstaffed service correctly: it stops offering
 * chat and shows the phone number. That correctness is the problem this solves.
 * Nothing breaks, nothing errors, and no one inside the building finds out that
 * the feature they are staffing is not being offered.
 *
 * So the console says it, to whoever is looking, wherever they are. The emailed
 * alert after three minutes is for when nobody is looking; this is for when
 * somebody is, and it is the faster of the two by a wide margin.
 *
 * DELIBERATELY NOT AN ERROR STYLE. Red on this site means "the fastest path to
 * a human is this phone number". An unstaffed chat is a thing to fix, not an
 * emergency, and the phone line it falls back to is answered.
 */
export async function StaffingBanner() {
  let staffed: boolean;
  try {
    staffed = await chatIsStaffed();
  } catch {
    // The console's own failure path reports an unreachable database. This
    // banner staying quiet about it avoids two different alarms for one fault.
    return null;
  }

  if (staffed) return null;

  return (
    <div
      role="status"
      className="border-b-2 border-signal-600 bg-signal-500 px-4 py-3 text-center text-sm font-bold text-navy-900"
    >
      Nobody is available for chat right now. Visitors are being shown the phone number.{' '}
      <Link href="/coordinator/chats" className="underline underline-offset-2">
        Go available
      </Link>
    </div>
  );
}
