"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Plus, Trash2, Calendar, Tag, ChevronDown, X, CheckSquare2 } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import { useTasks, type Task } from "@/hooks/useTasks";
import { SkeletonTaskRow } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const PRIORITIES = ["all", "urgent", "high", "medium", "low"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high:   "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};
const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-green-400",
};

function formatDeadline(date: string) {
  const d    = new Date(date);
  const diff = Math.floor((d.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: "text-red-500" };
  if (diff === 0) return { label: "Due today",     color: "text-orange-500 font-bold" };
  if (diff === 1) return { label: "Due tomorrow",  color: "text-yellow-600" };
  return { label: `Due ${d.toLocaleDateString()}`, color: "text-foreground/50" };
}

export default function TasksPage() {
  const { tasks, isLoading, mutate } = useTasks();
  const { success, error: toastError } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority>("all");
  const [filterStatus, setFilterStatus]     = useState<"all" | "active" | "done">("all");
  const [filterOpen, setFilterOpen]         = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [newTask, setNewTask] = useState({
    title: "", priority: "medium",
    deadline: new Date().toISOString().split("T")[0],
    category: "",
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    const optimistic: Task = {
      id: `tmp-${Date.now()}`, ...newTask as any, isCompleted: false,
      reminderDays: 0, reminderSent: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mutate([optimistic, ...tasks], false);
    setNewTask({ title: "", priority: "medium", deadline: new Date().toISOString().split("T")[0], category: "" });
    setShowAddForm(false);
    try {
      await fetch("/api/todos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, isCompleted: false, reminderDays: 0, reminderSent: false }),
      });
      mutate(); success("Task added");
    } catch { toastError("Failed to add task"); mutate(); }
  };

  const toggleTask = async (id: string, current: boolean) => {
    mutate(tasks.map((t) => t.id === id ? { ...t, isCompleted: !current } : t), false);
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      });
    } catch { toastError("Failed to update task"); mutate(); }
  };

  const deleteTask = async (id: string) => {
    mutate(tasks.filter((t) => t.id !== id), false);
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      success("Task deleted");
    } catch { toastError("Failed to delete task"); mutate(); }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "").trim();
    if (!title) return;
    try {
      await fetch("/api/todos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, priority: result.priority || "medium",
          deadline: result.deadline ? new Date(String(result.deadline)) : new Date(),
          category: result.category, reminderDays: result.reminderDays || 0,
          emailNotification: result.emailNotification ?? false,
          isCompleted: false, reminderSent: false,
        }),
      });
      mutate(); success("Task added via voice");
    } catch { toastError("Failed to add task"); }
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus === "active" && t.isCompleted) return false;
    if (filterStatus === "done"   && !t.isCompleted) return false;
    if (filterPriority !== "all"  && t.priority !== filterPriority) return false;
    return true;
  });

  const activeFilters  = (filterPriority !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const overdueCount   = tasks.filter((t) => !t.isCompleted && new Date(t.deadline) < new Date()).length;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full">

      {/* ── Colorful header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-5 md:p-6 mb-6 text-white shadow-lg shadow-blue-200">
        <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 left-8 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckSquare2 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold">Tasks</h1>
            </div>
            <p className="text-white/70 text-sm">Manage and prioritize your work.</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <VoiceInput schema={VOICE_SCHEMAS.task} onResult={handleVoiceResult} label="Creating…" />
            <div ref={filterRef} className="relative">
              <button onClick={() => setFilterOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all border ${
                  activeFilters > 0 ? "bg-white text-blue-600 border-white" : "bg-white/20 border-white/30 text-white hover:bg-white/30"
                }`}>
                Filter
                {activeFilters > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilters}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-foreground/10 shadow-xl z-20 p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">Status</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(["all","active","done"] as const).map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                            filterStatus === s ? "bg-blue-600 text-white" : "bg-foreground/5 hover:bg-foreground/10"
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-2">Priority</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {PRIORITIES.map((p) => (
                        <button key={p} onClick={() => setFilterPriority(p)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                            filterPriority === p ? "bg-blue-600 text-white" : "bg-foreground/5 hover:bg-foreground/10"
                          }`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  {activeFilters > 0 && (
                    <button onClick={() => { setFilterPriority("all"); setFilterStatus("all"); }}
                      className="w-full text-xs text-foreground/40 hover:text-foreground flex items-center justify-center gap-1">
                      <X className="w-3 h-3" /> Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-foreground/8 p-4 shadow-sm">
          <p className="text-xs font-bold text-foreground/40 mb-1">Total</p>
          <p className="text-2xl font-extrabold">{tasks.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm">
          <p className="text-xs font-bold text-foreground/40 mb-1">Completed</p>
          <p className="text-2xl font-extrabold text-green-600">{completedCount}</p>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-foreground/8"}`}>
          <p className="text-xs font-bold text-foreground/40 mb-1">Overdue</p>
          <p className={`text-2xl font-extrabold ${overdueCount > 0 ? "text-red-600" : ""}`}>{overdueCount}</p>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-5 bg-white rounded-2xl border border-blue-200 shadow-md p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-700">
            <Plus className="w-4 h-4" /> New Task
          </h3>
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" value={newTask.title} autoFocus required
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="What needs to be done?"
              className="md:col-span-2 px-4 py-2.5 rounded-xl border border-foreground/15 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm" />
            <select value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-foreground/15 focus:outline-none focus:border-blue-400 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input type="date" value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-foreground/15 focus:outline-none focus:border-blue-400 text-sm" />
            <input type="text" value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              placeholder="Category (optional)"
              className="md:col-span-3 px-4 py-2.5 rounded-xl border border-foreground/15 focus:outline-none focus:border-blue-400 text-sm" />
            <button type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
              Save
            </button>
          </form>
        </div>
      )}

      {/* Task list */}
      <div className="bg-white rounded-2xl border border-foreground/8 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-foreground/5">
            {[1,2,3,4,5].map((i) => <SkeletonTaskRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-foreground/40">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">{activeFilters > 0 ? "No tasks match your filters." : "No tasks yet. Create one!"}</p>
          </div>
        ) : (
          <div className="divide-y divide-foreground/5">
            {filtered.map((t) => {
              const dl = t.deadline ? formatDeadline(t.deadline) : null;
              return (
                <div key={t.id}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-blue-50/30 transition-colors group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button onClick={() => toggleTask(t.id, t.isCompleted)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        t.isCompleted ? "bg-blue-600 border-blue-600" : "border-foreground/25 hover:border-blue-400"
                      }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 text-white ${t.isCompleted ? "opacity-100" : "opacity-0"}`} />
                    </button>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] || "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${t.isCompleted ? "line-through text-foreground/35" : ""}`}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {dl && <span className={`flex items-center gap-1 text-xs ${dl.color}`}><Calendar className="w-3 h-3" />{dl.label}</span>}
                        {t.category && <span className="flex items-center gap-1 text-xs text-foreground/40"><Tag className="w-3 h-3" />{t.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_COLORS[t.priority] || ""}`}>
                      {t.priority}
                    </span>
                    <button onClick={() => deleteTask(t.id)}
                      className="text-foreground/25 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
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
