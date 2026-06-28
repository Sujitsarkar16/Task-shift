/**
 * GET /api/drive/connect
 * Redirects the user to Google's OAuth consent screen asking for
 * drive.file scope (access only to files TaskStack creates — not the whole Drive).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { google } from "googleapis";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  const userId = session?.user?.id || session?.user?.email;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/drive/callback`,
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",          // get refresh_token
    prompt:       "consent",          // always show consent to force refresh_token
    scope: [
      "https://www.googleapis.com/auth/drive.file",   // only files we create
    ],
    state: userId,                   // pass userId through so callback can save tokens
  });

  return NextResponse.redirect(url);
}
