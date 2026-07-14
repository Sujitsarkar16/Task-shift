import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's direct TypeScript test runner requires the extension.
import { createFixedWindowRateLimiter } from "./rateLimitCore.ts";

class FakeCollection {
  private records = new Map<string, { count: number; expiresAt: Date }>();

  async findOneAndUpdate(
    filter: { _id: string },
    update: { $inc: { count: number }; $setOnInsert: { expiresAt: Date } },
  ) {
    const existing = this.records.get(filter._id);
    const record = existing
      ? { ...existing, count: existing.count + update.$inc.count }
      : { count: update.$inc.count, expiresAt: update.$setOnInsert.expiresAt };
    this.records.set(filter._id, record);
    return record;
  }
}

test("allows requests within the limit and blocks the next request", async () => {
  const limiter = createFixedWindowRateLimiter(new FakeCollection(), () => new Date("2026-07-14T12:00:00.000Z"));

  assert.equal((await limiter.consume("session", "anonymous", 2, 60_000)).allowed, true);
  assert.equal((await limiter.consume("session", "anonymous", 2, 60_000)).allowed, true);

  const blocked = await limiter.consume("session", "anonymous", 2, 60_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 60);
});
