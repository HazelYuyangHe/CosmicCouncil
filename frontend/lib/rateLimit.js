// lib/rateLimit.js
//
// In-memory sliding-window rate limiter.
// Limits each userId to MAX_REQUESTS calls within WINDOW_MS.
//
// Production upgrade path: replace the Map with Upstash Redis
// (@upstash/ratelimit) to share state across serverless instances.

const WINDOW_MS      = 60_000  // 1 minute
const MAX_REQUESTS   = 5       // per user per window

// userId -> [timestamp, timestamp, ...]
const requests = new Map()

/**
 * Check whether a userId is within the rate limit.
 * Returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(userId) {
  const now    = Date.now()
  const window = now - WINDOW_MS

  // Get existing timestamps for this user, drop anything outside the window
  const timestamps = (requests.get(userId) || []).filter(t => t > window)

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest      = timestamps[0]
    const retryAfterMs = WINDOW_MS - (now - oldest)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  // Record this request
  timestamps.push(now)
  requests.set(userId, timestamps)

  return { allowed: true, remaining: MAX_REQUESTS - timestamps.length, retryAfterMs: 0 }
}

/**
 * Clear all rate limit state for a userId.
 * Used in tests to reset between cases.
 */
export function resetRateLimit(userId) {
  requests.delete(userId)
}

/**
 * Clear all state. Used in tests.
 */
export function resetAllRateLimits() {
  requests.clear()
}