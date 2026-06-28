"use client";

import { useEffect, useRef, useState } from "react";
import { Search, CheckCircle2, Activity, NotebookPen, X, Loader2, Plus } from "lucide-react";
import { mutate } from "swr";
import { useToast } from "@/components/ui/Toast";

type Mode = "task" | "habit" | "note";

const MODE_META = {
  task: { icon: CheckCircle2, label: "Task", placeholder: "Add a task… (e.g. Fix login bug, high priority)" },
  habit: { icon: Activity, label: "Habit", placeholder: "Add a habit… (e.g. Read 20 minutes)" },
  note: { icon: NotebookPen, label: "Note", placeholder: "Add a note…" },
} as const;

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("task");
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSave = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      if (mode === "task") {
        let priority = "medium", title = input;
        if (/urgent/i.test(input)) { priority = "urgent"; title = title.replace(/urgent/i, "").trim(); }
        else if (/high/i.test(input)) { priority = "high"; title = title.replace(/high priority/i, "").replace(/high/i, "").trim(); }
        else if (/low/i.test(input)) { priority = "low"; title = title.replace(/low priority/i, "").replace(/low/i, "").trim(); }
        await fetch("/api/todos", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, priority, deadline: new Date().toISOString(), isCompleted: false, reminderDays: 0, reminderSent: false }),
        });
        mutate("/api/todos"); // revalidate SWR cache — updates all pages using useTasks
        success("Task added");
      } else if (mode === "habit") {
        await fetch("/api/habits", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: input, history: [], currentStreak: 0, longestStreak: 0 }),
        });
        mutate("/api/habits");
        success("Habit added");
      } else if (mode === "note") {
        await fetch("/api/notes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: input, content: "", type: "text" }),
        });
        mutate("/api/notes");
        success("Note added");
      }
      setInput("");
      setOpen(false);
    } catch { toastError("Failed to save"); }
    finally { setSaving(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground/50 bg-foreground/5 border-2 border-foreground/10 rounded-lg hover:border-foreground/30 hover:text-foreground transition-colors"
        title="Quick capture (Ctrl+K)">
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Quick add</span>
        <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono bg-foreground/10 px-1.5 rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-20 md:pt-24 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-foreground/10 overflow-hidden">
        <div className="flex border-b-2 border-foreground/5">
          {(Object.keys(MODE_META) as Mode[]).map((m) => {
            const Icon = MODE_META[m].icon;
            return (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  mode === m ? "bg-purple/5 text-purple border-b-2 border-purple" : "text-foreground/50 hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" /> {MODE_META[m].label}
              </button>
            );
          })}
        </div>
        <div className="p-4 flex items-center gap-3">
          <Search className="w-4 h-4 text-foreground/30 shrink-0" />
          <input ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            placeholder={MODE_META[mode].placeholder}
            className="flex-1 outline-none text-sm" />
          {input && <button onClick={() => setInput("")} className="text-foreground/30 hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
        <div className="px-4 pb-4 flex items-center justify-between">
          <p className="text-xs text-foreground/30">
            <kbd className="font-mono bg-foreground/5 px-1 rounded">Enter</kbd> to save · <kbd className="font-mono bg-foreground/5 px-1 rounded">Esc</kbd> to close
          </p>
          <button onClick={handleSave} disabled={!input.trim() || saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-purple/90 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

