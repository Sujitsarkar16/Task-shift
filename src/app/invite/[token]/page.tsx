"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, CheckCircle2, Loader2, AlertTriangle, LogIn } from "lucide-react";
import Link from "next/link";

export default function InvitePage() {
  const { token }  = useParams<{ token: string }>();
  const router     = useRouter();
  const { data: session, status } = useSession();

  const [invite, setInvite] = useState<{ workspaceName: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Preview the invite without auth
  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setInvite(d);
      })
      .catch(() => setError("Could not load invite"))
      .finally(() => setLoading(false));
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to accept invite"); return; }
      setDone(true);
      setTimeout(() => router.push("/dashboard/collaborate"), 2000);
    } catch { setError("Something went wrong"); }
    finally { setAccepting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-foreground/10 shadow-xl p-8 w-full max-w-md text-center">

        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple to-violet-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple/20">
          <Users className="w-7 h-7 text-white" />
        </div>

        {done ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold mb-2">You&apos;re in! 🎉</h1>
            <p className="text-foreground/60 text-sm">Redirecting to your workspace…</p>
          </>
        ) : error ? (
          <>
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Invalid invite</h1>
            <p className="text-foreground/60 text-sm mb-6">{error}</p>
            <Link href="/dashboard" className="inline-flex px-5 py-2.5 bg-purple text-white rounded-xl font-semibold text-sm">Go to dashboard</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold mb-2">You&apos;re invited!</h1>
            <p className="text-foreground/60 text-sm mb-6">
              Join <strong className="text-foreground">{invite?.workspaceName}</strong> as a{" "}
              <span className={`font-bold ${invite?.role === "editor" ? "text-blue-600" : "text-foreground/60"}`}>{invite?.role}</span>.
            </p>

            {status === "unauthenticated" ? (
              <div>
                <p className="text-sm text-foreground/50 mb-4">You need to sign in to accept this invite.</p>
                <Link
                  href={`/login?callbackUrl=/invite/${token}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple text-white rounded-xl font-semibold text-sm hover:bg-purple/90 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Sign in to accept
                </Link>
              </div>
            ) : status === "loading" ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple mx-auto" />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-foreground/50">Signed in as <strong>{session?.user?.email}</strong></p>
                <button onClick={accept} disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple to-violet-500 text-white rounded-2xl font-bold shadow-lg shadow-purple/20 hover:shadow-purple/30 transition-all disabled:opacity-50">
                  {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {accepting ? "Joining…" : "Accept invite"}
                </button>
                <Link href="/dashboard" className="block text-sm text-foreground/40 hover:text-foreground transition-colors">
                  Decline
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
