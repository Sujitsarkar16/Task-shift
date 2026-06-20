"use client";

import { useState, useEffect } from "react";
import { Flame, Plus, Trash2, Trophy } from "lucide-react";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { VOICE_SCHEMAS } from "@/lib/voice/schemas";
import { computeStreaks } from "@/lib/habits";

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        setHabits(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHabits(); }, []);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newHabitTitle, history: [], currentStreak: 0, longestStreak: 0 }),
      });
      if (res.ok) { setNewHabitTitle(""); setShowAddForm(false); fetchHabits(); }
    } catch (err) { console.error(err); }
  };

  const handleVoiceResult = async (result: Record<string, unknown>) => {
    const title = String(result.title || "").trim();
    if (!title) return;
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: result.description || "", history: [], currentStreak: 0, longestStreak: 0 }),
      });
      if (res.ok) { setShowAddForm(false); fetchHabits(); }
    } catch (err) { console.error(err); }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
      fetchHabits();
    } catch (err) { console.error(err); }
  };

  const toggleHabitHistory = async (habit: any, dateStr: string) => {
    const historySet = new Set<string>(habit.history || []);
    if (historySet.has(dateStr)) historySet.delete(dateStr);
    else historySet.add(dateStr);

    const newHistory = Array.from(historySet);
    const { currentStreak, longestStreak } = computeStreaks(newHistory);

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => h.id === habit.id ? { ...h, history: newHistory, currentStreak, longestStreak } : h)
    );

    try {
      await fetch(`/api/habits/${habit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }),
      });
    } catch (err) {
      console.error(err);
      fetchHabits();
    }
  };

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  // Only show last 14 in the grid, but use 30 for context
  const displayDays = last30Days.slice(16);

  const totalCompleted = habits.reduce((acc, h) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if ((h.history || []).includes(todayStr)) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Habits</h1>
          <p className="text-foreground/60 text-lg">Build consistency, one day at a time.</p>
        </div>
        <div className="flex items-center gap-3">
          <VoiceInput schema={VOICE_SCHEMAS.habit} onResult={handleVoiceResult} label="Creating habit…" />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg font-medium hover:bg-purple/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Today</p>
          <p className="text-3xl font-bold font-mono">{totalCompleted}<span className="text-foreground/30 text-lg">/{habits.length}</span></p>
          <p className="text-xs text-foreground/50 mt-1">habits completed</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Best streak</p>
          <p className="text-3xl font-bold font-mono flex items-center gap-1">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {Math.max(0, ...habits.map((h) => h.longestStreak || 0))}d
          </p>
          <p className="text-xs text-foreground/50 mt-1">longest streak</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Active streaks</p>
          <p className="text-3xl font-bold font-mono flex items-center gap-1">
            <Flame className="w-6 h-6 text-orange-500" />
            {habits.filter((h) => (h.currentStreak || 0) > 0).length}
          </p>
          <p className="text-xs text-foreground/50 mt-1">habits on a streak</p>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAddHabit} className="mb-6 bg-white p-6 rounded-xl border-2 border-purple">
          <h3 className="font-bold mb-4">New Habit</h3>
          <div className="flex gap-4 items-center">
            <VoiceInput schema={VOICE_SCHEMAS.habit} onResult={handleVoiceResult} size="sm" />
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="What habit do you want to build?"
              className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
              autoFocus
            />
            <button type="submit" className="px-6 py-2 bg-purple text-white rounded-lg font-bold">
              Save
            </button>
          </div>
        </form>
      )}

      {/* Habit grid */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-bold text-xl">Past 14 Days</h2>
          <div className="flex gap-1 text-[10px] text-foreground/30 font-mono">
            {displayDays.map((d) => (
              <div key={d} className="w-[calc((100%-14*6px)/14+6px)] text-center hidden lg:block">
                {new Date(d).getDate()}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-foreground/50 font-bold">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="p-8 text-center text-foreground/50 font-bold">
            No habits yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-5">
            {habits.map((habit) => {
              const history: string[] = habit.history || [];
              const completedCount = displayDays.filter((d) => history.includes(d)).length;
              const streak = habit.currentStreak || 0;

              return (
                <div key={habit.id} className="flex flex-col md:flex-row md:items-center gap-4 group">
                  <div className="w-52 flex justify-between items-start shrink-0">
                    <div>
                      <span className="font-bold text-sm">{habit.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-foreground/50 font-mono text-xs font-bold">{completedCount}/14</span>
                        {streak > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-500 text-xs font-bold">
                            <Flame className="w-3 h-3" />{streak}d streak
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-foreground/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 flex gap-1.5">
                    {displayDays.map((dateStr) => {
                      const done = history.includes(dateStr);
                      const isToday = dateStr === new Date().toISOString().split("T")[0];
                      return (
                        <div
                          key={dateStr}
                          onClick={() => toggleHabitHistory(habit, dateStr)}
                          title={dateStr}
                          className={`h-10 flex-1 rounded-md cursor-pointer transition-all ${
                            done
                              ? "bg-purple shadow-sm"
                              : isToday
                              ? "bg-purple/10 border-2 border-purple/40 hover:bg-purple/20"
                              : "bg-foreground/5 border-2 border-foreground/10 hover:border-purple/50 hover:bg-purple/5"
                          }`}
                        />
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
