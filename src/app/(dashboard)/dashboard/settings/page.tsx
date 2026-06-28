"use client";

import { useEffect, useState } from "react";
import { Mail, User, Palette, Bell, Save, Loader2, Check } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

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
        displayName: profile.displayName || profile.name || session?.user?.name || "",
        theme: (profile.theme as "light" | "dark") || "light",
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
  const email = session?.user?.email || "Not signed in";

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full space-y-6">
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-foreground/60">Manage your account and preferences.</p>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><User className="w-5 h-5 text-foreground/40" /> Account</h2>
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

      {/* Appearance */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Palette className="w-5 h-5 text-foreground/40" /> Appearance</h2>
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
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Bell className="w-5 h-5 text-foreground/40" /> Reminders</h2>
        <label className="block text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Reminder lead time</label>
        <div className="flex items-center gap-4">
          <input type="range" min={1} max={14} value={form.reminderLeadDays}
            onChange={(e) => setForm((f) => ({ ...f, reminderLeadDays: Number(e.target.value) }))}
            className="flex-1 accent-purple" />
          <span className="w-14 text-center font-mono font-bold text-sm bg-foreground/5 rounded-lg py-1.5">{form.reminderLeadDays}d</span>
        </div>
        <p className="text-xs text-foreground/40 mt-2">Notified {form.reminderLeadDays} day{form.reminderLeadDays !== 1 ? "s" : ""} before deadlines.</p>
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
