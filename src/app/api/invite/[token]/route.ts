import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDatabase, serializeDocument } from "@/lib/db/database";
import { getMemberByInviteToken } from "@/lib/db/workspaceAccess";
import { ObjectId } from "mongodb";

type Params = { params: Promise<{ token: string }> };

/** GET /api/invite/:token — preview the invite (no auth needed) */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const invite    = await getMemberByInviteToken(token);
    if (!invite) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });

    const db        = await getDatabase();
    const workspace = await db.collection("workspaces").findOne({
      _id: ObjectId.isValid(invite.workspaceId) ? new ObjectId(invite.workspaceId) : null,
    });

    return NextResponse.json({
      workspaceId:   invite.workspaceId,
      workspaceName: workspace ? (workspace as any).name : "Workspace",
      email:         invite.email,
      role:          invite.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST /api/invite/:token — accept the invite (must be logged in) */
export async function POST(_req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const session   = await getServerSession(authOptions);
    // @ts-ignore
    const userId    = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Must be logged in to accept invite" }, { status: 401 });

    const invite = await getMemberByInviteToken(token);
    if (!invite) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });

    const db  = await getDatabase();
    const now = new Date();

    // Check if this userId is already a member of this workspace
    const existingActive = await db.collection("workspaceMembers").findOne({
      workspaceId: invite.workspaceId,
      userId,
      status: "active",
    });
    if (existingActive) {
      // Already a member — just return success
      return NextResponse.json({ workspaceId: invite.workspaceId, alreadyMember: true });
    }

    // Activate the invite
    await db.collection("workspaceMembers").updateOne(
      { inviteToken: token },
      {
        $set: {
          userId,
          displayName: session?.user?.name  ?? "",
          status:      "active",
          updatedAt:   now,
        },
        $unset: { inviteToken: "" },
      },
    );

    // Create a welcome notification
    try {
      const workspace = await db.collection("workspaces").findOne({
        _id: ObjectId.isValid(invite.workspaceId) ? new ObjectId(invite.workspaceId) : null,
      });
      await db.collection("notifications").insertOne({
        userId,
        title:     "Workspace joined",
        message:   `You joined "${(workspace as any)?.name || "a workspace"}" as ${invite.role}.`,
        type:      "system",
        read:      false,
        link:      "/dashboard/collaborate",
        createdAt: now,
        updatedAt: now,
      });
    } catch { /* notification failure is non-fatal */ }

    return NextResponse.json({ workspaceId: invite.workspaceId, role: invite.role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
