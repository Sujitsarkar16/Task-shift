import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getStorageAdapter } from "@/lib/storage/adapterRouter";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params  = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId  = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adapter = await getStorageAdapter(userId);
    const note    = await adapter.get("notes", params.id);
    if (!note || note.userId !== userId) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(note);
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
    const note    = await adapter.get("notes", params.id);
    if (!note || note.userId !== userId) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const body    = await request.json();
    const updated = await adapter.update("notes", params.id, body);
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
    const note    = await adapter.get("notes", params.id);
    if (!note || note.userId !== userId) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    await adapter.delete("notes", params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.status || 500 });
  }
}
