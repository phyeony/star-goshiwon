// Small retry helper for calls that fail for a moment: rate limits, a
// server hiccup, a dropped connection. Each caller decides what counts.

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { delaysMs: number[]; shouldRetry(error: unknown): boolean; sleep?: (ms: number) => Promise<void> },
): Promise<T> {
  const wait = opts.sleep ?? sleep;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= opts.delaysMs.length || !opts.shouldRetry(e)) throw e;
      await wait(opts.delaysMs[attempt]);
    }
  }
}

/**
 * Worth another try: HTTP 429 or 5xx, or the connection failed before any
 * answer (fetch throws a TypeError). Not a timeout: the other side may still
 * have acted on it, and waiting again would hold the chat too long.
 */
export function isTransient(e: unknown, status?: number): boolean {
  if (status !== undefined) return status === 429 || status >= 500;
  return e instanceof TypeError;
}
