import { cookies } from 'next/headers';

/**
 * The visitor's chat cookie.
 *
 * The visitor is not authenticated, so this token is the only thing binding a
 * browser to a conversation. It is `httpOnly`, so no script can read it and an
 * XSS bug on a marketing page cannot lift someone's conversation.
 *
 * `sameSite: 'lax'` rather than `strict`, unlike the console. A visitor may
 * arrive on a route page from a search result, open the chat, then follow a
 * link; strict would drop the cookie on cross-site navigations and lose them
 * their conversation mid-sentence. Lax still blocks the cross-site POST that
 * matters.
 *
 * Path is `/` because the widget is on every page except the request form.
 */

export const CHAT_COOKIE = 'aei_chat';

/** Matches the transcript retention window; the row is gone before this. */
const MAX_AGE_SECONDS = 60 * 60 * 12;

export async function setChatCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(CHAT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readChatCookie(): Promise<string> {
  const store = await cookies();
  return store.get(CHAT_COOKIE)?.value ?? '';
}

export async function clearChatCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CHAT_COOKIE);
}
