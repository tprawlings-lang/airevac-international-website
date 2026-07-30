import Link from 'next/link';

import { listUsers } from '@/server/auth/users';
import { recentAuditEntries } from '@/server/audit';
import { audit } from '@/server/audit';
import { csrfToken, requireAdmin, CSRF_FIELD } from '@/server/auth/guard';

/**
 * Administration: users and the audit log.
 *
 * Reading this page is itself an audited event. That looks fussy on a user
 * list and will not once the same console shows patient conversations: the
 * habit of recording reads has to exist before there is anything sensitive to
 * read, or it never gets added.
 */

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  csrf: 'Your session expired before the form was submitted. Try again.',
  invalid: 'Something was missing from the form.',
  self: 'You cannot disable your own account.',
  lastadmin: 'This is the only active administrator. Create another before disabling this one.',
  failed: 'That did not work.',
};

const NOTICES: Record<string, string> = {
  disabled: 'Account disabled. Any sessions it had are now ended.',
  enabled: 'Account re-enabled.',
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const admin = await requireAdmin();
  const token = await csrfToken();
  const params = await searchParams;

  const [users, auditRows] = await Promise.all([listUsers(), recentAuditEntries(25)]);
  await audit({ actorUserId: admin.id, action: 'admin.users_viewed' });

  const error = params.error !== undefined ? (ERRORS[params.error] ?? ERRORS.failed) : undefined;
  const notice = params.notice !== undefined ? NOTICES[params.notice] : undefined;
  const temporaryPassword = params.temp;
  const createdEmail = params.created;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/coordinator/console" className="text-sm text-support-700 underline">
        ← Console
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-navy-900">Users</h1>

      {error !== undefined && (
        <p role="alert" className="mt-6 rounded-panel border border-urgent-600 bg-urgent-50 px-4 py-3 text-sm">
          {error}
          {params.message !== undefined && `: ${params.message}`}
        </p>
      )}
      {notice !== undefined && (
        <p className="mt-6 rounded-panel border border-ink-300 bg-support-50 px-4 py-3 text-sm">{notice}</p>
      )}

      {temporaryPassword !== undefined && (
        <div className="mt-6 rounded-panel border-2 border-navy-900 bg-white px-4 py-4">
          <h2 className="font-bold text-navy-900">
            {createdEmail !== undefined ? `Account created for ${createdEmail}` : 'Password reset'}
          </h2>
          <p className="mt-2 text-sm text-ink-700">
            Give them this one-time password. It is shown once and is not stored anywhere. They
            must choose their own before they can use the console.
          </p>
          <p className="mt-3 font-mono text-lg font-bold tracking-wider text-navy-900">
            {temporaryPassword}
          </p>
        </div>
      )}

      {/* ---------------- create ---------------- */}
      <section className="mt-10 rounded-panel border border-ink-300 bg-white p-5">
        <h2 className="text-lg font-bold text-navy-900">Add a coordinator</h2>
        <form method="POST" action="/coordinator/api/users" className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name={CSRF_FIELD} value={token} />
          <input type="hidden" name="action" value="create" />

          <div>
            <label htmlFor="display_name" className="block text-sm font-semibold text-navy-900">
              Name
            </label>
            <input
              id="display_name" name="display_name" required
              className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-navy-900">
              Email
            </label>
            <input
              id="email" name="email" type="email" required
              className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-navy-900">
              Role
            </label>
            <select id="role" name="role" className="mt-1 w-full rounded-panel border border-ink-300 px-3 py-2">
              <option value="coordinator">Coordinator</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">Languages</legend>
            {/* Drives chat translation in Phase C: it activates only when the
                visitor's language is not one this coordinator speaks. */}
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="languages" value="en" defaultChecked /> English
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="languages" value="es" /> Spanish
            </label>
          </fieldset>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="min-h-[44px] rounded-panel bg-navy-900 px-5 py-2 font-semibold text-white hover:bg-navy-950"
            >
              Create account
            </button>
          </div>
        </form>
      </section>

      {/* ---------------- list ---------------- */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-navy-900">Accounts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-300 text-left">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Role</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 pr-4 font-semibold">Last sign-in</th>
                <th className="py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-ink-200">
                  <td className="py-3 pr-4">{user.displayName}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4">{user.role}</td>
                  <td className="py-3 pr-4">
                    {user.status}
                    {user.mustChangePassword && (
                      <span className="ml-1 text-xs text-ink-500">(temporary password)</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {user.lastLoginAt === null ? 'never' : user.lastLoginAt.toISOString().slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <form method="POST" action="/coordinator/api/users">
                        <input type="hidden" name={CSRF_FIELD} value={token} />
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="action" value="reset" />
                        <button type="submit" className="min-h-[36px] rounded-panel border border-ink-300 px-3 py-1 text-xs font-semibold hover:bg-ink-50">
                          Reset password
                        </button>
                      </form>
                      {user.id !== admin.id && (
                        <form method="POST" action="/coordinator/api/users">
                          <input type="hidden" name={CSRF_FIELD} value={token} />
                          <input type="hidden" name="user_id" value={user.id} />
                          <input type="hidden" name="action" value={user.status === 'active' ? 'disable' : 'enable'} />
                          <button type="submit" className="min-h-[36px] rounded-panel border border-ink-300 px-3 py-1 text-xs font-semibold hover:bg-ink-50">
                            {user.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- audit ---------------- */}
      <section className="mt-12">
        <h2 className="text-lg font-bold text-navy-900">Recent activity</h2>
        <p className="mt-1 text-sm text-ink-700">
          Append-only. Reads are recorded as well as changes, which is what makes it useful once
          this console holds patient conversations.
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          {auditRows.map((row) => (
            <li key={row.id} className="flex flex-wrap gap-x-3 border-b border-ink-200 py-2">
              <span className="font-mono text-xs text-ink-500">
                {row.at.toISOString().slice(0, 19).replace('T', ' ')}
              </span>
              <span className="font-semibold text-navy-900">{row.action}</span>
              <span className="text-ink-700">{row.actorEmail ?? 'anonymous'}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
