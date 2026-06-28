/**
 * POST /api/drive/disconnect
 * Removes stored Drive tokens from the user record.
 * After this the user's data will be read/written to MongoDB again.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { removeDriveTokens } from "@/lib/storage/adapterRouter";

export async function POST() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await removeDriveTokens(userId);
  return NextResponse.json({ success: true });
}
