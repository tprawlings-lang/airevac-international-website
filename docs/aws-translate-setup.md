# AWS Translate setup

Everything needed to switch chat translation on, in the order it should be
done. Nothing here touches hosting: the site stays on Render, and AWS is used
for Translate alone.

Until this is finished, chat runs untranslated and says so. That is a working
state, not a broken one, so there is no rush beyond the point at which a
Spanish-speaking visitor needs a Spanish-speaking coordinator who is not on
shift.

---

## 1. Accept the Business Associate Addendum first

**Do this before generating any key.** Message text leaves our systems for
Amazon's, so Translate needs the same coverage the database has. AWS Translate
is HIPAA-eligible, and eligibility only applies under an executed addendum.

1. Sign in to the AWS console as the account root or an administrator.
2. Open **AWS Artifact** → **Agreements** → **AWS Business Associate Addendum**.
3. Read, accept, and download a copy for the compliance file.

It is self-service and takes a few minutes. There is no sales call.

## 2. Create an IAM user that can do exactly one thing

Not root credentials, and nothing broader than the policy below. This key sits
in a web application; if it leaks, the blast radius should be "someone can
translate text at our expense" and nothing else.

1. IAM → **Users** → **Create user**, named something like
   `airevac-website-translate`.
2. Do **not** grant console access. This identity is for the application.
3. Attach an inline policy with exactly this content:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TranslateTextOnly",
      "Effect": "Allow",
      "Action": "translate:TranslateText",
      "Resource": "*"
    }
  ]
}
```

`translate:TranslateText` is the only action the application calls. It cannot
create custom terminologies, start batch jobs, read S3, or see any other
service.

4. Create an **access key** for the user, choosing "Application running outside
   AWS". Copy both halves; the secret is shown once.

## 3. Choose a region

Any region where Translate is available works. `us-east-1` is the usual default
and is closest to the Fort Lauderdale base and the Render Virginia region, which
keeps the round trip short. A message waits on this call, so latency is felt by
someone in a conversation.

## 4. Set three environment variables in Render

Render dashboard → the web service → **Environment**:

| Key | Value |
| --- | --- |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | from step 2 |
| `AWS_SECRET_ACCESS_KEY` | from step 2 |

Mark the two credentials as secret. Render redeploys on save.

The application treats all three as required together: with any of them missing
it behaves as unconfigured rather than failing on every message, so a
half-finished setup degrades quietly instead of breaking chat.

## 5. Verify it actually works

```bash
npm run check:translate
```

It performs a real round trip in both directions and prints what came back. It
is the only way to know the key, the region, and the permission are all correct
together, and it costs a fraction of a cent.

Expected output:

```
AWS Translate check
  region: us-east-1
  credentials: present

  en -> es  "The receiving hospital has accepted the patient."
         -> "El hospital receptor ha aceptado al paciente."
  es -> en  "Mi madre se cayo y esta en el hospital."
         -> "My mother fell and is in the hospital."

Translation is configured and working.
```

If it fails it will say which of the three things is wrong rather than printing
an AWS stack trace.

---

## What this does not cover

**Nothing else moves to AWS.** Hosting, the database, and the mail path stay
where they are. The application has almost no coupling to Render (one deploy
file), so a later move remains a dump, a restore, and an environment variable,
but that is a separate decision and not this one.

**Translation quality is not accuracy.** Machine translation is offered to both
sides with the original always visible beside it, and the interface says it is
machine translated. A coordinator who needs certainty on a clinical detail
should confirm it by phone with an interpreter, and the copy says so.

## Cost

Translate is priced per character, in the region of a few dollars per million.
A busy chat month is unlikely to reach a dollar. It is not a line item worth
monitoring, but the IAM policy above means a leaked key cannot become one.
