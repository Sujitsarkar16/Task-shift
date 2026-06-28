/**
 * GET /api/drive/callback
 * Google redirects here after the user grants Drive access.
 * We exchange the code for tokens and store them in MongoDB.
 */
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { saveDriveTokens } from "@/lib/storage/adapterRouter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code   = searchParams.get("code");
  const userId = searchParams.get("state");   // passed as state= during connect
  const error  = searchParams.get("error");

  if (error || !code || !userId) {
    // User denied or something went wrong — redirect to settings with error flag
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?drive=error`,
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/drive/callback`,
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) throw new Error("No access token received");

    await saveDriveTokens(userId, {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      expiresAt:    tokens.expiry_date ?? undefined,
    });

    // Redirect back to settings with success flag
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?drive=connected`,
    );
  } catch (err) {
    console.error("[drive/callback] error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?drive=error`,
    );
  }
}
