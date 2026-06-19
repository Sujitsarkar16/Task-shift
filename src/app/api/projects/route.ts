import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { listDocuments, createDocument } from "@/lib/db/database";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const userId = session?.user?.id || session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await listDocuments("projects", { ownerId: userId });
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
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
    const project = await createDocument("projects", {
      ...body,
      ownerId: userId,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.status || 500 },
    );
  }
}
