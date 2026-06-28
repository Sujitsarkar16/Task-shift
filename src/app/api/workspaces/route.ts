import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getDatabase, serializeDocument } from "@/lib/db/database";
import { getUserWorkspaceIds } from "@/lib/db/workspaceAccess";
import { ObjectId } from "mongodb";

/** GET /api/workspaces — list all workspaces the current user belongs to */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const workspaceIds = await getUserWorkspaceIds(userId);

    if (workspaceIds.length === 0) return NextResponse.json([]);

    const workspaces = await db
      .collection("workspaces")
      .find({ _id: { $in: workspaceIds.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } })
      .toArray();

    return NextResponse.json(workspaces.map(serializeDocument));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

/** POST /api/workspaces — create a workspace and add the creator as owner */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const db    = await getDatabase();
    const now   = new Date();

    const { insertedId } = await db.collection("workspaces").insertOne({
      name:      name.trim().slice(0, 80),
      ownerId:   userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as owner member
    await db.collection("workspaceMembers").insertOne({
      workspaceId:  insertedId.toString(),
      userId,
      email:        session?.user?.email ?? "",
      displayName:  session?.user?.name  ?? "",
      role:         "owner",
      status:       "active",
      createdAt:    now,
      updatedAt:    now,
    });

    const workspace = await db.collection("workspaces").findOne({ _id: insertedId });
    return NextResponse.json(serializeDocument(workspace), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
