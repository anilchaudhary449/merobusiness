import { Redis } from '@upstash/redis';

// Only instantiate Redis if the credentials are provided
const hasRedisCredentials = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = hasRedisCredentials 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Safely get an item from Redis cache. Returns null if Redis is not configured or an error occurs.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (e) {
    console.error(`Redis Get Error [${key}]:`, e);
    return null;
  }
}

/**
 * Safely set an item in Redis cache. 
 * @param key Cache key
 * @param value Data to cache
 * @param expirationInSeconds Default is 1 hour (3600 seconds)
 */
export async function setCache<T>(key: string, value: T, expirationInSeconds: number = 3600): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: expirationInSeconds });
  } catch (e) {
    console.error(`Redis Set Error [${key}]:`, e);
  }
}

/**
 * Safely delete an item from Redis cache.
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (e) {
    console.error(`Redis Delete Error [${key}]:`, e);
  }
}
