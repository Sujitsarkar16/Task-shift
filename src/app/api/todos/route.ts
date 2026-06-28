import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { listDocuments, createDocument, getDatabase } from "@/lib/db/database";
import { getUserWorkspaceIds } from "@/lib/db/workspaceAccess";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (workspaceId) {
      // Workspace-scoped: return todos shared to this workspace
      const { getWorkspaceMember } = await import("@/lib/db/workspaceAccess");
      const member = await getWorkspaceMember(workspaceId, userId);
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const db    = await getDatabase();
      const query: Record<string, unknown> = { workspaceId };
      if (searchParams.get("isCompleted")) query.isCompleted = searchParams.get("isCompleted") === "true";
      if (searchParams.get("priority"))    query.priority    = searchParams.get("priority");
      const docs = await db.collection("todos").find(query).sort({ createdAt: -1 }).limit(200).toArray();
      const { serializeDocument } = await import("@/lib/db/database");
      return NextResponse.json(docs.map(serializeDocument));
    }

    // Personal: own todos + todos shared in any workspace the user belongs to
    const workspaceIds = await getUserWorkspaceIds(userId);
    const query: Record<string, unknown> = {};
    if (searchParams.get("isCompleted")) query.isCompleted = searchParams.get("isCompleted") === "true";
    if (searchParams.get("priority"))    query.priority    = searchParams.get("priority");

    const db   = await getDatabase();
    const filter: Record<string, unknown> = {
      ...query,
      $or: [
        { userId },
        ...(workspaceIds.length > 0 ? [{ workspaceId: { $in: workspaceIds } }] : []),
      ],
    };

    const docs = await db.collection("todos").find(filter).sort({ createdAt: -1 }).limit(200).toArray();
    const { serializeDocument } = await import("@/lib/db/database");
    return NextResponse.json(docs.map(serializeDocument));
  } catch (err: any) {
    console.error("Error fetching todos:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: err.status || 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // If sharing to a workspace, verify membership + edit rights
    if (body.workspaceId) {
      const { canEdit } = await import("@/lib/db/workspaceAccess");
      if (!(await canEdit(body.workspaceId, userId)))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newTodo = await createDocument("todos", {
      ...body,
      userId,
      createdByName: session?.user?.name || session?.user?.email || "",
    });
    return NextResponse.json(newTodo, { status: 201 });
  } catch (err: any) {
    console.error("Error creating todo:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: err.status || 500 });
  }
}
