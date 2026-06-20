import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertOAuthUserProfile } from "@/lib/db/database";

// 30 days in seconds — industry standard persistent session length
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Implement actual database verification here instead of returning mock user
        if (credentials?.email && credentials?.password) {
          // Temporarily return a basic object until DB auth is hooked up
          return {
            id: credentials.email, // using email as ID since mock user is removed
            email: credentials.email,
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Cookie persists for 30 days; browser closure does NOT log the user out
    maxAge: SESSION_MAX_AGE,
    // Sliding window: reset expiry on every active request
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // secure must be true in production so the cookie isn't sent over HTTP
        secure: process.env.NODE_ENV === "production",
        // maxAge (not expires) tells the browser to persist the cookie across sessions
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          const profile = await upsertOAuthUserProfile({
            email: user.email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          });
          token.sub = profile.id;
        } else {
          token.sub = user.id;
        }
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
