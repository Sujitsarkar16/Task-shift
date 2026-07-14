import { createHmac } from "node:crypto";
import { getDatabase } from "@/lib/db/database";
import { createFixedWindowRateLimiter, type RateLimitResult } from "./rateLimitCore";

type HeaderSource = Headers | Record<string, string | string[] | undefined>;

export type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

const RATE_LIMIT_COLLECTION = "rate_limits";
const rateLimitSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "development-rate-limit-key";
let indexesReady: Promise<void> | undefined;

function headerValue(headers: HeaderSource, name: string): string | undefined {
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function hashIdentifier(identifier: string): string {
  return createHmac("sha256", rateLimitSecret).update(identifier).digest("base64url");
}

async function getRateLimitCollection() {
  const database = await getDatabase();
  const collection = database.collection(RATE_LIMIT_COLLECTION);

  if (!indexesReady) {
    indexesReady = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).then(() => undefined);
  }
  await indexesReady;
  return collection;
}

/** Rate-limit an opaque identifier without retaining the identifier in MongoDB. */
export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const collection = await getRateLimitCollection();
  const limiter = createFixedWindowRateLimiter(collection);
  return limiter.consume(options.scope, hashIdentifier(options.identifier), options.limit, options.windowMs);
}

export function getClientIp(headers: HeaderSource): string {
  // Our deployment proxy must overwrite these headers; clients must not be able to append to them.
  const forwarded = headerValue(headers, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerValue(headers, "x-real-ip")?.trim() || "unknown";
}

export function getSessionRateLimitIdentifier(headers: HeaderSource): string {
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  const cookieHeader = headerValue(headers, "cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);

  return token ? `session:${token}` : `ip:${getClientIp(headers)}`;
}
