import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { listDocuments, createDocument } from "@/lib/db/database";
import { assertProjectOwner } from "@/lib/db/projectAccess";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await assertProjectOwner(projectId, userId);
    if (!project) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const query: Record<string, string> = { projectId };
    if (searchParams.has("status")) {
      query.status = searchParams.get("status") as string;
    }

    const items = await listDocuments("workItems", query);
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching work items:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await assertProjectOwner(body.projectId, userId);
    if (!project) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const item = await createDocument("workItems", {
      ...body,
      reporterId: userId,
      status: body.status || "todo",
      type: body.type || "task",
      priority: body.priority || "medium",
      order: body.order ?? Date.now(),
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error("Error creating work item:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}
