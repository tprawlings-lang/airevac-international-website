'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { getDictionary } from '@/content/dictionary';
import { SITE } from '@/content/site';
import type { Locale } from '@/lib/i18n';

/**
 * The visitor chat widget.
 *
 * THE STATE THAT MATTERS MOST IS `unavailable`, AND IT IS BUILT FIRST. Chat is
 * answered only while a coordinator is signed in. When nobody is, this does not
 * open a form, does not queue silently, and does not show a spinner: it says so
 * and puts the phone number in front of the visitor. Someone at 03:00 who waits
 * on an unattended chat instead of calling a line that is genuinely answered is
 * this feature causing harm rather than failing, and every design choice below
 * is downstream of avoiding that.
 *
 * IT NEVER COMPETES WITH THE PHONE. The phone number is present in every state,
 * including mid-conversation. Chat is offered as an alternative to calling, not
 * as the faster route, because it is not the faster route.
 *
 * NO RESPONSE TIME IS STATED ANYWHERE, in any state, including the queue. None
 * is published on this site and none can be promised before a case is reviewed.
 *
 * The launcher sits above the mobile call bar rather than beside it. A widget
 * that covers the one-tap call button on a phone would be trading the reliable
 * contact path for the unreliable one.
 */

type Phase =
  | 'idle'
  | 'checking'
  | 'unavailable'
  | 'intake'
  | 'starting'
  | 'waiting'
  | 'active'
  | 'ended'
  | 'error';

interface Message {
  id: string;
  sender: 'visitor' | 'coordinator' | 'system';
  body: string;
  language: string;
  translated: string | null;
  translatedLanguage: string | null;
  translationError: string | null;
  at: string;
}

/**
 * Subscribe for the hydration probe below. Nothing ever changes it, so it
 * returns a no-op unsubscribe. Declared at module scope because a new function
 * identity on each render would make React resubscribe every time.
 */
const subscribeNever = () => () => {};

interface Availability {
  enabled: boolean;
  staffed: boolean;
  languages: string[];
  translation: boolean;
}

export function ChatWidget({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const t = dictionary.chat;

  /*
   * Hydration guard. The launcher is useless without JavaScript: every state it
   * reaches comes from a fetch. Server-rendering it means it appears, looks
   * clickable, and silently does nothing until React attaches, which on a
   * cold-started instance is seconds rather than milliseconds. A visitor who
   * taps it in that window gets no panel, no error, and no reason to try again.
   *
   * So it does not exist until it works. There is no layout shift to trade
   * against, because the launcher is fixed-position and occupies no flow space.
   */
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reference, setReference] = useState('');
  const [errorKey, setErrorKey] = useState<'generic' | 'nobody' | 'rate'>('generic');
  const [chosenLanguage, setChosenLanguage] = useState<string>(locale);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  /*
   * Availability is checked when the panel opens, not on page load. Asking on
   * every page view would put a database query behind every marketing page for
   * information almost nobody acts on.
   */
  const checkAvailability = useCallback(async () => {
    setPhase('checking');
    try {
      const response = await fetch('/api/chat/availability', { cache: 'no-store' });
      const data = (await response.json()) as Availability;
      setAvailability(data);
      setPhase(data.enabled && data.staffed ? 'intake' : 'unavailable');
    } catch {
      // A failed check is treated as nobody available. Failing toward the phone
      // is the correct direction.
      setPhase('unavailable');
    }
  }, []);

  /** Escape closes the panel, as it does for the site navigation. */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  /** Moves focus into the panel so a keyboard user is not left behind it. */
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open, phase]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  /*
   * The live stream. EventSource reconnects on its own and replays from
   * Last-Event-ID, so a dropped connection recovers without losing what was
   * said during the gap.
   */
  const connectStream = useCallback(() => {
    if (eventSourceRef.current !== null) return;

    const source = new EventSource('/api/chat/stream');
    eventSourceRef.current = source;

    source.addEventListener('message', (event) => {
      const message = JSON.parse((event as MessageEvent).data) as Message;
      setMessages((current) =>
        current.some((existing) => existing.id === message.id) ? current : [...current, message],
      );
    });

    source.addEventListener('claimed', () => setPhase('active'));
    source.addEventListener('closed', () => {
      setPhase('ended');
      source.close();
      eventSourceRef.current = null;
    });
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  async function startChat(form: FormData) {
    setPhase('starting');

    const payload = {
      role: String(form.get('role')),
      contactName: String(form.get('contactName')),
      phone: String(form.get('phone')),
      organization: String(form.get('organization') ?? ''),
      originCity: String(form.get('originCity') ?? ''),
      destinationCity: String(form.get('destinationCity') ?? ''),
      timeframe: String(form.get('timeframe')),
      preferredLanguage: String(form.get('preferredLanguage')),
    };

    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 409) {
        setErrorKey('nobody');
        setPhase('error');
        return;
      }
      if (response.status === 429) {
        setErrorKey('rate');
        setPhase('error');
        return;
      }
      if (!response.ok) {
        setErrorKey('generic');
        setPhase('error');
        return;
      }

      const data = (await response.json()) as { reference: string };
      setReference(data.reference);
      setPhase('waiting');
      connectStream();
    } catch {
      setErrorKey('generic');
      setPhase('error');
    }
  }

  async function send() {
    const text = draft.trim();
    if (text === '' || sending) return;

    setSending(true);
    setDraft('');
    try {
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch {
      // The message is not lost from the visitor's view: the stream will not
      // echo it, so they can see it did not send and retype it.
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  const phoneBlock = (
    <p className="mt-3 text-sm">
      <a
        href={SITE.phone.href}
        className="font-semibold text-navy-900 underline underline-offset-4"
      >
        {SITE.phone.display}
      </a>{' '}
      <span className="text-ink-700">{dictionary.common.call24_7}</span>
    </p>
  );

  if (!ready) return null;

  return (
    <>
      {/* Launcher. `bottom-24` on small screens clears the mobile call bar so
          the one-tap call button is never covered. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          // Checked on open rather than in an effect: opening the panel is an
          // event, not a synchronization, and doing it in an effect sets state
          // synchronously during render and cascades.
          if (next && phase === 'idle') void checkAvailability();
        }}
        aria-expanded={open}
        aria-controls="chat-panel"
        className="fixed bottom-24 right-4 z-40 min-h-[44px] rounded-panel bg-navy-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-navy-950 sm:bottom-6"
      >
        {open ? t.close : t.launch}
      </button>

      {open && (
        <div
          id="chat-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={t.heading}
          tabIndex={-1}
          /*
           * The height cap subtracts the launcher offset rather than trusting
           * 70vh alone. `bottom-40` plus 70vh exceeds the viewport on anything
           * shorter than about 533px, which is a phone in landscape and any
           * pinch-zoomed tablet, and the overflow goes off the TOP of the
           * screen where the heading and the phone number live. dvh rather
           * than vh so a mobile toolbar sliding in does not reintroduce it.
           */
          className="fixed bottom-40 right-4 z-40 flex max-h-[min(70vh,calc(100dvh-12rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-panel border border-ink-300 bg-white shadow-2xl sm:bottom-20 sm:max-h-[min(70vh,calc(100dvh-7rem))]"
        >
          <div className="border-b border-ink-200 bg-navy-900 px-4 py-3">
            <h2 className="text-sm font-bold text-white">{t.heading}</h2>
            {reference !== '' && (
              <p className="mt-0.5 text-xs text-white/80">
                {t.reference}: {reference}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {phase === 'checking' && <p className="text-sm text-ink-700">{t.reconnecting}</p>}

            {/* ---------------- nobody available ---------------- */}
            {phase === 'unavailable' && (
              <div>
                <h3 className="text-base font-bold text-navy-900">{t.unavailableHeading}</h3>
                <p className="mt-2 text-sm text-ink-700">{t.unavailableBody}</p>
                {phoneBlock}
              </div>
            )}

            {phase === 'error' && (
              <div role="alert">
                <p className="text-sm text-ink-900">
                  {errorKey === 'nobody'
                    ? t.errorNobodyAvailable
                    : errorKey === 'rate'
                      ? t.errorRateLimited
                      : t.errorGeneric}
                </p>
                {phoneBlock}
              </div>
            )}

            {/* ---------------- intake ---------------- */}
            {(phase === 'intake' || phase === 'starting') && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void startChat(new FormData(event.currentTarget));
                }}
                className="space-y-3 text-sm"
              >
                <p className="text-ink-700">{t.intakeIntro}</p>

                <label className="block">
                  <span className="font-semibold text-navy-900">{t.roleLabel}</span>
                  <select
                    name="role"
                    required
                    className="mt-1 w-full rounded-panel border border-ink-300 px-2 py-2"
                  >
                    <option value="family">{t.roleFamily}</option>
                    <option value="hospital">{t.roleHospital}</option>
                    <option value="cruise">{t.roleCruise}</option>
                    <option value="insurer">{t.roleInsurer}</option>
                  </select>
                </label>

                <label className="block">
                  <span className="font-semibold text-navy-900">{t.nameLabel}</span>
                  <input
                    name="contactName"
                    required
                    minLength={2}
                    className="mt-1 w-full rounded-panel border border-ink-300 px-2 py-2"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold text-navy-900">{t.phoneLabel}</span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    aria-describedby="chat-phone-help"
                    className="mt-1 w-full rounded-panel border border-ink-300 px-2 py-2"
                  />
                  <span id="chat-phone-help" className="mt-1 block text-xs text-ink-500">
                    {t.phoneHelp}
                  </span>
                </label>

                <label className="block">
                  <span className="font-semibold text-navy-900">
                    {t.originLabel}{' '}
                    <span className="font-normal text-ink-500">
                      ({dictionary.common.optional})
                    </span>
                  </span>
                  <input
                    name="originCity"
                    className="mt-1 w-full rounded-panel border border-ink-300 px-2 py-2"
                  />
                </label>

                <label className="block">
                  <span className="font-semibold text-navy-900">{t.timeframeLabel}</span>
                  <select
                    name="timeframe"
                    className="mt-1 w-full rounded-panel border border-ink-300 px-2 py-2"
                  >
                    <option value="immediate">{t.timeframeImmediate}</option>
                    <option value="within_24h">{t.timeframe24}</option>
                    <option value="within_72h">{t.timeframe72}</option>
                    <option value="planning">{t.timeframePlanning}</option>
                  </select>
                </label>

                <label className="block">
                  <span className="font-semibold text-navy-900">{t.languageLabel}</span>
                  <select
                    name="preferredLanguage"
                    defaultValue={locale}
                    onChange={(event) => setChosenLanguage(event.target.value)}
                    className="mt-1 w-full rounded-panel border border-ink-300 px-2 py-2"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </label>

                {/*
                 * Told before they start, not discovered mid-conversation.
                 * Nobody on shift reads this language, so either a machine
                 * will translate it or it will not be translated at all, and
                 * both are worth knowing before typing about a patient.
                 */}
                {availability !== null &&
                  !availability.languages.includes(chosenLanguage) && (
                    <p className="rounded-panel bg-support-50 px-3 py-2 text-xs text-ink-700">
                      {availability.translation
                        ? t.machineTranslated
                        : t.translationUnavailable}
                    </p>
                  )}

                <button
                  type="submit"
                  disabled={phase === 'starting'}
                  className="min-h-[44px] w-full rounded-panel bg-navy-900 px-4 py-2 font-semibold text-white hover:bg-navy-950 disabled:opacity-60"
                >
                  {phase === 'starting' ? t.starting : t.start}
                </button>
              </form>
            )}

            {/* ---------------- queued / live ---------------- */}
            {(phase === 'waiting' || phase === 'active' || phase === 'ended') && (
              <div>
                {phase === 'waiting' && (
                  <div className="mb-4 rounded-panel bg-support-50 px-3 py-2">
                    <p className="text-sm font-semibold text-navy-900">{t.waitingHeading}</p>
                    {/* No response time, in any state. */}
                    <p className="mt-1 text-xs text-ink-700">{t.waitingBody}</p>
                    {phoneBlock}
                  </div>
                )}

                <ul aria-live="polite" aria-relevant="additions" className="space-y-3">
                  {messages.map((message) => (
                    <li
                      key={message.id}
                      className={
                        message.sender === 'visitor'
                          ? 'ml-6 rounded-panel bg-navy-900 px-3 py-2 text-sm text-white'
                          : 'mr-6 rounded-panel bg-ink-100 px-3 py-2 text-sm text-ink-900'
                      }
                    >
                      <span className="block text-xs font-semibold opacity-80">
                        {message.sender === 'visitor' ? t.youLabel : t.coordinatorLabel}
                      </span>

                      {/*
                       * Translation is additive. When a translation exists the
                       * visitor reads it first, and the original stays visible
                       * beneath it, labelled. Nothing here ever replaces one
                       * with the other.
                       */}
                      {message.translated !== null ? (
                        <>
                          <span className="mt-1 block">{message.translated}</span>
                          <span className="mt-2 block border-t border-current/20 pt-1 text-xs opacity-75">
                            <span className="font-semibold">{t.originalLabel}: </span>
                            {message.body}
                          </span>
                          <span className="mt-1 block text-xs italic opacity-70">
                            {t.machineTranslated}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="mt-1 block">{message.body}</span>
                          {message.translationError !== null && (
                            <span className="mt-1 block text-xs italic opacity-70">
                              {t.translationUnavailable}
                            </span>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                  <div ref={transcriptEndRef} />
                </ul>

                {phase === 'ended' && (
                  <div className="mt-4 rounded-panel bg-ink-100 px-3 py-2">
                    <p className="text-sm font-semibold text-navy-900">{t.endedHeading}</p>
                    <p className="mt-1 text-xs text-ink-700">{t.endedBody}</p>
                    {phoneBlock}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---------------- composer ---------------- */}
          {(phase === 'waiting' || phase === 'active') && (
            <div className="border-t border-ink-200 px-3 py-3">
              {/* Documents stay on email and fax. There is no upload here, and
                  the copy says why rather than leaving someone to try. */}
              <p className="mb-2 text-xs text-ink-500">{t.noRecordsNotice}</p>
              <div className="flex gap-2">
                <label htmlFor="chat-composer" className="sr-only">
                  {t.composerLabel}
                </label>
                <textarea
                  id="chat-composer"
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void send();
                    }
                  }}
                  placeholder={t.composerPlaceholder}
                  maxLength={4000}
                  className="flex-1 rounded-panel border border-ink-300 px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={sending || draft.trim() === ''}
                  className="min-h-[44px] rounded-panel bg-navy-900 px-3 font-semibold text-white disabled:opacity-50"
                >
                  {t.send}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
