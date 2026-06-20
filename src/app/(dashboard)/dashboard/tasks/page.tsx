"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Plus, Trash2, Calendar, Tag, ChevronDown, X } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";

const PRIORITIES = ["all", "urgent", "high", "medium", "low"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

function formatDeadline(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((d.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: "text-red-500" };
  if (diff === 0) return { label: "Due today", color: "text-orange-500 font-bold" };
  if (diff === 1) return { label: "Due tomorrow", color: "text-yellow-600" };
  return { label: `Due ${d.toLocaleDateString()}`, color: "text-foreground/50" };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "done">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    priority: "medium",
    deadline: new Date().toISOString().split("T")[0],
    category: "",
  });

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) setTasks(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, isCompleted: false, reminderDays: 0, reminderSent: false }),
      });
      if (res.ok) {
        setNewTask({ title: "", priority: "medium", deadline: new Date().toISOString().split("T")[0], category: "" });
        setShowAddForm(false);
        fetchTasks();
      }
    } catch (err) { console.error(err); }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, isCompleted: !currentStatus } : t));
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "").trim();
    if (!title) return;
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority: result.priority || "medium",
          deadline: result.deadline ? new Date(String(result.deadline)) : new Date(),
          category: result.category,
          reminderDays: result.reminderDays || 0,
          emailNotification: result.emailNotification ?? false,
          isCompleted: false,
          reminderSent: false,
        }),
      });
      if (res.ok) { setShowAddForm(false); fetchTasks(); }
    } catch (err) { console.error(err); }
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus === "active" && t.isCompleted) return false;
    if (filterStatus === "done" && !t.isCompleted) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const activeFilters = (filterPriority !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const overdueCount = tasks.filter((t) => {
    if (t.isCompleted) return false;
    return new Date(t.deadline) < new Date();
  }).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Tasks</h1>
          <p className="text-foreground/60 text-lg">Manage and prioritize your work.</p>
        </div>
        <div className="flex gap-3 items-center">
          <VoiceInput schema={VOICE_SCHEMAS.task} onResult={handleVoiceResult} label="Creating task…" />

          {/* Filter dropdown */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium text-sm transition-colors ${
                activeFilters > 0
                  ? "border-purple bg-purple/5 text-purple"
                  : "border-foreground/10 hover:bg-foreground/5"
              }`}
            >
              Filter {activeFilters > 0 && <span className="bg-purple text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>}
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border-2 border-foreground/10 shadow-xl z-10 p-4 space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "active", "done"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                          filterStatus === s ? "bg-foreground text-background border-foreground" : "border-foreground/10 hover:bg-foreground/5"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">Priority</p>
                  <div className="flex gap-2 flex-wrap">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterPriority(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                          filterPriority === p ? "bg-foreground text-background border-foreground" : "border-foreground/10 hover:bg-foreground/5"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button
                    onClick={() => { setFilterPriority("all"); setFilterStatus("all"); }}
                    className="w-full text-xs text-foreground/40 hover:text-foreground flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Total</p>
          <p className="text-2xl font-bold font-mono">{tasks.length}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Completed</p>
          <p className="text-2xl font-bold font-mono text-green-600">{completedCount}</p>
        </div>
        <div className={`rounded-xl border-2 p-4 ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-foreground/10"}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Overdue</p>
          <p className={`text-2xl font-bold font-mono ${overdueCount > 0 ? "text-red-600" : ""}`}>{overdueCount}</p>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="mb-6 bg-white p-6 rounded-xl border-2 border-purple">
          <h3 className="font-bold mb-4">New Task</h3>
          <div className="flex gap-4 items-center mb-4">
            <VoiceInput schema={VOICE_SCHEMAS.task} onResult={handleVoiceResult} size="sm" />
            <p className="text-sm text-foreground/40">Try: "Fix login bug, high priority, due Friday"</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="What needs to be done?"
              className="md:col-span-2 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
              autoFocus
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
            />
            <input
              type="text"
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              placeholder="Category (optional)"
              className="md:col-span-3 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm"
            />
            <button type="submit" className="px-6 py-2 bg-purple text-white rounded-lg font-bold text-sm">
              Save
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-foreground/50 font-bold">Loading tasks...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-foreground/50 font-bold">
            {activeFilters > 0 ? "No tasks match your filters." : "No tasks yet. Create one!"}
          </div>
        ) : (
          <div className="divide-y divide-foreground/5">
            {filtered.map((t) => {
              const dl = t.deadline ? formatDeadline(t.deadline) : null;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#faf9f8] transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTask(t.id, t.isCompleted)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                        t.isCompleted ? "bg-purple border-purple" : "border-foreground/30 hover:border-purple hover:bg-purple/5"
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 text-white ${t.isCompleted ? "opacity-100" : "opacity-0"}`} />
                    </button>
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${t.isCompleted ? "line-through text-foreground/40" : ""}`}>
                        {t.title}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {dl && (
                          <span className={`flex items-center gap-1 text-xs ${dl.color}`}>
                            <Calendar className="w-3 h-3" /> {dl.label}
                          </span>
                        )}
                        {t.category && (
                          <span className="flex items-center gap-1 text-xs text-foreground/40">
                            <Tag className="w-3 h-3" /> {t.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_COLORS[t.priority] || "bg-foreground/5 border-foreground/10"}`}>
                      {t.priority}
                    </span>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-foreground/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
