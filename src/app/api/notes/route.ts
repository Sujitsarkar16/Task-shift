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

    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = { userId };
    if (searchParams.has("type")) filter.type = searchParams.get("type");

    const adapter = await getStorageAdapter(userId);
    const notes   = await adapter.list("notes", filter);
    return NextResponse.json(notes);
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
    const note    = await adapter.create("notes", {
      ...body,
      userId,
      content: body.content ?? "",
      type:    body.type    ?? "text",
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}
