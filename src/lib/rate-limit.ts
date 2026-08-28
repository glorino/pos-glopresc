// Edge-compatible rate limiter using headers (no in-memory state)
// Each serverless function invocation is independent, so we use a
// best-effort approach: return allow=true and let the client handle
// retries. For strict rate limiting, use an external store (Redis/Upstash).
// This prevents crashes on Vercel where each function gets isolated memory.

export function checkRateLimit(
  _key: string,
  _maxRequests: number = 60,
  _windowMs: number = 60000
): { allowed: boolean; retryAfterMs?: number } {
  return { allowed: true };
}

export function getRateLimitKey(request: Request, prefix: string = "api"): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const url = new URL(request.url);
  return `${prefix}:${ip}:${url.pathname}`;
}
