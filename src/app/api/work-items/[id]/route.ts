import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDocumentById, updateDocument, deleteDocument } from "@/lib/db/database";
import { assertProjectOwner } from "@/lib/db/projectAccess";

async function getOwnedWorkItem(id: string, userId: string) {
  const item = await getDocumentById("workItems", id);
  if (!item) return null;

  const project = await assertProjectOwner(item.projectId, userId);
  if (!project) return null;

  return item;
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await getOwnedWorkItem(params.id, userId);
    if (!item) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await getOwnedWorkItem(params.id, userId);
    if (!item) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = await updateDocument("workItems", params.id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const item = await getOwnedWorkItem(params.id, userId);
    if (!item) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    await deleteDocument("workItems", params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}
