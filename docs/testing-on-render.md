# Testing the chat on Render

How to exercise the whole feature on a Render deploy, including translation,
before the AWS account or the Business Associate Agreement exist.

Nothing here is guesswork about what will happen. Every step was run against a
real Postgres and a real server first.

---

## What is safe to test, and what is not

**Safe on a preview deploy** (any `SITE_URL` that is not the production
domain): everything below. The site serves `noindex` and a disallow-all
`robots.txt`, so nothing is indexed, and stub translation is permitted.

**Not safe on the production domain.** Two things are blocked or shouted about
in code rather than left to memory:

- `TRANSLATION_MODE=stub` is **ignored** on `https://airevacinternational.com`,
  and the stub is never the default there. Showing marked placeholder text to a
  family arranging a medical transport would be worse than showing nothing.
- Chat is **off by default** on the production origin, and setting
  `CHAT_ENABLED=true` there logs a loud startup error. It is not blocked,
  because after the Business Associate Agreement is executed it is exactly what
  you want. Before then, a chat receives patient details within the first
  minute and there is no agreement covering where they land.

What needs a named signature before any of this faces the public is in
[docs/executive-sign-off-register.md](executive-sign-off-register.md).

---

## 1. Add the database

The blueprint in `render.yaml` declares `airevac-db` and wires `DATABASE_URL`
into the web service automatically. If your service predates it, add a Postgres
instance in the Render dashboard and add `DATABASE_URL` from it.

Migrations run from `npm start`, so the schema is created on the first deploy
after the database is attached. No manual step, and no way to serve a schema
the deploy does not have.

Without `DATABASE_URL` the site still runs; the console is simply unavailable.

## 2. Set the environment

**Almost nothing is required.** A preview deploy turns chat on and uses stub
translation by default, so the demo works out of the box. Only the first
sign-in needs a variable set.

Render dashboard, the web service, **Environment**:

| Key | Value for testing | Note |
| --- | --- | --- |
| `ALLOW_BOOTSTRAP_ADMIN` | `true` | **Required.** Lets you sign in the first time. Set it back to `false` afterwards. |
| `SITE_URL` | your `.onrender.com` URL | Keeps the deploy `noindex`, and keeps the preview defaults below in force |
| `OPS_NOTIFICATION_EMAIL` | your address | Where transcript notices go. Defaults to the ops address. |

Two defaults do the rest, and they are asymmetric on purpose — a preview opts
*out*, production opts *in*, so a demo configuration cannot become a launch
configuration by being forgotten:

- **Chat is on** unless `SITE_URL` is `https://airevacinternational.com`. Set
  `CHAT_ENABLED=false` to turn it off anywhere, or `true` to force it on.
- **Stub translation is on** whenever AWS is not fully configured and the
  origin is not production. The moment real AWS credentials appear they take
  over; nobody has to remember to remove a variable. `TRANSLATION_MODE=off`
  disables the stub and leaves chat running untranslated.

Leave `RESEND_API_KEY` unset to begin with. Mail is then logged rather than
sent, which is a working state and lets you confirm *what would have been sent*
in the Render logs before any real message leaves.

## 3. First sign-in

1. Open `https://your-service.onrender.com/coordinator`.
   It is linked from nowhere and is `noindex`, by design.
2. Sign in with **`admin@aeiamericas.com`** / **`admin`**.
3. You are sent straight to the change-password screen and can reach nothing
   else until you set a real one. That is what makes the seeded password safe
   to exist; `admin` itself is refused as the replacement.
4. **Set `ALLOW_BOOTSTRAP_ADMIN` back to `false`** once you are in.

## 4. Create a coordinator

Console → **Manage users** → Add a coordinator. Tick both English and Spanish
if you want to see translation routing skip a bilingual coordinator.

You are shown a one-time password once. It is not stored anywhere, and the new
account must change it on first sign-in, so no administrator ends up knowing a
coordinator's working password.

## 5. Run a conversation

Use two browsers, or one normal and one private window: the visitor and the
coordinator hold different cookies.

**Coordinator:** sign in → **Chat** → **Go available**.

Leave that tab open. Availability is a heartbeat, not a flag, so closing the tab
makes you unavailable within about a minute. That is the mechanism, not a bug.

**Visitor:** open any page and click **Chat with a coordinator**.

Things worth trying, roughly in order of what they prove:

| Try this | What should happen |
| --- | --- |
| Open the widget with **nobody available** | It refuses to open a chat and shows the phone number. This is the state the whole feature is organised around. |
| Go available, then open the widget | The intake form appears |
| Choose **Español** while only an English coordinator is on | A notice appears *before you start*, saying a machine will translate |
| Send a message | It appears for both sides within a second |
| Send from the visitor in Spanish | The coordinator sees `[TEST TRANSLATION ES to EN] ... [NOT A REAL TRANSLATION]` **and** the original beneath it |
| Put a `diagnosis` field in the intake (via devtools) | Rejected, naming the field and never the value |
| Claim a fourth conversation | Refused at three, with a reason |
| Close the coordinator tab, wait a minute, reload the widget | Back to "no coordinator is signed in" |
| End the conversation | A transcript notice appears in the Render logs, carrying a reference and no conversation text |

## 6. Reading what happened

**Render logs** show one JSON line per event. Useful ones:

```
mail.unconfigured_would_send   a notification that would have been sent
chat.started / chat.claimed    lifecycle
config.chat_enabled_in_production   you enabled chat on the live domain
```

No message body ever appears in a log line. If you find one, that is a bug
worth reporting rather than a feature.

**The audit log** is in the console under Manage users. Every sign-in, user
change, chat claim, and transcript read is there, including reads.

## 7. Turning translation real

When the AWS account exists, follow `docs/aws-translate-setup.md`, remove
`TRANSLATION_MODE`, and set the three AWS variables. Then:

```bash
npm run check:translate
```

Stub and real translation are the same code path from the interface's point of
view, so nothing else changes.

---

## Before this becomes real

Set `CHAT_ENABLED=false` again when testing is finished, unless the Business
Associate Agreement is signed. The remaining launch conditions are in the
README under **Before launch**; the two that specifically gate chat are that
agreement and a privacy notice that describes a site which receives clinical
information, because the current one says the opposite.
