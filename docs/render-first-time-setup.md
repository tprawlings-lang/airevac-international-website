# Setting up the Render deploy, step by step

Plain-language instructions for getting the preview running from nothing,
including the chat and the coordinator console. No technical background assumed.

If the site is already running and you only want to exercise the chat, go to
[docs/testing-on-render.md](testing-on-render.md) instead.

You will move between two pages in Render: the **database** you are about to
create, and the **web service** that already exists.

---

## Part 1. Create the database

The website runs without a database, but chat does not: conversations, users,
and the audit trail all live there. Without one the site simply does not offer
chat, which is why the button can vanish.

1. Click **+ New**, top right.
2. Choose **Postgres**.
3. Fill in three things and ignore the rest:
   - **Name:** `airevac-db`
   - **Region:** **Virginia**, matching the web service. They cannot reach each
     other across regions.
   - **Instance Type:** a **paid** plan.
4. Click **Create Database**.
5. Wait for the status to reach **Available**.

> **Do not choose the free plan.** Render deletes free databases after 30 days.
> That would take the demo down in the middle of the approval cycle described in
> [docs/executive-sign-off-register.md](executive-sign-off-register.md).

## Part 2. Copy the connection string

6. On the database page, scroll to **Connections**.
7. Find **Internal Database URL** and copy it.

Internal, not External. The internal address stays inside Render's network;
the external one would route database traffic over the public internet for no
benefit. Internal hosts end in `-a`, external ones in
`.virginia-postgres.render.com`.

The string contains the database password. Treat it as a credential: do not
paste it into email, chat, or a ticket. If it leaks, rotate it in Render.

## Part 3. Add four settings to the web service

8. **Dashboard** → **airevac-international-website** → **Environment**.
9. Click **Edit** on the Environment Variables box, and add:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | the Internal Database URL from step 7 |
| `SITE_URL` | the service's own `https://....onrender.com` address |
| `ALLOW_BOOTSTRAP_ADMIN` | `true` |
| `OPS_NOTIFICATION_EMAIL` | the address that should receive notifications |

10. Leave `NODE_VERSION` alone. Add nothing else.
11. **Save.**

If the dashboard offers to add a variable *from a database*, use it for
`DATABASE_URL` rather than pasting: Render then keeps the value current if the
credentials ever rotate. This is what `render.yaml` already declares.

**Do not set `CHAT_ENABLED` or `TRANSLATION_MODE`.** Leaving them unset is what
turns chat and marked test translation on. Both derive their default from
`SITE_URL`: on for any preview address, off on the production domain, so a demo
configuration cannot become a launch configuration by being forgotten. Setting
them by hand can only take features away.

`SITE_URL` matters more than it looks. Unset, it falls back to `localhost`, and
every canonical link on the site then points at a machine that is not on the
internet.

## Part 4. Deploy

12. Saving normally starts a deploy. To be certain: **Manual Deploy** →
    **Deploy latest commit**.
13. Open **Logs** and look for:

```
applied 001_auth.sql
applied 002_chat.sql
```

Those two lines mean the schema was created and the first administrator exists.
Migrations run from `npm start`, so a deploy can never serve a schema it does
not have.

If `DATABASE_URL` is missing or unreachable, the site still boots and serves
normally. It logs that it skipped migrations and does not offer chat. That is a
working state, not an outage: the phone number on every page is the thing that
must never go down.

## Part 5. First sign-in

14. Go to `/coordinator` on the site. It is linked from nowhere and is
    `noindex`, deliberately.
15. Sign in with **`admin@aeiamericas.com`** / **`admin`**.
16. You are sent straight to a change-password screen and can reach nothing
    else until you set a real one. That is what makes the seeded password safe
    to exist. `admin` is refused as the replacement, and the minimum is 12
    characters.
17. Changing it signs you out. That is deliberate: a password change usually
    happens because someone else may know the old one. Sign back in.
18. Set **`ALLOW_BOOTSTRAP_ADMIN` back to `false`** in Render.

## Part 6. A coordinator, and a real conversation

19. **Manage users** → add a coordinator. Tick both English and Spanish to see
    translation routing skip a bilingual coordinator.
20. The one-time password is shown **once** and stored nowhere, so no
    administrator ends up knowing a coordinator's working password. The account
    must change it on first sign-in.
21. **Chat** → **Go available**, and leave the tab open. Availability is a
    heartbeat, not a flag, so a closed tab reads as unavailable within about a
    minute. A coordinator who shut their laptop must not still look available to
    someone at 3am.
22. Open the public site in a **private window** as the visitor: the two sides
    hold different cookies.

What to try, and what each attempt proves, is in
[docs/testing-on-render.md](testing-on-render.md).

---

## When something looks wrong

| What you see | What it means |
| --- | --- |
| No chat button anywhere | No `DATABASE_URL`, or `CHAT_ENABLED=false`. Chat is refused without a database whatever else is set. |
| Button opens, says nobody is signed in | Correct. No coordinator has clicked **Go available**. |
| Canonical links point at `localhost` | `SITE_URL` is unset. |
| Sign-in fails with a server error | The database is attached but migrations have not run. Check the deploy log for the two `applied` lines. |
| `admin` / `admin` is rejected | `ALLOW_BOOTSTRAP_ADMIN` was not `true` when the service started, so no account was seeded. Set it and redeploy. |
