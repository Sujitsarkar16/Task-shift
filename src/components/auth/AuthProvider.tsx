"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Wraps the app with NextAuth's SessionProvider.
 * refetchInterval: re-fetches session every 10 minutes in the background
 *   so the client always has a fresh copy of the 24-h session.
 * refetchOnWindowFocus: re-validates the session whenever the tab becomes
 *   active — catches the case where the session expired while the tab was
 *   hidden without forcing a hard reload.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={10 * 60}      // silent re-fetch every 10 min
      refetchOnWindowFocus={true}    // re-validate on tab focus
    >
      {children}
    </SessionProvider>
  );
}
