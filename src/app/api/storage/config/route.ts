/**
 * GET  /api/storage/config  — get current storage config (sanitized, no secrets)
 * POST /api/storage/config  — save new storage config
 * DELETE /api/storage/config — reset to TaskStack default
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getStorageConfig, saveStorageConfig, removeStorageConfig } from "@/lib/storage/adapterRouter";
import type { StorageConfig } from "@/lib/storage/adapterRouter";

/** Strip secrets from the config before returning to the client */
function sanitize(config: StorageConfig): Record<string, unknown> {
  return {
    provider:     config.provider,
    mongoUri:     config.mongoUri     ? "***configured***" : undefined,
    mongoDbName:  config.mongoDbName,
    supabaseUrl:  config.supabaseUrl,
    supabaseKey:  config.supabaseKey  ? "***configured***" : undefined,
    sqlitePath:   config.sqlitePath,
    driveConnected: config.provider === "drive" && !!config.driveAccessToken,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await getStorageConfig(userId);
    return NextResponse.json(sanitize(config));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: StorageConfig = await request.json();

    // Validate required fields per provider
    if (body.provider === "mongodb" && !body.mongoUri)
      return NextResponse.json({ error: "mongoUri is required" }, { status: 400 });
    if (body.provider === "supabase" && (!body.supabaseUrl || !body.supabaseKey))
      return NextResponse.json({ error: "supabaseUrl and supabaseKey are required" }, { status: 400 });

    // Sanitize — never allow client to set drive tokens directly
    const safe: StorageConfig = {
      provider:    body.provider,
      mongoUri:    body.mongoUri,
      mongoDbName: body.mongoDbName,
      supabaseUrl: body.supabaseUrl,
      supabaseKey: body.supabaseKey,
      sqlitePath:  body.sqlitePath,
    };

    await saveStorageConfig(userId, safe);
    return NextResponse.json({ success: true, config: sanitize(safe) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await removeStorageConfig(userId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
