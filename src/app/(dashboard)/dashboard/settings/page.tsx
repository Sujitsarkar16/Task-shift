"use client";

import { useEffect, useState, Suspense } from "react";
import { Mail, User, Palette, Bell, Save, Loader2, Check, HardDrive, CheckCircle2, AlertCircle, ExternalLink, Unlink } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

// ── Google Drive connect section ───────────────────────────────────────────
function DriveStorageSection() {
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);

  const { data: status, mutate: mutateStatus } =
    useSWR<{ connected: boolean }>("/api/drive/status", fetcher, { revalidateOnFocus: false });

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const driveParam = searchParams.get("drive");
    if (driveParam === "connected") {
      success("Google Drive connected! Your data will now be stored in your Drive.");
      mutateStatus();
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/settings");
    } else if (driveParam === "error") {
      toastError("Failed to connect Google Drive. Please try again.");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, [searchParams, success, toastError, mutateStatus]);

  const handleConnect = () => {
    window.location.href = "/api/drive/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Google Drive? Your data will stay in Drive but new data will be saved to TaskStack's database.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/drive/disconnect", { method: "POST" });
      if (res.ok) {
        mutateStatus({ connected: false }, false);
        success("Google Drive disconnected.");
      } else {
        toastError("Failed to disconnect. Try again.");
      }
    } catch { toastError("Failed to disconnect."); }
    setDisconnecting(false);
  };

  const isConnected = status?.connected;

  return (
    <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-foreground/40" /> Storage
      </h2>
      <p className="text-xs text-foreground/50 mb-5">
        Choose where your tasks, habits, notes and subscriptions are stored.
      </p>

      {/* Option 1: TaskStack DB (default) */}
      <div className={`flex items-start gap-4 p-4 rounded-xl border-2 mb-3 transition-all ${
        !isConnected ? "border-purple bg-purple/5" : "border-foreground/10"
      }`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          !isConnected ? "bg-purple text-white" : "bg-foreground/5 text-foreground/40"
        }`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-sm">TaskStack Database</p>
            {!isConnected && (
              <span className="text-[10px] font-bold bg-purple text-white px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <p className="text-xs text-foreground/50">
            Stored securely in TaskStack&apos;s cloud. Fast, always available, fully managed.
          </p>
        </div>
      </div>

      {/* Option 2: Google Drive */}
      <div className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
        isConnected ? "border-emerald-400 bg-emerald-50" : "border-foreground/10"
      }`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isConnected ? "bg-emerald-500 text-white" : "bg-foreground/5 text-foreground/40"
        }`}>
          {/* Google Drive icon */}
          <svg viewBox="0 0 87.3 78" className="w-5 h-5" fill="currentColor">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 0 0 .97 3.55zM43.65 25 29.9 1.2a7.17 7.17 0 0 0-3.3 3.3L.97 49.5A7.3 7.3 0 0 0 0 53h27.55zm35.5 41.85L61.4 37H27.55L13.8 60.8l13.75 23.8a7.3 7.3 0 0 0 3.35-.97l39.6-22.86a7.17 7.17 0 0 0 2.65-3.12zm5.3-9.35L58.3 4.5a7.17 7.17 0 0 0-3.3-3.3L41.25 25H69.1a7.3 7.3 0 0 0 .97 3.55z"/>
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-sm">Your Google Drive</p>
            {isConnected && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/50 mb-3">
            Data stored as JSON files in a private <strong>TaskStack/</strong> folder in your own Google Drive.
            Only you can access it — TaskStack never reads your data.
          </p>

          {isConnected ? (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://drive.google.com/drive/search?q=TaskStack"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View files in Drive
              </a>
              <span className="text-foreground/20">·</span>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                {disconnecting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Unlink className="w-3.5 h-3.5" />
                }
                Disconnect Drive
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-foreground/15 rounded-xl text-sm font-semibold hover:border-emerald-400 hover:bg-emerald-50 transition-all"
            >
              <svg viewBox="0 0 87.3 78" className="w-4 h-4" fill="#4CAF50">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 0 0 .97 3.55zM43.65 25 29.9 1.2a7.17 7.17 0 0 0-3.3 3.3L.97 49.5A7.3 7.3 0 0 0 0 53h27.55zm35.5 41.85L61.4 37H27.55L13.8 60.8l13.75 23.8a7.3 7.3 0 0 0 3.35-.97l39.6-22.86a7.17 7.17 0 0 0 2.65-3.12zm5.3-9.35L58.3 4.5a7.17 7.17 0 0 0-3.3-3.3L41.25 25H69.1a7.3 7.3 0 0 0 .97 3.55z"/>
              </svg>
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Drive is active.</strong> All tasks, habits, notes and subscriptions are being read
            from and written to your Google Drive. TaskStack cannot access this data.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main settings page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { profile, mutate } = useUserProfile();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({ displayName: "", theme: "light" as "light" | "dark", reminderLeadDays: 3 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        displayName:      profile.displayName || profile.name || session?.user?.name || "",
        theme:            (profile.theme as "light" | "dark") || "light",
        reminderLeadDays: profile.reminderLeadDays ?? 3,
      });
    }
  }, [profile, session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        mutate({ ...profile, ...form } as typeof profile, false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        success("Settings saved");
      } else { toastError("Failed to save settings"); }
    } catch { toastError("Failed to save settings"); }
    setSaving(false);
  };

  const displayName = form.displayName || session?.user?.name || "User";
  const email       = session?.user?.email || "Not signed in";

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full space-y-6">
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-foreground/60">Manage your account, storage and preferences.</p>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-foreground/40" /> Account
        </h2>
        {status === "loading" ? (
          <div className="text-foreground/50 text-sm">Loading…</div>
        ) : (
          <div className="flex items-start gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-purple-soft border-2 border-purple flex items-center justify-center font-bold text-lg text-purple shrink-0 overflow-hidden">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : getInitials(displayName, email)}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1.5">Display Name</label>
                <input type="text" value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="w-full px-4 py-2 border-2 border-foreground/10 rounded-lg focus:outline-none focus:border-purple text-sm" placeholder="Your name" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/60"><Mail className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Email</p>
                  <p className="font-medium text-sm">{email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Storage — Drive connect section */}
      <Suspense fallback={<div className="bg-white rounded-xl border-2 border-foreground/10 p-5 h-40 animate-pulse" />}>
        <DriveStorageSection />
      </Suspense>

      {/* Appearance */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Palette className="w-5 h-5 text-foreground/40" /> Appearance
        </h2>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-3">Theme</label>
        <div className="flex gap-3">
          {(["light", "dark"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, theme: t }))}
              className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm capitalize transition-all ${
                form.theme === t ? "border-purple bg-purple-soft/20 text-purple" : "border-foreground/10 hover:border-foreground/30"
              }`}>
              {t === "light" ? "☀️ Light" : "🌙 Dark"}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Bell className="w-5 h-5 text-foreground/40" /> Reminders
        </h2>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Reminder lead time</label>
        <div className="flex items-center gap-4">
          <input type="range" min={1} max={14} value={form.reminderLeadDays}
            onChange={(e) => setForm((f) => ({ ...f, reminderLeadDays: Number(e.target.value) }))}
            className="flex-1 accent-purple" />
          <span className="w-14 text-center font-mono font-bold text-sm bg-foreground/5 rounded-lg py-1.5">{form.reminderLeadDays}d</span>
        </div>
        <p className="text-xs text-foreground/40 mt-2">
          Notified {form.reminderLeadDays} day{form.reminderLeadDays !== 1 ? "s" : ""} before deadlines.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-xl font-semibold hover:bg-purple hover:text-white transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
        <h2 className="text-lg font-bold mb-2">Sign out</h2>
        <p className="text-foreground/60 text-sm mb-5">End your current session.</p>
        <LogoutButton variant="danger" label="Log out" />
      </div>
    </div>
  );
}
