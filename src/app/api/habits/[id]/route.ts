import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getStorageAdapter } from "@/lib/storage/adapterRouter";
import { computeStreaks } from "@/lib/habits";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params  = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId  = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adapter = await getStorageAdapter(userId);
    const habit   = await adapter.get("habits", params.id);
    if (!habit || habit.userId !== userId) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(habit);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params  = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId  = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adapter = await getStorageAdapter(userId);
    const habit   = await adapter.get("habits", params.id);
    if (!habit || habit.userId !== userId) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body = await request.json();

    // Recompute streaks when history changes
    if (body.history !== undefined) {
      const { currentStreak, longestStreak } = computeStreaks(body.history as string[]);
      body.currentStreak = currentStreak;
      body.longestStreak = longestStreak;
    }

    const updated = await adapter.update("habits", params.id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params  = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId  = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adapter = await getStorageAdapter(userId);
    const habit   = await adapter.get("habits", params.id);
    if (!habit || habit.userId !== userId) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    await adapter.delete("habits", params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}
