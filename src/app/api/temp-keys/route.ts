import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createDocument, listDocuments } from "@/lib/db/database";
import { assertProjectOwner } from "@/lib/db/projectAccess";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new NextResponse("projectId is required", { status: 400 });
    }

    const hasAccess = await assertProjectOwner(projectId, session.user.email);
    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const keys = await listDocuments("tempKeys", { projectId, sort: "createdAt", order: "desc" });
    
    // Filter out keys that might have expired but haven't been swept by MongoDB TTL yet
    const now = new Date().getTime();
    const activeKeys = keys.filter((key: any) => new Date(key.expiresAt).getTime() > now);

    return NextResponse.json(activeKeys);
  } catch (error) {
    console.error("[temp-keys_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, value, expiresAt } = body;

    if (!projectId || !name || !value || !expiresAt) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const hasAccess = await assertProjectOwner(projectId, session.user.email);
    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const key = await createDocument("tempKeys", {
      projectId,
      name,
      value,
      expiresAt: new Date(expiresAt),
    });

    return NextResponse.json(key);
  } catch (error) {
    console.error("[temp-keys_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
