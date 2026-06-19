import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { upsertOAuthUserProfile } from "@/lib/db/database";

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
