import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getStorageAdapter } from "@/lib/storage/adapterRouter";
import { canEdit } from "@/lib/db/workspaceAccess";

type Params = { params: Promise<{ id: string }> };

async function assertAccess(
  adapter: Awaited<ReturnType<typeof getStorageAdapter>>,
  todoId: string,
  userId: string,
  needsWrite = false,
) {
  const todo = await adapter.get("todos", todoId);
  if (!todo) return null;
  if (todo.userId === userId) return todo;
  if (todo.workspaceId) {
    if (needsWrite) {
      const ok = await canEdit(todo.workspaceId as string, userId);
      return ok ? todo : null;
    }
    const { getWorkspaceMember } = await import("@/lib/db/workspaceAccess");
    const member = await getWorkspaceMember(todo.workspaceId as string, userId);
    return member ? todo : null;
  }
  return null;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adapter = await getStorageAdapter(userId);
    const todo    = await assertAccess(adapter, id, userId, false);
    if (!todo) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(todo);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adapter = await getStorageAdapter(userId);
    const todo    = await assertAccess(adapter, id, userId, true);
    if (!todo) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    const body    = await request.json();
    const updated = await adapter.update("todos", id, {
      ...body,
      lastEditedBy:     userId,
      lastEditedByName: session?.user?.name || session?.user?.email || "",
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adapter = await getStorageAdapter(userId);
    const todo    = await assertAccess(adapter, id, userId, true);
    if (!todo) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    await adapter.delete("todos", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
