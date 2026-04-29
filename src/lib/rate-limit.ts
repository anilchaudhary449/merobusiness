import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback if Redis is not configured
const memoryCache = new Map<string, number>();

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a new ratelimiter, that allows 5 requests per 5 minutes
    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
    console.log("Upstash Redis Ratelimit initialized successfully.");
  } catch (error) {
    console.warn("Failed to initialize Upstash Redis Ratelimit, falling back to memory:", error);
  }
} else {
  console.warn("Upstash Redis credentials missing. Using in-memory fallback for rate limiting.");
}

/**
 * Checks if a given identifier (e.g., email or IP) has exceeded the rate limit.
 * @param identifier The unique key to rate limit against (e.g., 'auth_user@example.com')
 * @returns { success: boolean, remaining: number }
 */
export async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  // Use Upstash if available
  if (ratelimit) {
    try {
      const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
      return { success, remaining };
    } catch (error) {
      console.error("Upstash rate limit error:", error);
      // Fallback on error to ensure app doesn't crash
    }
  }

  // --- Fallback In-Memory Logic (5 requests per 5 minutes) ---
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxRequests = 5;
  
  // Cleanup old entries to prevent memory leaks (simple version)
  if (Math.random() < 0.01) { // 1% chance to run cleanup
    for (const [key, timestamp] of memoryCache.entries()) {
      if (now - timestamp > windowMs) {
        memoryCache.delete(key);
      }
    }
  }

  // The fallback logic here is a bit simplistic compared to sliding window.
  // We'll track the *first* attempt timestamp and a counter.
  // Actually, let's store an object: { count: number, resetAt: number }
  return handleMemoryRateLimit(identifier, now, windowMs, maxRequests);
}

const advancedMemoryCache = new Map<string, { count: number; resetAt: number }>();

function handleMemoryRateLimit(identifier: string, now: number, windowMs: number, maxRequests: number) {
  const attemptTracker = advancedMemoryCache.get(identifier) || { count: 0, resetAt: now + windowMs };
  
  if (now > attemptTracker.resetAt) {
    attemptTracker.count = 0;
    attemptTracker.resetAt = now + windowMs;
  }

  attemptTracker.count += 1;
  advancedMemoryCache.set(identifier, attemptTracker);

  const success = attemptTracker.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - attemptTracker.count);

  return { success, remaining };
}

export async function resetRateLimit(identifier: string) {
  if (advancedMemoryCache.has(identifier)) {
    advancedMemoryCache.delete(identifier);
  }
  // Upstash Ratelimit doesn't easily support targeted reset of sliding windows via the API.
  // In a real Redis setup, we'd delete the specific keys. For now, we only clear the fallback.
}
