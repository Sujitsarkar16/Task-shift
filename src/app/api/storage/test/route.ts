/**
 * POST /api/storage/test
 * Tests a storage connection before saving it.
 * Body: { provider, mongoUri?, mongoDbName?, supabaseUrl?, supabaseKey?, sqlitePath? }
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { provider } = body;

    if (provider === "mongodb") {
      const { testMongoConnection } = await import("@/lib/storage/MongoCustomAdapter");
      const result = await testMongoConnection(body.mongoUri ?? "", body.mongoDbName);
      return NextResponse.json(result);
    }

    if (provider === "supabase") {
      const { testSupabaseConnection } = await import("@/lib/storage/SupabaseStorageAdapter");
      const result = await testSupabaseConnection(body.supabaseUrl ?? "", body.supabaseKey ?? "");
      return NextResponse.json(result);
    }

    if (provider === "sqlite") {
      const { testSQLiteConnection } = await import("@/lib/storage/SQLiteStorageAdapter");
      const result = await testSQLiteConnection(body.sqlitePath ?? ":memory:");
      return NextResponse.json(result);
    }

    if (provider === "taskstack") {
      // Always works
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
