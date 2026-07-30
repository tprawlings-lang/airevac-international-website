import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assertNoPhiShape, sendMail } from '@/server/mail';

/**
 * The outgoing-mail guard.
 *
 * This is the boundary between a system that will hold patient conversations
 * and an ordinary mailbox that is not covered by a Business Associate
 * Agreement. It is the one place where a mistake leaves controlled data
 * somewhere it cannot be deleted, audited, or recalled.
 */

describe('assertNoPhiShape', () => {
  it('passes an ordinary notification', () => {
    expect(
      assertNoPhiShape('A chat transcript is ready. Case AE-20260730-4K2P9X. Open the console.').ok,
    ).toBe(true);
  });

  it('refuses clinical vocabulary', () => {
    for (const text of [
      'Patient has a diagnosis of sepsis',
      'DOB 1971-03-02',
      'medical record number 44182',
      'the patient is in the ICU',
      'awaiting surgery',
      'passport number is with the hospital',
      'insurance policy pending',
      'suspected stroke',
    ]) {
      expect(assertNoPhiShape(text).ok, text).toBe(false);
    }
  });

  it('refuses anything shaped like a transcript', () => {
    // Speaker labels are how a chat log looks. If one reaches this function,
    // something has tried to email a conversation.
    expect(assertNoPhiShape('Visitor: my mother fell\nCoordinator: I understand').ok).toBe(false);
  });
});

describe('sendMail', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('does not send when no recipient is configured', async () => {
    delete process.env.OPS_NOTIFICATION_EMAIL;
    const result = await sendMail({ subject: 'Test', body: 'Body' });
    expect(result).toEqual({ sent: false, reason: 'no_recipient' });
  });

  it('treats a missing API key as a working state, not an error', async () => {
    // Logging instead of sending is how this behaves in development and in
    // tests. It must not throw, and it must not pretend it sent.
    process.env.OPS_NOTIFICATION_EMAIL = 'someone@example.com';
    delete process.env.RESEND_API_KEY;

    const result = await sendMail({ subject: 'Test', body: 'Body' });
    expect(result).toEqual({ sent: false, reason: 'unconfigured' });
  });

  it('refuses to send a message whose body looks clinical, before any network call', async () => {
    process.env.OPS_NOTIFICATION_EMAIL = 'someone@example.com';
    process.env.RESEND_API_KEY = 'test-key-that-should-never-be-used';

    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await sendMail({
      subject: 'Transcript',
      body: 'Visitor: my son has a fracture and is in the ICU',
    });

    expect(result).toEqual({ sent: false, reason: 'blocked_phi_shape' });
    // The guard runs before the provider is contacted, so nothing leaves the
    // process even momentarily.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never logs the text that tripped the guard', async () => {
    process.env.OPS_NOTIFICATION_EMAIL = 'someone@example.com';
    process.env.RESEND_API_KEY = 'test-key';
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await sendMail({ subject: 'Transcript', body: 'the patient is in the ICU' });

    // Logging the offending text would put it in the logs, which is the thing
    // the check exists to prevent.
    const logged = error.mock.calls.map((call) => String(call[0])).join(' ');
    expect(logged).not.toContain('ICU');
    expect(logged).toContain('mail.blocked_phi_shape');
  });

  it('never throws when the provider is unreachable', async () => {
    process.env.OPS_NOTIFICATION_EMAIL = 'someone@example.com';
    process.env.RESEND_API_KEY = 'test-key';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    // A mail outage must never fail a visitor's form submission.
    await expect(sendMail({ subject: 'Test', body: 'Body' })).resolves.toEqual({
      sent: false,
      reason: 'rejected',
    });
  });
});
