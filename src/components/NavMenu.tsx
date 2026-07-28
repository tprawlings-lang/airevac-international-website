'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { NavGroup } from '@/content/navigation';
import { localePath, type Locale } from '@/lib/i18n';

/**
 * Desktop navigation dropdown.
 *
 * REPLACES a `<details>`-based menu that only closed when you clicked the
 * trigger again - so menus accumulated open across the header.
 *
 * BEHAVIOUR
 *  - Hover opens after a short delay; moving away closes after a grace period.
 *    Both delays are "hover intent": sweeping the cursor across the bar on the
 *    way somewhere else must not flash three menus open.
 *  - Click toggles, so a tablet or a click-first user gets the same menu.
 *  - Any open menu closes after 10 seconds of no interaction. This is the
 *    tablet case specifically: there is no pointer to move away, so without a
 *    timeout a tapped menu stays open indefinitely and covers the page.
 *  - Escape closes and returns focus to the trigger.
 *  - Clicking or focusing outside closes.
 *  - Only one menu is open at a time.
 *
 * ACCESSIBILITY
 *  - The trigger is a real `<button>` with `aria-expanded` and `aria-controls`.
 *  - The idle timer is suspended while focus is inside the menu. A keyboard or
 *    screen-reader user reading through six links must never have the menu
 *    yanked out from under them mid-read - WCAG 2.2 SC 2.2.1 (Timing
 *    Adjustable) exists for exactly this.
 *  - `prefers-reduced-motion` is respected by using no transition at all.
 */

/** Delay before a hovered menu opens. Short enough to feel instant. */
const HOVER_OPEN_MS = 120;

/** Grace period after the pointer leaves, so a diagonal path to a link works. */
const HOVER_CLOSE_MS = 300;

/**
 * Idle timeout. Applies to pointerless interaction (tablet taps), where there
 * is no "moved away" event to close on.
 */
const IDLE_CLOSE_MS = 10_000;

export function NavMenu({ groups, locale }: { groups: NavGroup[]; locale: Locale }) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const containerRef = useRef<HTMLUListElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseId = useId();

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current !== null) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimer.current !== null) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearHoverTimer();
    clearIdleTimer();
    setOpenLabel(null);
  }, [clearHoverTimer, clearIdleTimer]);

  /**
   * (Re)starts the idle countdown.
   *
   * Skipped when focus is inside the menu: a keyboard user is actively reading,
   * and closing under them would be a WCAG 2.2 SC 2.2.1 failure. Pointer users
   * get the timeout because for them the menu is transient.
   */
  const restartIdleTimer = useCallback(() => {
    clearIdleTimer();

    const focusInsideMenu =
      containerRef.current !== null &&
      document.activeElement instanceof Node &&
      containerRef.current.contains(document.activeElement) &&
      // The trigger itself does not count as "reading the menu".
      !(document.activeElement instanceof HTMLButtonElement);

    if (focusInsideMenu) return;

    idleTimer.current = setTimeout(() => setOpenLabel(null), IDLE_CLOSE_MS);
  }, [clearIdleTimer]);

  const open = useCallback(
    (label: string) => {
      clearHoverTimer();
      setOpenLabel(label);
      restartIdleTimer();
    },
    [clearHoverTimer, restartIdleTimer],
  );

  // --- Close on outside pointer, outside focus, or Escape -----------------
  useEffect(() => {
    if (openLabel === null) return;

    function onPointerDown(event: PointerEvent) {
      if (
        containerRef.current !== null &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        close();
      }
    }

    function onFocusIn(event: FocusEvent) {
      // Tabbing out of the nav entirely should close it, the same as clicking away.
      if (
        containerRef.current !== null &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        close();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;

      const label = openLabel;
      close();
      // Return focus to the trigger so the user is not dumped at the top of
      // the document (WCAG 2.4.3 Focus Order).
      if (label !== null) triggerRefs.current.get(label)?.focus();
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openLabel, close]);

  // Clear any pending timers on unmount so a fired callback cannot set state
  // on a component that is gone.
  useEffect(
    () => () => {
      clearHoverTimer();
      clearIdleTimer();
    },
    [clearHoverTimer, clearIdleTimer],
  );

  return (
    <ul
      ref={containerRef}
      className="flex items-center gap-1"
      // Any activity inside the nav resets the idle countdown, so a user who is
      // still reading is not interrupted.
      onPointerMove={openLabel === null ? undefined : restartIdleTimer}
    >
      {groups.map((group) => {
        const isOpen = openLabel === group.label;
        const menuId = `${baseId}-${group.label.replace(/\W+/g, '-')}`;

        // A group with no children (For Partners, per the AEI handoff) renders
        // as a plain link: no dropdown, no aria-expanded, no idle timer.
        if (group.links.length === 0 && group.href !== undefined) {
          return (
            <li key={group.label}>
              <Link
                href={localePath(locale, group.href)}
                className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-support-50"
              >
                {group.label}
              </Link>
            </li>
          );
        }

        return (
          <li
            key={group.label}
            className="relative"
            onPointerEnter={(event) => {
              // Touch reports as a pointer enter immediately before the click.
              // Letting it open here would make the subsequent click close it
              // again, so touch is left entirely to onClick.
              if (event.pointerType === 'touch') return;

              clearHoverTimer();
              hoverTimer.current = setTimeout(() => open(group.label), HOVER_OPEN_MS);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'touch') return;

              clearHoverTimer();
              hoverTimer.current = setTimeout(() => {
                setOpenLabel((current) => (current === group.label ? null : current));
              }, HOVER_CLOSE_MS);
            }}
          >
            <button
              type="button"
              ref={(node) => {
                if (node !== null) triggerRefs.current.set(group.label, node);
                else triggerRefs.current.delete(group.label);
              }}
              aria-expanded={isOpen}
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={() => (isOpen ? close() : open(group.label))}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 whitespace-nowrap rounded px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-support-50"
            >
              {group.label}
              <span
                aria-hidden="true"
                className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>

            {/*
             * Rendered but hidden rather than unmounted, so the links stay in
             * the accessibility tree and in the DOM for crawlers. `hidden`
             * removes them from the tab order while closed.
             */}
            <ul
              id={menuId}
              hidden={!isOpen}
              className="absolute left-0 top-full z-30 w-72 rounded-panel border border-ink-300 bg-white p-2 shadow-lg"
            >
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localePath(locale, link.href)}
                    onClick={close}
                    onFocus={clearIdleTimer}
                    onBlur={restartIdleTimer}
                    className="block rounded px-3 py-2 text-sm text-ink-900 hover:bg-support-50"
                  >
                    {link.label}
                    {link.pending !== undefined && (
                      <span className="mt-0.5 block text-xs text-ink-500">{link.pending}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
