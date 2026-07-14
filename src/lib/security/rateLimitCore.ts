export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type RateLimitRecord = {
  count: number;
  expiresAt: Date;
};

type RateLimitCollection = {
  findOneAndUpdate(
    filter: { _id: string },
    update: { $inc: { count: number }; $setOnInsert: { expiresAt: Date } },
    options: { upsert: true; returnDocument: "after"; projection: { count: 1; expiresAt: 1 } },
  ): Promise<RateLimitRecord | { value: RateLimitRecord | null } | null>;
};

function documentFrom(result: RateLimitRecord | { value: RateLimitRecord | null } | null): RateLimitRecord {
  if (!result) throw new Error("Rate-limit record was not returned.");
  if ("value" in result) {
    if (!result.value) throw new Error("Rate-limit record was not returned.");
    return result.value;
  }
  return result;
}

/**
 * Creates a fixed-window limiter backed by an atomic MongoDB increment.
 * The caller must pass a one-way identifier, never an email, IP, or token.
 */
export function createFixedWindowRateLimiter(
  collection: RateLimitCollection,
  now: () => Date = () => new Date(),
) {
  return {
    async consume(scope: string, identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
      const currentTime = now();
      const windowStart = Math.floor(currentTime.getTime() / windowMs) * windowMs;
      const expiresAt = new Date(windowStart + windowMs);
      const record = documentFrom(await collection.findOneAndUpdate(
        { _id: `${scope}:${identifier}:${windowStart}` },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, returnDocument: "after", projection: { count: 1, expiresAt: 1 } },
      ));

      return {
        allowed: record.count <= limit,
        retryAfterSeconds: Math.max(1, Math.ceil((record.expiresAt.getTime() - currentTime.getTime()) / 1000)),
      };
    },
  };
}
