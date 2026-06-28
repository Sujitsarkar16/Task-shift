import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { getDatabase } from "@/lib/db/database";
import { isOwner } from "@/lib/db/workspaceAccess";
import { ObjectId } from "mongodb";

type Params = { params: Promise<{ id: string; memberId: string }> };

/** PATCH — change a member's role (owner only) */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id: workspaceId, memberId } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await isOwner(workspaceId, userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { role } = await request.json();
    if (!["editor", "viewer"].includes(role))
      return NextResponse.json({ error: "role must be editor or viewer" }, { status: 400 });

    const db = await getDatabase();
    await db.collection("workspaceMembers").updateOne(
      { _id: new ObjectId(memberId), workspaceId },
      { $set: { role, updatedAt: new Date() } },
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** DELETE — remove a member (owner only, or self-leave) */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id: workspaceId, memberId } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db     = await getDatabase();
    const target = await db.collection("workspaceMembers").findOne({ _id: new ObjectId(memberId) });
    if (!target) return NextResponse.json({ error: "Not Found" }, { status: 404 });

    // Allow if owner OR if the user is removing themselves
    const isSelf  = target.userId === userId;
    const ownerOk = await isOwner(workspaceId, userId);
    if (!isSelf && !ownerOk) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("workspaceMembers").deleteOne({ _id: new ObjectId(memberId) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
