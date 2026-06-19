"use client";

import { useSession } from "next-auth/react";
import { Mail, User } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

export default function SettingsPage() {
  const { data: session, status } = useSession();

  const displayName = session?.user?.name || "User";
  const email = session?.user?.email || "Not signed in";
  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      <div>
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-foreground/60 text-lg">Manage your account and preferences.</p>
        </div>

        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6 mb-6">
          <h2 className="text-lg font-bold mb-6">Account</h2>

          {status === "loading" ? (
            <div className="text-foreground/50 font-medium text-sm">Loading account…</div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-purple-soft border-2 border-purple flex items-center justify-center font-bold text-xl text-purple shrink-0">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/60">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Name</p>
                    <p className="font-medium">{displayName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/60">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Email</p>
                    <p className="font-medium">{email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <h2 className="text-lg font-bold mb-2">Sign out</h2>
          <p className="text-foreground/60 text-sm mb-6">
            End your current session and return to the login page.
          </p>
          <LogoutButton variant="danger" label="Log out" />
        </div>
      </div>
    </div>
  );
}
