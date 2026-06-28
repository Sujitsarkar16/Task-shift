/**
 * Workspace access helpers — used by all collaboration-aware API routes.
 */
import { getDatabase } from "@/lib/db/database";

export type WorkspaceMemberRole = "owner" | "editor" | "viewer";
export type WorkspaceMemberStatus = "active" | "invited";

export interface WorkspaceMember {
  _id?: string;
  id?: string;
  workspaceId: string;
  userId: string;
  email?: string;
  displayName?: string;
  role: WorkspaceMemberRole;
  status: WorkspaceMemberStatus;
  inviteToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Returns the member record if userId is an active member of the workspace, else null. */
export async function getWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMember | null> {
  const db = await getDatabase();
  const member = await db.collection("workspaceMembers").findOne({
    workspaceId,
    userId,
    status: "active",
  });
  if (!member) return null;
  const { _id, ...rest } = member as any;
  return { ...rest, id: _id.toString() };
}

/** Returns the member record if the invite token matches a pending invite. */
export async function getMemberByInviteToken(
  token: string,
): Promise<WorkspaceMember | null> {
  const db = await getDatabase();
  const member = await db.collection("workspaceMembers").findOne({
    inviteToken: token,
    status: "invited",
  });
  if (!member) return null;
  const { _id, ...rest } = member as any;
  return { ...rest, id: _id.toString() };
}

/** Returns all active members of a workspace. */
export async function listWorkspaceMembers(workspaceId: string) {
  const db = await getDatabase();
  const members = await db
    .collection("workspaceMembers")
    .find({ workspaceId })
    .toArray();
  return members.map(({ _id, ...rest }) => ({ ...rest, id: (_id as any).toString() }));
}

/** Checks if userId can edit (owner or editor role) in the workspace. */
export async function canEdit(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getWorkspaceMember(workspaceId, userId);
  return member?.role === "owner" || member?.role === "editor";
}

/** Checks if userId is owner. */
export async function isOwner(workspaceId: string, userId: string): Promise<boolean> {
  const member = await getWorkspaceMember(workspaceId, userId);
  return member?.role === "owner";
}

/** Returns all workspaceIds where userId is an active member. */
export async function getUserWorkspaceIds(userId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db
    .collection("workspaceMembers")
    .find({ userId, status: "active" }, { projection: { workspaceId: 1 } })
    .toArray();
  return rows.map((r: any) => r.workspaceId);
}
