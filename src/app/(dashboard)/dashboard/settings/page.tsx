"use client";

import { useEffect, useState, Suspense } from "react";
import {
  Mail, User, Palette, Bell, Save, Loader2, Check,
  HardDrive, CheckCircle2, AlertCircle, Unlink,
  Database, Clock, Zap, ChevronDown, ChevronUp,
  TestTube2, Link2,
} from "lucide-react";
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

// ── Storage provider definitions ───────────────────────────────────────────
const PROVIDERS = [
  {
    id: "taskstack",
    label: "TaskStack Database",
    description: "Stored securely in TaskStack's cloud. Fast, always available, fully managed.",
    icon: <Database className="w-4 h-4" />,
    color: "bg-purple text-white",
    activeBorder: "border-purple",
    activeBg: "bg-purple/5",
    fields: [],
    available: true,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description: "Connect your own MongoDB Atlas cluster, self-hosted instance, or CosmosDB.",
    icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.36V7z"/></svg>,
    color: "bg-green-600 text-white",
    activeBorder: "border-green-500",
    activeBg: "bg-green-50",
    fields: [
      { key: "mongoUri",    label: "Connection URI",   placeholder: "mongodb+srv://user:pass@cluster.mongodb.net/mydb", type: "password" },
      { key: "mongoDbName", label: "Database Name",    placeholder: "taskstack (optional)", type: "text" },
    ],
    available: true,
  },
  {
    id: "supabase",
    label: "Supabase",
    description: "Use your own Supabase project. Data stored in a single taskstack_data table.",
    icon: <Zap className="w-4 h-4" />,
    color: "bg-emerald-500 text-white",
    activeBorder: "border-emerald-500",
    activeBg: "bg-emerald-50",
    fields: [
      { key: "supabaseUrl", label: "Project URL",  placeholder: "https://xyz.supabase.co", type: "text" },
      { key: "supabaseKey", label: "Anon / Service Key", placeholder: "eyJhbGciOi...", type: "password" },
    ],
    available: true,
  },
  {
    id: "sqlite",
    label: "SQLite",
    description: "Local SQLite database file. Best for self-hosted Docker deployments. Resets on Vercel.",
    icon: <HardDrive className="w-4 h-4" />,
    color: "bg-blue-500 text-white",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    fields: [
      { key: "sqlitePath", label: "File Path", placeholder: "/data/taskstack.db or leave blank for in-memory", type: "text" },
    ],
    available: true,
  },
  {
    id: "drive",
    label: "Google Drive",
    description: "Store data as JSON files in your Google Drive. Requires Google app verification.",
    icon: <svg viewBox="0 0 87.3 78" className="w-4 h-4" fill="currentColor"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 0 0 .97 3.55zM43.65 25 29.9 1.2a7.17 7.17 0 0 0-3.3 3.3L.97 49.5A7.3 7.3 0 0 0 0 53h27.55zm35.5 41.85L61.4 37H27.55L13.8 60.8l13.75 23.8a7.3 7.3 0 0 0 3.35-.97l39.6-22.86a7.17 7.17 0 0 0 2.65-3.12zm5.3-9.35L58.3 4.5a7.17 7.17 0 0 0-3.3-3.3L41.25 25H69.1a7.3 7.3 0 0 0 .97 3.55z"/></svg>,
    color: "bg-yellow-500 text-white",
    activeBorder: "border-yellow-400",
    activeBg: "bg-yellow-50",
    fields: [],
    available: false,
    comingSoon: true,
  },
  {
    id: "dropbox",
    label: "Dropbox",
    description: "Store data as JSON files in your Dropbox account.",
    icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2L6 6.5 12 11l-6 4.5L12 20l6-4.5L12 11l6-4.5L12 2zm0 4.5L8.5 9 12 11.5 15.5 9 12 6.5zm-6 9L9.5 18 12 16.5 14.5 18 18 15.5 12 12l-6 3.5z"/></svg>,
    color: "bg-sky-500 text-white",
    activeBorder: "border-sky-400",
    activeBg: "bg-sky-50",
    fields: [],
    available: false,
    comingSoon: true,
  },
] as const;

// ── Storage section component ──────────────────────────────────────────────
function StorageSection() {
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();

  const { data: currentConfig, mutate: mutateConfig } =
    useSWR<{ provider: string; supabaseUrl?: string; mongoDbName?: string; sqlitePath?: string; driveConnected?: boolean }>(
      "/api/storage/config", fetcher, { revalidateOnFocus: false }
    );

  const [selected, setSelected] = useState<string>("taskstack");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [saving, setSaving]     = useState(false);

  // Sync selected to current config
  useEffect(() => {
    if (currentConfig?.provider) {
      setSelected(currentConfig.provider);
      // Prefill non-secret fields
      const prefill: Record<string, string> = {};
      if (currentConfig.supabaseUrl) prefill.supabaseUrl = currentConfig.supabaseUrl;
      if (currentConfig.mongoDbName) prefill.mongoDbName  = currentConfig.mongoDbName;
      if (currentConfig.sqlitePath)  prefill.sqlitePath   = currentConfig.sqlitePath;
      setFields(prefill);
    }
  }, [currentConfig]);

  // Handle drive callback
  useEffect(() => {
    const p = searchParams.get("drive");
    if (p === "connected") { success("Google Drive connected!"); mutateConfig(); window.history.replaceState({}, "", "/dashboard/settings"); }
    if (p === "error")     { toastError("Google Drive connection failed."); window.history.replaceState({}, "", "/dashboard/settings"); }
  }, [searchParams, success, toastError, mutateConfig]);

  const activeProvider = PROVIDERS.find(p => p.id === selected)!;

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const body: Record<string, string> = { provider: selected, ...fields };
      const res  = await fetch("/api/storage/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setTestResult(data);
    } catch { setTestResult({ ok: false, error: "Network error" }); }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = { provider: selected, ...fields };
      const res  = await fetch("/api/storage/config", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { mutateConfig(); success(`${activeProvider.label} connected as your storage!`); setTestResult(null); }
      else { const d = await res.json(); toastError(d.error || "Failed to save"); }
    } catch { toastError("Failed to save storage config"); }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!confirm("Reset to TaskStack database? Your data in the connected storage will remain there.")) return;
    const res = await fetch("/api/storage/config", { method: "DELETE" });
    if (res.ok) { setSelected("taskstack"); setFields({}); setTestResult(null); mutateConfig(); success("Reset to TaskStack database."); }
  };

  const needsConfig = (id: string) => PROVIDERS.find(p => p.id === id)?.fields.length ?? 0 > 0;
  const isActive    = (id: string) => currentConfig?.provider === id;

  return (
    <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <HardDrive className="w-5 h-5 text-foreground/40" /> Storage — Own Your Data
      </h2>
      <p className="text-xs text-foreground/50 mb-5">
        Connect your own database. TaskStack stores only your auth credentials — your data goes directly to the provider you choose.
      </p>

      <div className="space-y-2.5">
        {PROVIDERS.map((p) => {
          const active   = isActive(p.id);
          const sel      = selected === p.id;
          const hasFields = p.fields.length > 0;

          return (
            <div key={p.id}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                active ? `${p.activeBorder} ${p.activeBg}` :
                sel    ? `${p.activeBorder} bg-white` :
                         "border-foreground/10 bg-white"
              } ${p.available ? "" : "opacity-70"}`}>

              {/* Header row */}
              <div
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer ${p.available ? "" : "cursor-not-allowed"}`}
                onClick={() => { if (!p.available) return; setSelected(p.id); setTestResult(null); if (hasFields) setExpanded(sel && expanded === p.id ? null : p.id); }}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${sel || active ? p.color : "bg-foreground/8 text-foreground/50"}`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{p.label}</span>
                    {active   && <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Active</span>}
                    {"comingSoon" in p && p.comingSoon && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Coming Soon</span>}
                  </div>
                  <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">{p.description}</p>
                </div>
                {hasFields && p.available && (
                  expanded === p.id
                    ? <ChevronUp className="w-4 h-4 text-foreground/40 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-foreground/40 shrink-0" />
                )}
              </div>

              {/* Expandable config fields */}
              {hasFields && expanded === p.id && p.available && (
                <div className="px-4 pb-4 space-y-3 border-t border-foreground/6 pt-3">
                  {p.fields.map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-foreground/50 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={fields[f.key] ?? ""}
                        onChange={(e) => { setFields(prev => ({ ...prev, [f.key]: e.target.value })); setTestResult(null); }}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 rounded-xl border border-foreground/15 text-sm focus:outline-none focus:border-purple font-mono"
                      />
                    </div>
                  ))}

                  {/* Test result */}
                  {testResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
                      testResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      {testResult.ok
                        ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Connection successful! Click Save to activate.</>
                        : <><AlertCircle className="w-4 h-4 shrink-0" /> {testResult.error}</>
                      }
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={handleTest} disabled={testing}
                      className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                      {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube2 className="w-3.5 h-3.5" />}
                      Test connection
                    </button>
                    <button onClick={handleSave} disabled={saving || (!testResult?.ok && needsConfig(p.id))}
                      className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 hover:bg-purple/90">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      Save & Activate
                    </button>
                  </div>
                </div>
              )}

              {/* Activate button for providers without config fields */}
              {!hasFields && p.available && sel && !active && (
                <div className="px-4 pb-4 border-t border-foreground/6 pt-3">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Activate
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset button */}
      {currentConfig?.provider && currentConfig.provider !== "taskstack" && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>{PROVIDERS.find(p => p.id === currentConfig.provider)?.label}</strong> is active.
              All your data reads and writes go to your own storage — TaskStack cannot access it.
            </p>
          </div>
          <button onClick={handleReset}
            className="flex items-center gap-1 text-xs font-semibold text-foreground/50 hover:text-foreground shrink-0">
            <Unlink className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Settings page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { profile, mutate } = useUserProfile();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({ displayName: "", theme: "light" as "light" | "dark", reminderLeadDays: 3 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

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
        setSaved(true); setTimeout(() => setSaved(false), 2500);
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
              {session?.user?.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={session.user.image} alt={displayName} className="w-full h-full rounded-full object-cover" />
                : getInitials(displayName, email)}
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

      {/* Storage — multi-provider section */}
      <Suspense fallback={<div className="bg-white rounded-xl border-2 border-foreground/10 p-5 h-48 animate-pulse" />}>
        <StorageSection />
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
