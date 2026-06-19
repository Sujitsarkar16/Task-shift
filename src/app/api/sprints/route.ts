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

    const sprints = await listDocuments("sprints", query);
    return NextResponse.json(sprints);
  } catch (error: any) {
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

    const sprint = await createDocument("sprints", {
      ...body,
      status: body.status || "planned",
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}
