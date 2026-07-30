import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The unstaffed watch.
 *
 * AirEvac staffs coordinators around the clock, so the alert this drives exists
 * for a specific failure: somebody is at the desk and nobody clicked the
 * switch, or the tab holding the window open was closed. The widget handles
 * that correctly and silently, which is exactly why it goes unnoticed.
 *
 * `chatIsStaffed` is mocked rather than driven through a database, because what
 * is under test is the gap arithmetic and the send-once rule, not the query.
 */

const staffed = vi.hoisted(() => ({ value: true, throws: false }));
const sent = vi.hoisted(() => ({ messages: [] as { subject: string; body: string }[] }));

vi.mock('@/server/chat/presence', () => ({
  chatIsStaffed: async () => {
    if (staffed.throws) throw new Error('db gone');
    return staffed.value;
  },
}));

vi.mock('@/server/mail', () => ({
  sendMail: async (message: { subject: string; body: string }) => {
    sent.messages.push(message);
    return { ok: true };
  },
}));

const { checkStaffing, __resetStaffingState } = await import('@/server/chat/staffing');

const MINUTE = 60_000;

beforeEach(() => {
  __resetStaffingState();
  staffed.value = true;
  staffed.throws = false;
  sent.messages = [];
});

afterEach(() => {
  __resetStaffingState();
});

describe('unstaffed alerting', () => {
  it('says nothing while somebody is available', async () => {
    const result = await checkStaffing(0);

    expect(result.staffed).toBe(true);
    expect(result.unstaffedForMs).toBeNull();
    expect(sent.messages).toEqual([]);
  });

  it('does not alert during a normal shift handover', async () => {
    /*
     * The reason the threshold is not zero. One coordinator signing out a
     * moment before the next signs in is the expected shape of a shift change,
     * and alerting on it would train people to ignore the alert.
     */
    staffed.value = false;
    await checkStaffing(0);
    const result = await checkStaffing(2 * MINUTE);

    expect(result.alertSent).toBe(false);
    expect(sent.messages).toEqual([]);
  });

  it('alerts once the gap passes three minutes', async () => {
    staffed.value = false;
    await checkStaffing(0);
    const result = await checkStaffing(3 * MINUTE);

    expect(result.alertSent).toBe(true);
    expect(sent.messages).toHaveLength(1);
    expect(sent.messages[0]?.subject).toContain('unstaffed');
  });

  it('sends one alert per gap, not one per check', async () => {
    // An alert that repeats every minute is one people filter.
    staffed.value = false;
    await checkStaffing(0);
    await checkStaffing(3 * MINUTE);
    await checkStaffing(4 * MINUTE);
    await checkStaffing(30 * MINUTE);

    expect(sent.messages).toHaveLength(1);
  });

  it('alerts again after recovering and lapsing a second time', async () => {
    staffed.value = false;
    await checkStaffing(0);
    await checkStaffing(3 * MINUTE);
    expect(sent.messages).toHaveLength(1);

    staffed.value = true;
    await checkStaffing(4 * MINUTE);

    staffed.value = false;
    await checkStaffing(10 * MINUTE);
    await checkStaffing(13 * MINUTE);

    expect(sent.messages).toHaveLength(2);
  });

  it('names nobody and carries no conversation content', async () => {
    /*
     * This is an operational alert about a switch. Naming who was or was not
     * signed in would quietly turn it into a performance record that nobody
     * agreed to keep, and it would be kept in an inbox.
     */
    staffed.value = false;
    await checkStaffing(0);
    await checkStaffing(3 * MINUTE);

    const body = sent.messages[0]?.body ?? '';
    expect(body).not.toMatch(/@/); // no email address, so no person
    expect(body).toContain('phone number');
    expect(body).toContain('once per gap');
  });

  it('treats an unreachable database as unknown, not as unstaffed', async () => {
    /*
     * A database we cannot reach is not evidence about staffing, and an email
     * about staffing would be the wrong alarm for a database fault. The
     * console's own failure path reports that separately.
     */
    staffed.throws = true;

    const result = await checkStaffing(0);
    await checkStaffing(30 * MINUTE);

    expect(result.alertSent).toBe(false);
    expect(sent.messages).toEqual([]);
  });

  it('counts the gap from when it started, not from the first check after it', async () => {
    staffed.value = false;
    await checkStaffing(1_000);
    const result = await checkStaffing(1_000 + 3 * MINUTE);

    expect(result.unstaffedForMs).toBe(3 * MINUTE);
    expect(result.alertSent).toBe(true);
  });
});
