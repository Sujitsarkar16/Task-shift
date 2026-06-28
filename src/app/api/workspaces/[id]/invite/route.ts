import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getDatabase } from "@/lib/db/database";
import { canEdit, getWorkspaceMember } from "@/lib/db/workspaceAccess";
import crypto from "crypto";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/workspaces/:id/invite
 * Body: { email: string, role: "editor"|"viewer" }
 *
 * Creates a pending invite. Returns the invite link token.
 * In production this would send an email; here we return the token
 * so the frontend can display a copyable link.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id: workspaceId } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only editors/owners can invite
    if (!(await canEdit(workspaceId, userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { email, role = "editor" } = await request.json();
    if (!email?.trim()) return NextResponse.json({ error: "email required" }, { status: 400 });
    if (!["editor", "viewer"].includes(role))
      return NextResponse.json({ error: "role must be editor or viewer" }, { status: 400 });

    const db  = await getDatabase();
    const now = new Date();

    // Check if already a member
    const existing = await db.collection("workspaceMembers").findOne({
      workspaceId, email: email.trim().toLowerCase(),
    });
    if (existing?.status === "active")
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });

    const token = crypto.randomBytes(24).toString("hex");

    if (existing) {
      // Re-invite: refresh token
      await db.collection("workspaceMembers").updateOne(
        { workspaceId, email: email.trim().toLowerCase() },
        { $set: { role, inviteToken: token, status: "invited", updatedAt: now } },
      );
    } else {
      await db.collection("workspaceMembers").insertOne({
        workspaceId,
        userId:      "", // filled when accepted
        email:       email.trim().toLowerCase(),
        displayName: "",
        role,
        status:      "invited",
        inviteToken: token,
        invitedBy:   userId,
        createdAt:   now,
        updatedAt:   now,
      });
    }

    // Get workspace name for the link context
    const workspace = await db.collection("workspaces").findOne(
      { _id: { $exists: true } },
      { projection: { name: 1 } },
    );

    const inviteUrl = `${process.env.NEXTAUTH_URL || ""}/invite/${token}`;

    return NextResponse.json({ token, inviteUrl, email: email.trim().toLowerCase(), role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** GET /api/workspaces/:id/invite — list all pending invites (editors/owners only) */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id: workspaceId } = await params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await canEdit(workspaceId, userId)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getDatabase();
    const invites = await db
      .collection("workspaceMembers")
      .find({ workspaceId, status: "invited" }, { projection: { inviteToken: 0 } })
      .toArray();

    return NextResponse.json(invites.map(({ _id, ...rest }) => ({ ...rest, id: (_id as any).toString() })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
