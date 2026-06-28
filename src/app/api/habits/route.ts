import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getStorageAdapter } from "@/lib/storage/adapterRouter";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adapter = await getStorageAdapter(userId);
    const habits  = await adapter.list("habits", { userId });
    return NextResponse.json(habits);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body    = await request.json();
    const adapter = await getStorageAdapter(userId);
    const habit   = await adapter.create("habits", {
      ...body,
      userId,
      history:       body.history       ?? [],
      currentStreak: body.currentStreak ?? 0,
      longestStreak: body.longestStreak ?? 0,
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}
