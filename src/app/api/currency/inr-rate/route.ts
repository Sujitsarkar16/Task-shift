import { NextResponse } from "next/server";

// Cache the rate in module memory for 1 hour to avoid hammering the free API
let cachedRate: number | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FALLBACK_RATE = 84.5; // reasonable fallback if API is down

export async function GET() {
  try {
    const now = Date.now();

    // Return cached rate if still fresh
    if (cachedRate && now - cacheTime < CACHE_TTL_MS) {
      return NextResponse.json({ rate: cachedRate, cached: true, updatedAt: new Date(cacheTime).toISOString() });
    }

    // Fetch from open.er-api.com — free tier, no API key needed
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 }, // Next.js ISR cache layer
    });

    if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);

    const data = await res.json();
    const rate: number = data?.rates?.INR;

    if (!rate || typeof rate !== "number") {
      throw new Error("Invalid rate in response");
    }

    cachedRate = rate;
    cacheTime = now;

    return NextResponse.json({
      rate,
      cached: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[currency/inr-rate]", err);
    // Return fallback so the UI never breaks
    return NextResponse.json(
      { rate: FALLBACK_RATE, cached: true, fallback: true, updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
