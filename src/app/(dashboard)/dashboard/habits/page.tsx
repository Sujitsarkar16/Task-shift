"use client";

import { useState } from "react";
import { Flame, Plus, Trash2, Trophy } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import { computeStreaks } from "@/lib/habits";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { SkeletonHabitRow } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function HabitsPage() {
  const { habits, isLoading, mutate } = useHabits();
  const { success, error: toastError } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const optimistic: Habit = {
      id: `tmp-${Date.now()}`, title: newHabitTitle, history: [],
      currentStreak: 0, longestStreak: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    mutate([...habits, optimistic], false);
    setNewHabitTitle(""); setShowAddForm(false);
    try {
      await fetch("/api/habits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newHabitTitle, history: [], currentStreak: 0, longestStreak: 0 }),
      });
      mutate();
      success("Habit created");
    } catch { toastError("Failed to create habit"); mutate(); }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "").trim();
    if (!title) return;
    try {
      await fetch("/api/habits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: result.description || "", history: [], currentStreak: 0, longestStreak: 0 }),
      });
      mutate(); success("Habit added via voice");
    } catch { toastError("Failed to add habit"); }
  };

  const deleteHabit = async (id: string) => {
    mutate(habits.filter((h) => h.id !== id), false);
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      success("Habit deleted");
    } catch { toastError("Failed to delete habit"); mutate(); }
  };

  const toggleHabitHistory = async (habit: Habit, dateStr: string) => {
    const historySet = new Set<string>(habit.history);
    if (historySet.has(dateStr)) historySet.delete(dateStr);
    else historySet.add(dateStr);
    const newHistory = Array.from(historySet);
    const { currentStreak, longestStreak } = computeStreaks(newHistory);
    // Optimistic update
    mutate(habits.map((h) => h.id === habit.id ? { ...h, history: newHistory, currentStreak, longestStreak } : h), false);
    try {
      await fetch(`/api/habits/${habit.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }),
      });
    } catch { toastError("Failed to update habit"); mutate(); }
  };

  const totalCompleted = habits.filter((h) => h.history.includes(todayStr)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full">

      {/* ── Colorful header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 p-5 md:p-6 mb-6 text-white shadow-lg shadow-orange-200">
        <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 left-8 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold">Habits</h1>
            </div>
            <p className="text-white/70 text-sm">Build consistency, one day at a time.</p>
          </div>
          <div className="flex items-center gap-2">
            <VoiceInput schema={VOICE_SCHEMAS.habit} onResult={handleVoiceResult} label="Creating habit…" />
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition-colors">
              <Plus className="w-4 h-4" /> New Habit
            </button>
          </div>
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-orange-100 p-4 md:p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Today</p>
          <p className="text-2xl md:text-3xl font-extrabold">
            {totalCompleted}<span className="text-foreground/30 text-lg">/{habits.length}</span>
          </p>
          <p className="text-xs text-foreground/50 mt-1">completed</p>
        </div>
        <div className="bg-white rounded-2xl border border-yellow-100 p-4 md:p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Best</p>
          <p className="text-2xl md:text-3xl font-extrabold flex items-center gap-1">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {isLoading ? "—" : Math.max(0, ...habits.map((h) => h.longestStreak))}d
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-orange-100 p-4 md:p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">On fire 🔥</p>
          <p className="text-2xl md:text-3xl font-extrabold text-orange-500">
            {isLoading ? "—" : habits.filter((h) => h.currentStreak > 0).length}
          </p>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddHabit} className="mb-6 bg-white p-5 rounded-xl border-2 border-purple">
          <h3 className="font-bold mb-4">New Habit</h3>
          <div className="flex gap-3 items-center">
            <input type="text" value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="What habit do you want to build?" autoFocus
              className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple text-sm" />
            <button type="submit" className="px-5 py-2 bg-purple text-white rounded-lg font-bold text-sm">Save</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-8">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="font-bold text-lg md:text-xl">Past 14 Days</h2>
        </div>
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => <SkeletonHabitRow key={i} />)}
          </div>
        ) : habits.length === 0 ? (
          <div className="p-8 text-center text-foreground/50 font-bold">No habits yet. Create your first one!</div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {habits.map((habit) => {
              const completedCount = last14Days.filter((d) => habit.history.includes(d)).length;
              const streak = habit.currentStreak;
              return (
                <div key={habit.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 group">
                  <div className="w-full md:w-52 flex justify-between items-start shrink-0">
                    <div>
                      <span className="font-bold text-sm">{habit.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-foreground/50 font-mono text-xs">{completedCount}/14</span>
                        {streak > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-500 text-xs font-bold">
                            <Flame className="w-3 h-3" />{streak}d
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)}
                      className="text-foreground/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 flex gap-1 md:gap-1.5">
                    {last14Days.map((dateStr) => {
                      const done = habit.history.includes(dateStr);
                      const isToday = dateStr === todayStr;
                      return (
                        <div key={dateStr} onClick={() => toggleHabitHistory(habit, dateStr)}
                          title={dateStr}
                          className={`h-8 md:h-10 flex-1 rounded-md cursor-pointer transition-all ${
                            done ? "bg-purple shadow-sm"
                            : isToday ? "bg-purple/10 border-2 border-purple/40 hover:bg-purple/20"
                            : "bg-foreground/5 border-2 border-foreground/10 hover:border-purple/50"
                          }`} />
                      );
                    })}
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
