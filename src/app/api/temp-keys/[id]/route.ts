import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteDocument, getDocumentById } from "@/lib/db/database";
import { assertProjectOwner } from "@/lib/db/projectAccess";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const keyId = params.id;
    if (!keyId) {
      return new NextResponse("Key ID is required", { status: 400 });
    }

    const key = await getDocumentById("tempKeys", keyId);
    if (!key) {
      return new NextResponse("Key not found", { status: 404 });
    }

    const hasAccess = await assertProjectOwner(key.projectId, session.user.email);
    if (!hasAccess) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await deleteDocument("tempKeys", keyId);

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[temp-keys_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
