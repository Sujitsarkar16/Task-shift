import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertOAuthUserProfile } from "@/lib/db/database";

// ── Session & token lifetimes ──────────────────────────────────────────────
// JWT lives for 24 h from the last activity.
// The cookie is persistent (maxAge = 24 h); the browser keeps it across
// restarts, but it expires exactly 24 h after the last sign-in unless the
// user manually logs out first.
const SESSION_MAX_AGE    = 24 * 60 * 60;     // 24 h (seconds)
const JWT_MAX_AGE        = 24 * 60 * 60;     // JWT matches session
const SESSION_UPDATE_AGE = 30 * 60;           // refresh cookie every 30 min of activity

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email && credentials?.password) {
          return {
            id:    credentials.email,
            email: credentials.email,
          };
        }
        return null;
      },
    }),
  ],

  pages: { signIn: "/login" },

  session: {
    strategy:  "jwt",
    maxAge:    SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,   // extend cookie every 30 min of activity
  },

  jwt: {
    maxAge: JWT_MAX_AGE,
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   process.env.NODE_ENV === "production",
        // Persistent cookie — survives browser restarts, expires in 24 h
        maxAge:   SESSION_MAX_AGE,
      },
    },
  },

  callbacks: {
    // ── JWT callback ─────────────────────────────────────────────────────
    // Called on every request that touches the session.
    // On first login: `user` & `account` are populated → store the DB id.
    // On subsequent requests: only `token` is populated → pass it through.
    async jwt({ token, user, account }) {
      // First sign-in
      if (user) {
        if (account?.provider === "google" && user.email) {
          const profile = await upsertOAuthUserProfile({
            email: user.email,
            name:  user.name  ?? undefined,
            image: user.image ?? undefined,
          });
          token.sub          = profile.id;
          token.email        = user.email;
          token.name         = user.name  ?? undefined;
          token.picture      = user.image ?? undefined;
        } else {
          token.sub   = user.id;
          token.email = user.email ?? undefined;
        }
        // Record when this token was first issued
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Sliding window: update iat on every refresh so updateAge works
      token.iat = Math.floor(Date.now() / 1000);

      return token;
    },

    // ── Session callback ──────────────────────────────────────────────────
    // Shapes the session object that is returned to the client.
    async session({ session, token }) {
      if (session.user && token.sub) {
        // @ts-ignore — augment next-auth session type
        session.user.id = token.sub;
      }
      if (token.email) session.user.email = token.email as string;
      if (token.name)  session.user.name  = token.name  as string;
      if (token.picture) session.user.image = token.picture as string;

      // Surface token expiry so the client can show a countdown if needed
      // @ts-ignore
      session.expires = new Date((token.iat as number + SESSION_MAX_AGE) * 1000).toISOString();

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
