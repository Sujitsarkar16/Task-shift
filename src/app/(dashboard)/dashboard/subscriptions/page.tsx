"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, Edit2, X, Save, AlertTriangle,
  CheckCircle2, PauseCircle, RefreshCw, Loader2,
} from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import {
  formatINR, formatINRCompact,
  usdToInr, FALLBACK_USD_TO_INR,
} from "@/lib/currency";
import { useSubscriptions, type Subscription } from "@/hooks/useSubscriptions";
import { useToast } from "@/components/ui/Toast";
import { SkeletonSubRow, SkeletonCard } from "@/components/ui/Skeleton";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/* ─── helpers ─────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  streaming: "bg-pink-100 text-pink-700",
  software:  "bg-blue-100 text-blue-700",
  utilities: "bg-yellow-100 text-yellow-700",
  gaming:    "bg-purple-soft text-purple",
  other:     "bg-gray-100 text-gray-600",
};
const STATUS_ICONS: Record<string, React.ElementType> = {
  active:    CheckCircle2,
  trial:     AlertTriangle,
  paused:    PauseCircle,
  cancelled: X,
};

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}
function toMonthly(amount: number, cycle: string) {
  if (cycle === "weekly")    return amount * 4.33;
  if (cycle === "monthly")   return amount;
  if (cycle === "quarterly") return amount / 3;
  if (cycle === "yearly")    return amount / 12;
  return amount;
}

/* ─── blank form ──────────────────────────────────────────────── */
const BLANK = {
  name: "", amount: 0, billingCycle: "monthly", renewalDate: "",
  category: "software", status: "active", currency: "INR",
  notes: "", manageUrl: "",
};

/* ─── component ───────────────────────────────────────────────── */
export default function SubscriptionsPage() {
  const { subscriptions: subs, isLoading, mutate } = useSubscriptions();
  const { success, error: toastError } = useToast();

  /* currency rate via SWR (1 h dedupe) */
  const { data: rateData, isLoading: rateLoading, mutate: mutateRate } =
    useSWR<{ rate: number; updatedAt: string; cached: boolean }>(
      "/api/currency/inr-rate",
      fetcher,
      { dedupingInterval: 3_600_000, revalidateOnFocus: false },
    );
  const usdRate     = rateData?.rate     ?? FALLBACK_USD_TO_INR;
  const rateUpdated = rateData?.updatedAt ?? "";

  /* form state */
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]         = useState<typeof BLANK>(BLANK);
  const [amountRaw,   setAmountRaw]    = useState("");
  const [amountInr,   setAmountInr]    = useState<number | null>(null);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm(BLANK);
    setAmountRaw("");
    setAmountInr(null);
  };

  /* USD auto-detect */
  const handleAmountChange = (raw: string) => {
    setAmountRaw(raw);
    const hasDollar = raw.trim().startsWith("$");
    const numeric   = parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
    if (hasDollar && numeric > 0) {
      const inr = usdToInr(numeric, usdRate);
      setAmountInr(inr);
      setForm((f) => ({ ...f, amount: inr }));
    } else {
      setAmountInr(null);
      setForm((f) => ({ ...f, amount: numeric }));
    }
  };

  const startEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setAmountRaw(String(sub.amount));
    setAmountInr(null);
    setForm({
      name: sub.name, amount: sub.amount,
      billingCycle: sub.billingCycle,
      renewalDate: new Date(sub.renewalDate).toISOString().split("T")[0],
      category:   sub.category  || "other",
      status:     sub.status    || "active",
      currency:   "INR",
      notes:      sub.notes     || "",
      manageUrl:  sub.manageUrl || "",
    });
  };

  /* save (create or update) */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.renewalDate) return;
    const payload = {
      ...form,
      amount: Number(form.amount),
      renewalDate: new Date(form.renewalDate),
      currency: "INR",
    };

    if (editingId) {
      /* optimistic update */
      mutate(
        subs.map((s) =>
          s.id === editingId ? { ...s, ...payload, id: s.id } as Subscription : s,
        ),
        false,
      );
      resetForm();
      try {
        const res = await fetch(`/api/subscriptions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        mutate(); success("Subscription updated");
      } catch { toastError("Failed to update"); mutate(); }
    } else {
      resetForm();
      try {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        mutate(); success("Subscription added");
      } catch { toastError("Failed to add subscription"); mutate(); }
    }
  };

  /* voice */
  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const name = String(result.name || result.title || "").trim();
    if (!name) return;
    let amount = Number(result.amount) || 0;
    const amountStr = String(result.amount || "");
    if (amountStr.includes("$") || (amount > 0 && amount < 500))
      amount = usdToInr(amount, usdRate);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, amount,
          billingCycle: result.billingCycle || "monthly",
          renewalDate: result.renewalDate
            ? new Date(String(result.renewalDate))
            : new Date(),
          status: "active",
          category: result.category || "software",
          currency: "INR",
          notes: result.notes || "",
        }),
      });
      if (!res.ok) throw new Error();
      mutate(); success("Subscription added via voice");
    } catch { toastError("Failed to add subscription"); }
  };

  /* delete */
  const deleteSub = async (id: string) => {
    mutate(subs.filter((s) => s.id !== id), false);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      success("Subscription deleted");
    } catch { toastError("Failed to delete"); mutate(); }
  };

  /* derived */
  const totalMonthly = subs
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((a, s) => a + toMonthly(s.amount, s.billingCycle), 0);
  const totalYearly = totalMonthly * 12;
  const renewingSoon = subs.filter((s) => {
    const d = daysUntil(s.renewalDate);
    return d >= 0 && d <= 7 && s.status === "active";
  });

  /* ── form panel ── */
  const FormPanel = () => (
    <form onSubmit={handleSave} className="mb-8 bg-white p-5 md:p-6 rounded-xl border-2 border-purple">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{editingId ? "Edit Subscription" : "New Subscription"}</h3>
        <button type="button" onClick={resetForm} className="text-foreground/40 hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>
      {!editingId && (
        <div className="flex items-center gap-3 mb-4">
          <VoiceInput schema={VOICE_SCHEMAS.subscription} onResult={handleVoiceResult} size="sm" />
          <p className="text-sm text-foreground/40 hidden sm:block">
            Try: &quot;Add Netflix for $15 monthly renewing next Friday&quot;
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input type="text" value={form.name} required
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Service Name"
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />

        {/* smart amount */}
        <div className="relative">
          <input type="text" value={amountRaw} required
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Amount ₹ (or $15 auto-converts)"
            className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none text-sm ${
              amountInr !== null
                ? "border-green-400 bg-green-50"
                : "border-foreground/10 focus:border-purple"
            }`} />
          {amountInr !== null && (
            <p className="absolute -bottom-5 left-0 text-[11px] text-green-700 font-semibold whitespace-nowrap">
              ${parseFloat(amountRaw.replace("$", ""))} → {formatINR(amountInr)} (₹{usdRate.toFixed(1)})
            </p>
          )}
        </div>

        <select value={form.billingCycle}
          onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm">
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>

        <input type="date" value={form.renewalDate} required
          onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />

        <select value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm">
          <option value="streaming">Streaming</option>
          <option value="software">Software</option>
          <option value="utilities">Utilities</option>
          <option value="gaming">Gaming</option>
          <option value="other">Other</option>
        </select>

        <select value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm">
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input type="text" value={form.manageUrl}
          onChange={(e) => setForm({ ...form, manageUrl: e.target.value })}
          placeholder="Manage URL (optional)"
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />

        <input type="text" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)"
          className="md:col-span-2 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />

        <button type="submit"
          className="md:col-span-3 mt-2 flex items-center justify-center gap-2 px-6 py-2.5 bg-purple text-white rounded-lg font-bold text-sm">
          <Save className="w-4 h-4" /> {editingId ? "Update" : "Save"} Subscription
        </button>
      </div>
    </form>
  );

  /* ── render ── */
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full">

      {/* Header */}
      <div className="flex justify-between items-end mb-8 md:mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Subscriptions</h1>
          <p className="text-foreground/60">Track and control your recurring expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceInput schema={VOICE_SCHEMAS.subscription} onResult={handleVoiceResult} label="Adding…" />
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Sub
          </button>
        </div>
      </div>

      {/* Live rate badge */}
      <div className="flex items-center gap-2 mb-5 text-xs text-foreground/50 flex-wrap">
        {rateLoading
          ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading rate…</span>
          : <span>Live rate: <strong className="text-foreground/80">1 USD = ₹{usdRate.toFixed(2)}</strong></span>
        }
        {rateUpdated && !rateLoading && (
          <span>· {new Date(rateUpdated).toLocaleTimeString()}</span>
        )}
        <button onClick={() => mutateRate()}
          className="flex items-center gap-1 text-purple hover:underline">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Renewal alert */}
      {renewingSoon.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Renewals coming up</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {renewingSoon.map((s) =>
                `${s.name} in ${daysUntil(s.renewalDate)}d`
              ).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {[
            { label: "Monthly Spend",  value: formatINRCompact(totalMonthly) },
            { label: "Yearly Spend",   value: formatINRCompact(totalYearly) },
            { label: "Active Subs",    value: String(subs.filter((s) => s.status === "active").length) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-6">
              <p className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">{label}</p>
              <p className="text-3xl md:text-4xl font-mono font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Forms */}
      {showAddForm && !editingId && <FormPanel />}
      {editingId && <FormPanel />}

      {/* Table */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
        {/* Desktop header — hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b-2 border-foreground/5 bg-foreground/5 font-bold text-xs uppercase tracking-widest text-foreground/50">
          <div className="col-span-4">Service</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Cycle</div>
          <div className="col-span-2">Renews</div>
          <div className="col-span-2 text-right">Cost/mo</div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-foreground/5">
            {[1, 2, 3, 4].map((i) => <SkeletonSubRow key={i} />)}
          </div>
        ) : subs.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-foreground/50">
            No subscriptions yet. Add your first one!
          </div>
        ) : (
          <div className="divide-y divide-foreground/5">
            {subs.map((sub) => {
              const days       = daysUntil(sub.renewalDate);
              const renewAlert = days >= 0 && days <= 7;
              const StatusIcon = STATUS_ICONS[sub.status] || CheckCircle2;

              return (
                <div key={sub.id}
                  className="grid grid-cols-12 gap-2 md:gap-4 p-3 md:p-4 items-center hover:bg-[#faf9f8] transition-colors group">

                  {/* Service name + status */}
                  <div className="col-span-8 md:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center font-bold text-base shrink-0">
                      {sub.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{sub.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <StatusIcon className={`w-3 h-3 ${sub.status === "active" ? "text-green-500" : sub.status === "trial" ? "text-amber-500" : "text-foreground/40"}`} />
                        <span className="text-xs text-foreground/50 capitalize">{sub.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category — desktop only */}
                  <div className="hidden md:block col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${CATEGORY_COLORS[sub.category] || "bg-gray-100 text-gray-600"}`}>
                      {sub.category || "other"}
                    </span>
                  </div>

                  {/* Cycle — desktop only */}
                  <div className="hidden md:block col-span-2">
                    <span className="px-2 py-1 bg-foreground/5 rounded text-xs font-bold capitalize">{sub.billingCycle}</span>
                  </div>

                  {/* Renews */}
                  <div className={`hidden md:block col-span-2 font-mono text-xs ${renewAlert ? "text-amber-600 font-bold" : "text-foreground/60"}`}>
                    {renewAlert && <AlertTriangle className="inline w-3 h-3 mr-0.5" />}
                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 0 ? `In ${days}d` : `${Math.abs(days)}d ago`}
                  </div>

                  {/* Cost + actions */}
                  <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                    <span className="font-mono font-bold text-sm">{formatINR(toMonthly(sub.amount, sub.billingCycle), 0)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => startEdit(sub)}
                        className="text-foreground/40 hover:text-purple p-1 rounded" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSub(sub.id)}
                        className="text-foreground/40 hover:text-red-500 p-1 rounded" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
