"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, X, Save, AlertTriangle, CheckCircle2, PauseCircle, RefreshCw } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import { formatINR, formatINRCompact, usdToInr, fetchUsdToInrRate, FALLBACK_USD_TO_INR } from "@/lib/currency";

const CATEGORY_COLORS: Record<string, string> = {
  streaming: "bg-pink-100 text-pink-700",
  software: "bg-blue-100 text-blue-700",
  utilities: "bg-yellow-100 text-yellow-700",
  gaming: "bg-purple-soft text-purple",
  other: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<string, any> = {
  active: CheckCircle2,
  trial: AlertTriangle,
  paused: PauseCircle,
  cancelled: X,
};

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function toMonthly(amount: number, cycle: string) {
  if (cycle === "weekly") return amount * 4.33;
  if (cycle === "monthly") return amount;
  if (cycle === "quarterly") return amount / 3;
  if (cycle === "yearly") return amount / 12;
  return amount;
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [usdRate, setUsdRate] = useState<number>(FALLBACK_USD_TO_INR);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string>("");
  const [rateLoading, setRateLoading] = useState(false);

  // Raw string so user can type "$15" and we auto-convert
  const [amountRaw, setAmountRaw] = useState("");
  const [amountConverted, setAmountConverted] = useState<number | null>(null); // INR preview when USD detected

  const blankForm = {
    name: "", amount: 0, billingCycle: "monthly", renewalDate: "",
    category: "software", status: "active", currency: "INR", notes: "", manageUrl: "",
  };
  const [form, setForm] = useState<typeof blankForm>(blankForm);

  // Fetch live rate on mount
  useEffect(() => {
    const load = async () => {
      setRateLoading(true);
      try {
        const res = await fetch("/api/currency/inr-rate");
        if (res.ok) {
          const data = await res.json();
          setUsdRate(data.rate);
          setRateUpdatedAt(data.updatedAt);
        }
      } catch {}
      setRateLoading(false);
    };
    load();
  }, []);

  const refreshRate = async () => {
    setRateLoading(true);
    try {
      // Force a fresh fetch by busting the cache via a timestamp param
      const res = await fetch(`/api/currency/inr-rate?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setUsdRate(data.rate);
        setRateUpdatedAt(data.updatedAt);
      }
    } catch {}
    setRateLoading(false);
  };

  // Parse amount field — detect $ prefix and convert
  const handleAmountChange = (raw: string) => {
    setAmountRaw(raw);
    const hasDollar = raw.trim().startsWith("$");
    const numeric = parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
    if (hasDollar && numeric > 0) {
      const inr = usdToInr(numeric, usdRate);
      setAmountConverted(inr);
      setForm((f) => ({ ...f, amount: inr, currency: "INR" }));
    } else {
      setAmountConverted(null);
      setForm((f) => ({ ...f, amount: numeric }));
    }
  };

  const fetchSubs = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) setSubs(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSubs(); }, []);

  const startEdit = (sub: any) => {
    setEditingId(sub.id);
    const raw = String(sub.amount);
    setAmountRaw(raw);
    setAmountConverted(null);
    setForm({
      name: sub.name,
      amount: sub.amount,
      billingCycle: sub.billingCycle,
      renewalDate: new Date(sub.renewalDate).toISOString().split("T")[0],
      category: sub.category || "other",
      status: sub.status || "active",
      currency: "INR",
      notes: sub.notes || "",
      manageUrl: sub.manageUrl || "",
    });
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm(blankForm);
    setAmountRaw("");
    setAmountConverted(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.renewalDate) return;
    const payload = { ...form, amount: Number(form.amount), renewalDate: new Date(form.renewalDate), currency: "INR" };

    try {
      if (editingId) {
        const res = await fetch(`/api/subscriptions/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { resetForm(); fetchSubs(); }
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { resetForm(); fetchSubs(); }
      }
    } catch (err) { console.error(err); }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const name = String(result.name || result.title || "").trim();
    if (!name) return;

    // Voice amount — could be USD; convert if small (< 500, likely USD)
    let amount = Number(result.amount) || 0;
    const amountStr = String(result.amount || "");
    if (amountStr.includes("$") || (amount > 0 && amount < 500)) {
      amount = usdToInr(amount, usdRate);
    }

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, amount,
          billingCycle: result.billingCycle || "monthly",
          renewalDate: result.renewalDate ? new Date(String(result.renewalDate)) : new Date(),
          status: "active",
          category: result.category || "software",
          currency: "INR",
          notes: result.notes || "",
        }),
      });
      if (res.ok) { resetForm(); fetchSubs(); }
    } catch (err) { console.error(err); }
  };

  const deleteSub = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      fetchSubs();
    } catch (err) { console.error(err); }
  };

  const totalMonthly = subs
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((acc, s) => acc + toMonthly(s.amount, s.billingCycle), 0);
  const totalYearly = totalMonthly * 12;

  const renewingSoon = subs.filter((s) => {
    const days = daysUntil(s.renewalDate);
    return days >= 0 && days <= 7 && s.status === "active";
  });

  const FormPanel = () => (
    <form onSubmit={handleSave} className="mb-8 bg-white p-6 rounded-xl border-2 border-purple">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{editingId ? "Edit Subscription" : "New Subscription"}</h3>
        <button type="button" onClick={resetForm} className="text-foreground/40 hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>
      {!editingId && (
        <div className="flex items-center gap-3 mb-4">
          <VoiceInput schema={VOICE_SCHEMAS.subscription} onResult={handleVoiceResult} size="sm" />
          <p className="text-sm text-foreground/40">Try: "Add Netflix for $15 monthly renewing next Friday"</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Service Name" required
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
        />

        {/* Smart amount input */}
        <div className="relative">
          <input
            type="text" value={amountRaw}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Amount in ₹ (or $15 to auto-convert)"
            required
            className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none text-sm ${
              amountConverted !== null
                ? "border-green-400 bg-green-50 focus:border-green-500"
                : "border-foreground/10 focus:border-purple"
            }`}
          />
          {amountConverted !== null && (
            <div className="absolute -bottom-5 left-0 text-[11px] text-green-600 font-semibold">
              ${parseFloat(amountRaw.replace("$",""))} USD → {formatINR(amountConverted)} (rate: ₹{usdRate.toFixed(2)})
            </div>
          )}
        </div>

        <select
          value={form.billingCycle}
          onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>

        <input
          type="date" value={form.renewalDate}
          onChange={(e) => setForm({ ...form, renewalDate: e.target.value })}
          required className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
        />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm">
          <option value="streaming">Streaming</option>
          <option value="software">Software</option>
          <option value="utilities">Utilities</option>
          <option value="gaming">Gaming</option>
          <option value="other">Other</option>
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm">
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="text" value={form.manageUrl} onChange={(e) => setForm({ ...form, manageUrl: e.target.value })}
          placeholder="Manage URL (optional)"
          className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />
        <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)"
          className="md:col-span-2 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />
        <button type="submit"
          className="md:col-span-3 mt-3 flex items-center justify-center gap-2 px-6 py-2.5 bg-purple text-white rounded-lg font-bold">
          <Save className="w-4 h-4" /> {editingId ? "Update" : "Save"} Subscription
        </button>
      </div>
    </form>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Subscriptions</h1>
          <p className="text-foreground/60 text-lg">Track and control your recurring expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceInput schema={VOICE_SCHEMAS.subscription} onResult={handleVoiceResult} label="Adding subscription…" />
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Sub
          </button>
        </div>
      </div>

      {/* Live rate badge */}
      <div className="flex items-center gap-2 mb-6 text-xs text-foreground/50">
        <span>Live rate: <strong className="text-foreground/80">1 USD = ₹{usdRate.toFixed(2)}</strong></span>
        {rateUpdatedAt && (
          <span>· updated {new Date(rateUpdatedAt).toLocaleTimeString()}</span>
        )}
        <button
          onClick={refreshRate}
          disabled={rateLoading}
          className="flex items-center gap-1 text-purple hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${rateLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Renewal alert */}
      {renewingSoon.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Renewals coming up</p>
            <p className="text-amber-700 text-xs mt-0.5">
              {renewingSoon
                .map((s) => `${s.name} in ${daysUntil(s.renewalDate)} day${daysUntil(s.renewalDate) !== 1 ? "s" : ""}`)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <p className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">Monthly Spend</p>
          <p className="text-4xl font-mono font-bold">{formatINRCompact(totalMonthly)}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <p className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">Yearly Spend</p>
          <p className="text-4xl font-mono font-bold">{formatINRCompact(totalYearly)}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <p className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">Active Subs</p>
          <p className="text-4xl font-mono font-bold">{subs.filter((s) => s.status === "active").length}</p>
        </div>
      </div>

      {(showAddForm && !editingId) && <FormPanel />}
      {editingId && <FormPanel />}

      {/* Table */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-foreground/5 bg-foreground/5 font-bold text-xs uppercase tracking-widest text-foreground/50">
          <div className="col-span-4">Service</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Cycle</div>
          <div className="col-span-2">Renews</div>
          <div className="col-span-2 text-right">Cost/mo</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-foreground/50">Loading subscriptions...</div>
        ) : subs.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-foreground/50">No subscriptions yet.</div>
        ) : (
          <div className="divide-y-2 divide-foreground/5">
            {subs.map((sub) => {
              const days = daysUntil(sub.renewalDate);
              const renewAlert = days >= 0 && days <= 7;
              const StatusIcon = STATUS_ICONS[sub.status] || CheckCircle2;
              return (
                <div key={sub.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#faf9f8] transition-colors group">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-foreground/5 border-2 border-foreground/10 flex items-center justify-center text-lg font-bold shrink-0">
                      {sub.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{sub.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusIcon className={`w-3 h-3 ${sub.status === "active" ? "text-green-500" : sub.status === "trial" ? "text-amber-500" : "text-foreground/40"}`} />
                        <span className="text-xs text-foreground/50 capitalize">{sub.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${CATEGORY_COLORS[sub.category] || "bg-gray-100 text-gray-600"}`}>
                      {sub.category || "other"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-1 bg-foreground/5 rounded text-xs font-bold capitalize">{sub.billingCycle}</span>
                  </div>
                  <div className={`col-span-2 font-mono text-xs ${renewAlert ? "text-amber-600 font-bold" : "text-foreground/70"}`}>
                    {renewAlert && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : days > 0 ? `In ${days}d` : `${Math.abs(days)}d ago`}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <span className="font-mono font-bold text-sm">{formatINR(toMonthly(sub.amount, sub.billingCycle), 0)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(sub)} className="text-foreground/40 hover:text-purple p-1 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSub(sub.id)} className="text-foreground/40 hover:text-red-500 p-1 rounded">
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
