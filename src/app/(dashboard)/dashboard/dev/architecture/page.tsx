"use client";

import { useCallback, useEffect, useState } from "react";
import { Compass, Plus, Trash2 } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";

type Adr = {
  id: string;
  title: string;
  code: string;
  language: string;
  tags?: string[];
};

const ADR_TEMPLATE = `## Status
Proposed

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this change?
`;

export default function ArchitecturePage() {
  const [adrs, setAdrs] = useState<Adr[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Adr | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAdrs = useCallback(async () => {
    try {
      const res = await fetch("/api/snippets?language=adr");
      if (res.ok) {
        setAdrs(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdrs();
  }, [fetchAdrs]);

  useEffect(() => {
    if (adrs.length > 0 && !active) {
      setActive(adrs[0]);
    }
  }, [adrs, active]);

  const createAdr = async () => {
    const res = await fetch("/api/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `ADR-${adrs.length + 1}: New decision`,
        code: ADR_TEMPLATE,
        language: "adr",
        tags: ["architecture"],
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setAdrs((prev) => [created, ...prev]);
      setActive(created);
    }
  };

  const saveAdr = async () => {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/snippets/${active.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: active.title, code: active.code }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAdrs((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        setActive(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteAdr = async (id: string) => {
    if (!confirm("Delete this ADR?")) return;
    await fetch(`/api/snippets/${id}`, { method: "DELETE" });
    setAdrs((prev) => prev.filter((a) => a.id !== id));
    if (active?.id === id) setActive(null);
  };

  return (
    <DevPageShell>
      <div className="max-w-6xl mx-auto px-6 py-12 w-full h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-end mb-8 shrink-0">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <Compass className="w-8 h-8 text-purple" />
                Architecture
              </h1>
              <p className="text-foreground/60 text-lg">
                Architecture Decision Records (ADRs) for system design.
              </p>
            </div>
            <button
              type="button"
              onClick={createAdr}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> New ADR
            </button>
          </div>

          <div className="flex-1 flex gap-6 min-h-0">
            <div className="w-72 shrink-0 bg-white rounded-xl border-2 border-foreground/10 p-3 overflow-y-auto">
              {adrs.length === 0 ? (
                <p className="p-4 text-sm text-foreground/50 text-center">No ADRs yet.</p>
              ) : (
                <div className="space-y-1">
                  {adrs.map((adr) => (
                    <div
                      key={adr.id}
                      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        active?.id === adr.id ? "bg-purple-soft/40 border-2 border-purple/30" : "hover:bg-[#faf9f8] border-2 border-transparent"
                      }`}
                      onClick={() => setActive(adr)}
                    >
                      <span className="text-sm font-medium truncate flex-1">{adr.title}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAdr(adr.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-light-red transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {active ? (
              <div className="flex-1 bg-white rounded-xl border-2 border-foreground/10 p-6 flex flex-col min-h-0">
                <input
                  value={active.title}
                  onChange={(e) => setActive({ ...active, title: e.target.value })}
                  className="text-xl font-bold outline-none mb-4 shrink-0"
                />
                <textarea
                  value={active.code}
                  onChange={(e) => setActive({ ...active, code: e.target.value })}
                  className="flex-1 font-mono text-sm leading-relaxed border-2 border-foreground/10 rounded-lg p-4 resize-none outline-none focus:border-purple min-h-0"
                />
                <div className="mt-4 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={saveAdr}
                    disabled={saving}
                    className="px-6 py-2 bg-purple text-white rounded-lg font-bold disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save ADR"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white rounded-xl border-2 border-foreground/10">
                <p className="text-foreground/40 font-medium">Select or create an ADR.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DevPageShell>
  );
}
