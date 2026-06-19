"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", amount: 0, billingCycle: "monthly", renewalDate: "" });

  const fetchSubs = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.name.trim() || !newSub.renewalDate) return;

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSub.name,
          amount: Number(newSub.amount),
          billingCycle: newSub.billingCycle,
          renewalDate: new Date(newSub.renewalDate),
          status: "active",
          category: "software"
        })
      });
      if (res.ok) {
        setNewSub({ name: "", amount: 0, billingCycle: "monthly", renewalDate: "" });
        setShowAddForm(false);
        fetchSubs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const name = String(result.name || result.title || "").trim();
    if (!name) return;

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: Number(result.amount) || 0,
          billingCycle: result.billingCycle || "monthly",
          renewalDate: result.renewalDate
            ? new Date(String(result.renewalDate))
            : new Date(),
          status: "active",
          category: result.category || "software",
          notes: result.notes || "",
        }),
      });
      if (res.ok) {
        setShowAddForm(false);
        fetchSubs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSub = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      fetchSubs();
    } catch (err) {
      console.error(err);
    }
  };

  const totalMonthly = subs.reduce((acc, sub) => {
    if (sub.billingCycle === "monthly") return acc + sub.amount;
    if (sub.billingCycle === "yearly") return acc + (sub.amount / 12);
    if (sub.billingCycle === "weekly") return acc + (sub.amount * 4);
    return acc;
  }, 0);

  const totalYearly = subs.reduce((acc, sub) => {
    if (sub.billingCycle === "monthly") return acc + (sub.amount * 12);
    if (sub.billingCycle === "yearly") return acc + sub.amount;
    if (sub.billingCycle === "weekly") return acc + (sub.amount * 52);
    return acc;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      <div>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Subscriptions</h1>
            <p className="text-foreground/60 text-lg">Track your recurring expenses.</p>
          </div>
          <div className="flex items-center gap-3">
            <VoiceInput
              schema={VOICE_SCHEMAS.subscription}
              onResult={handleVoiceResult}
              label="Creating subscription…"
            />
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Sub
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSub} className="mb-8 bg-white p-6 rounded-xl border-2 border-purple">
            <h3 className="font-bold mb-4">New Subscription</h3>
            <div className="flex items-center gap-3 mb-4">
              <VoiceInput schema={VOICE_SCHEMAS.subscription} onResult={handleVoiceResult} size="sm" />
              <p className="text-sm text-foreground/50">
                Try: &quot;Add Netflix for $15 monthly renewing next Friday&quot;
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                value={newSub.name}
                onChange={(e) => setNewSub({...newSub, name: e.target.value})}
                placeholder="Service Name" 
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <input 
                type="number" 
                value={newSub.amount || ''}
                onChange={(e) => setNewSub({...newSub, amount: Number(e.target.value)})}
                placeholder="Amount" 
                step="0.01"
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <select 
                value={newSub.billingCycle}
                onChange={(e) => setNewSub({...newSub, billingCycle: e.target.value})}
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input 
                type="date" 
                value={newSub.renewalDate}
                onChange={(e) => setNewSub({...newSub, renewalDate: e.target.value})}
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <button type="submit" className="md:col-span-4 mt-2 px-6 py-2 bg-purple text-white rounded-lg font-bold">Save Subscription</button>
            </div>
          </form>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
            <h3 className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">Total Monthly Spend</h3>
            <p className="text-4xl font-mono font-bold">${totalMonthly.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
            <h3 className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">Total Yearly Spend</h3>
            <p className="text-4xl font-mono font-bold">${totalYearly.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
            <h3 className="text-foreground/50 font-bold uppercase tracking-widest text-xs mb-2">Active Subs</h3>
            <p className="text-4xl font-mono font-bold">{subs.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-foreground/5 bg-foreground/5 font-bold text-xs uppercase tracking-widest text-foreground/50">
            <div className="col-span-5">Service</div>
            <div className="col-span-3">Billing Cycle</div>
            <div className="col-span-2">Next Renewal</div>
            <div className="col-span-2 text-right">Cost</div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm font-bold text-foreground/50">Loading subscriptions...</div>
          ) : subs.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-foreground/50">No subscriptions yet.</div>
          ) : (
            <div className="divide-y-2 divide-foreground/5">
              {subs.map((sub) => (
                <div key={sub.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#faf9f8] transition-colors group relative">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border-2 border-foreground/10 flex items-center justify-center text-lg">{sub.name.charAt(0)}</div>
                    <span className="font-bold">{sub.name}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="px-2 py-1 bg-foreground/5 rounded text-xs font-bold capitalize">{sub.billingCycle}</span>
                  </div>
                  <div className="col-span-2 font-mono text-sm text-foreground/70">
                    {new Date(sub.renewalDate).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-4 font-mono font-bold">
                    <span>${sub.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => deleteSub(sub.id)} 
                      className="text-foreground/30 hover:text-light-red opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
