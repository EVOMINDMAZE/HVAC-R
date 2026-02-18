import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not configured. Rate limiting will use in-memory fallback.');
    return null;
  }

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis client error:', err);
    });

    await redisClient.connect();
    console.log('Redis client connected successfully');
    return redisClient;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function clearMemoryStore(): void {
  memoryStore.clear();
}

function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key);
    }
  }
}

setInterval(cleanupMemoryStore, 60000);

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix || 'ratelimit'}:${identifier}`;
  const now = Date.now();
  const resetAt = new Date(now + config.windowMs);

  const client = await getRedisClient();

  if (client) {
    try {
      const currentCount = await client.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      if (count === 0) {
        await client.setEx(key, Math.ceil(config.windowMs / 1000), '1');
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt,
        };
      }

      if (count >= config.maxRequests) {
        const ttl = await client.ttl(key);
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(now + ttl * 1000),
          retryAfter: ttl,
        };
      }

      await client.incr(key);
      return {
        allowed: true,
        remaining: config.maxRequests - count - 1,
        resetAt,
      };
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error);
    }
  }

  const stored = memoryStore.get(key);
  
  if (!stored || stored.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  if (stored.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(stored.resetAt),
      retryAfter: Math.ceil((stored.resetAt - now) / 1000),
    };
  }

  stored.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - stored.count,
    resetAt: new Date(stored.resetAt),
  };
}

export const defaultRateLimits = {
  api: { windowMs: 60000, maxRequests: 100, keyPrefix: 'api' },
  auth: { windowMs: 900000, maxRequests: 5, keyPrefix: 'auth' },
  calculations: { windowMs: 3600000, maxRequests: 50, keyPrefix: 'calc' },
  upload: { windowMs: 3600000, maxRequests: 20, keyPrefix: 'upload' },
  passwordReset: { windowMs: 3600000, maxRequests: 3, keyPrefix: 'pwdreset' },
};