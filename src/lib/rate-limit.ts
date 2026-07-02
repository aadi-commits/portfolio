/**
 * Fixed-window rate limiter.
 *
 * Uses Redis when REDIS_URL is set, otherwise transparently falls back to an
 * in-memory Map so the app runs with ZERO infra during local dev.
 *
 * The in-memory store is per-process (won't work across serverless instances),
 * which is exactly why Redis is the production path — but the fallback keeps
 * `npm run dev` friction-free.
 */

import type Redis from "ioredis";

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the current window resets. */
  reset: number;
};

/* --------------------------- Redis (lazy, optional) --------------------------- */

let redis: Redis | null = null;
let redisTried = false;

async function getRedis(): Promise<Redis | null> {
  if (redisTried) return redis;
  redisTried = true;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    // Dynamic import so the dependency is only touched when actually configured.
    const { default: IORedis } = await import("ioredis");
    redis = new IORedis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    redis.on("error", () => {
      /* swallow — we degrade to in-memory on failure below */
    });
    await redis.connect();
    return redis;
  } catch {
    redis = null;
    return null;
  }
}

/* ------------------------------ In-memory store ------------------------------ */

const memoryStore = new Map<string, { count: number; reset: number }>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.reset <= now) {
    const reset = now + windowMs;
    memoryStore.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return {
    success: entry.count <= limit,
    limit,
    remaining,
    reset: entry.reset,
  };
}

// Opportunistically evict expired keys so the Map doesn't grow unbounded.
function sweepMemory() {
  const now = Date.now();
  for (const [k, v] of memoryStore) {
    if (v.reset <= now) memoryStore.delete(k);
  }
}

/* --------------------------------- Public API -------------------------------- */

/**
 * @param identifier  Stable caller id (e.g. IP address).
 * @param opts.limit  Max requests per window.
 * @param opts.windowMs  Window length in milliseconds.
 */
export async function rateLimit(
  identifier: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<RateLimitResult> {
  const limit = opts.limit ?? 15;
  const windowMs = opts.windowMs ?? 60_000;
  const key = `ratelimit:${identifier}`;

  const client = await getRedis();

  if (client) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      // INCR then set TTL on first hit — classic fixed-window counter.
      const count = await client.incr(key);
      if (count === 1) await client.expire(key, windowSec);
      const ttl = await client.pttl(key);
      const reset = Date.now() + (ttl > 0 ? ttl : windowMs);
      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset,
      };
    } catch {
      // Redis hiccup → don't lock users out, fall through to memory.
    }
  }

  if (memoryStore.size > 5_000) sweepMemory();
  return memoryLimit(key, limit, windowMs);
}

/** Which backend is active — handy for a health/debug response. */
export function rateLimitBackend(): "redis" | "memory" {
  return redis ? "redis" : "memory";
}
