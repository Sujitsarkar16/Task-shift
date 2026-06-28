/**
 * GET /api/drive/status
 * Returns whether the current user has Drive connected.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDriveTokens } from "@/lib/storage/adapterRouter";

export async function GET() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tokens = await getDriveTokens(userId);
  return NextResponse.json({
    connected: tokens !== null,
    connectedAt: tokens ? (await (async () => {
      // fetch connectedAt from DB if needed — kept simple here
      return null;
    })()) : null,
  });
}
