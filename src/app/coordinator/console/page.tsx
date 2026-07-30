import Link from "next/link";

import { csrfToken, requireUser, CSRF_FIELD } from "@/server/auth/guard";
import { StaffingBanner } from "@/components/chat/StaffingBanner";

/**
 * Console home.
 *
 * Phase A: identity, password, and the admin entry point. The chat queue lands
 * here in Phase B, which is why the layout is a card grid rather than a page of
 * prose.
 */

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const user = await requireUser();
  const token = await csrfToken();

  return (
    <>
      <StaffingBanner />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              Signed in as {user.displayName}
            </h1>
            <p className="mt-1 text-sm text-ink-700">
              {user.email} ·{" "}
              {user.role === "admin" ? "Administrator" : "Coordinator"}
            </p>
          </div>

          <form method="POST" action="/coordinator/api/logout">
            <input type="hidden" name={CSRF_FIELD} value={token} />
            <button
              type="submit"
              className="min-h-[44px] rounded-panel border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-ink-50"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-panel border border-ink-300 bg-white p-5">
            <h2 className="text-lg font-bold text-navy-900">Chat</h2>
            <p className="mt-2 text-sm text-ink-700">
              Go available, claim waiting conversations, and reply. The public
              widget stays hidden until the Business Associate Agreement is
              signed.
            </p>
            <Link
              href="/coordinator/chats"
              className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-support-700 underline underline-offset-4"
            >
              Open chat queue
            </Link>
          </div>

          <div className="rounded-panel border border-ink-300 bg-white p-5">
            <h2 className="text-lg font-bold text-navy-900">Your account</h2>
            <p className="mt-2 text-sm text-ink-700">
              Change your password. Nobody else knows it, including
              administrators.
            </p>
            <Link
              href="/coordinator/password"
              className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-support-700 underline underline-offset-4"
            >
              Change password
            </Link>
          </div>

          {user.role === "admin" && (
            <div className="rounded-panel border border-ink-300 bg-white p-5 sm:col-span-2">
              <h2 className="text-lg font-bold text-navy-900">
                Administration
              </h2>
              <p className="mt-2 text-sm text-ink-700">
                Create coordinator accounts, disable people who have left, and
                read the audit log.
              </p>
              <Link
                href="/coordinator/users"
                className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-support-700 underline underline-offset-4"
              >
                Manage users
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
