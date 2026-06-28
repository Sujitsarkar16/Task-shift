import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDatabase, serializeDocument } from "@/lib/db/database";
import { getWorkspaceMember, isOwner } from "@/lib/db/workspaceAccess";
import { ObjectId } from "mongodb";

type Params = { params: Promise<{ id: string }> };

/** GET /api/workspaces/:id — get workspace details + members */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await getWorkspaceMember(id, userId);
    if (!member) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const db = await getDatabase();
    const workspace = await db.collection("workspaces").findOne({ _id: new ObjectId(id) });
    if (!workspace) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    const members = await db.collection("workspaceMembers").find({ workspaceId: id }).toArray();

    return NextResponse.json({
      workspace: serializeDocument(workspace),
      members: members.map(({ _id, inviteToken, ...rest }) => ({ ...rest, id: (_id as any).toString() })),
      myRole: member.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** PATCH /api/workspaces/:id — rename (owner only) */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await isOwner(id, userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    const db = await getDatabase();
    const result = await db.collection("workspaces").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name: name.trim().slice(0, 80), updatedAt: new Date() } },
      { returnDocument: "after", includeResultMetadata: false },
    );
    return NextResponse.json(serializeDocument(result));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** DELETE /api/workspaces/:id — delete workspace (owner only) */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await isOwner(id, userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getDatabase();
    await db.collection("workspaces").deleteOne({ _id: new ObjectId(id) });
    await db.collection("workspaceMembers").deleteMany({ workspaceId: id });
    // Remove workspaceId from shared items
    for (const col of ["todos", "habits", "notes", "subscriptions"]) {
      await db.collection(col).updateMany({ workspaceId: id }, { $unset: { workspaceId: "" } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
