"use client";

import { useState, useEffect } from "react";
import { Activity, Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

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

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newHabitTitle,
          history: [],
          currentStreak: 0,
          longestStreak: 0
        })
      });
      if (res.ok) {
        setNewHabitTitle("");
        setShowAddForm(false);
        fetchHabits();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHabit = async (id: string) => {
    if (!confirm("Delete this habit?")) return;
    try {
      await fetch(`/api/habits/${id}`, { method: "DELETE" });
      fetchHabits();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleHabitHistory = async (habit: any, dateStr: string) => {
    try {
      const historySet = new Set(habit.history || []);
      if (historySet.has(dateStr)) {
        historySet.delete(dateStr);
      } else {
        historySet.add(dateStr);
      }
      const newHistory = Array.from(historySet);
      
      // Optmistic update
      setHabits(habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h));

      await fetch(`/api/habits/${habit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory })
      });
    } catch (err) {
      console.error(err);
      fetchHabits(); // Revert on error
    }
  };

  // Generate last 14 days
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants} className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Habits</h1>
            <p className="text-foreground/60 text-lg">Build consistency and track streaks.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg font-medium hover:bg-purple/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Habit
          </button>
        </motion.div>
        
        {showAddForm && (
          <motion.form variants={itemVariants} onSubmit={handleAddHabit} className="mb-6 bg-white p-6 rounded-xl border-2 border-purple">
            <h3 className="font-bold mb-4">New Habit</h3>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                placeholder="What habit do you want to build?" 
                className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                autoFocus
              />
              <button type="submit" className="px-6 py-2 bg-purple text-white rounded-lg font-bold">Save</button>
            </div>
          </motion.form>
        )}

        <motion.div variants={itemVariants} className="bg-white rounded-xl border-2 border-foreground/10 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-bold text-xl">Past 14 Days</h2>
            <div className="flex gap-2 text-foreground/50 text-sm font-bold">
              {last14Days[0]} to {last14Days[13]}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-foreground/50 font-bold">Loading habits...</div>
          ) : habits.length === 0 ? (
            <div className="p-8 text-center text-foreground/50 font-bold">No habits yet. Create one!</div>
          ) : (
            <div className="space-y-8">
              {habits.map((habit) => {
                const history = habit.history || [];
                const completedCount = last14Days.filter(d => history.includes(d)).length;
                
                return (
                  <div key={habit.id} className="flex flex-col md:flex-row md:items-center gap-4 group">
                    <div className="w-48 flex justify-between items-start">
                      <div>
                        <span className="font-bold">{habit.title}</span>
                        <div className="text-foreground/50 font-mono text-xs font-bold mt-1">{completedCount} / 14 days</div>
                      </div>
                      <button onClick={() => deleteHabit(habit.id)} className="text-foreground/30 hover:text-light-red opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                    <div className="flex-1 flex gap-1.5">
                      {last14Days.map((dateStr, j) => {
                        const done = history.includes(dateStr);
                        return (
                          <div 
                            key={j} 
                            onClick={() => toggleHabitHistory(habit, dateStr)}
                            title={dateStr}
                            className={`h-10 flex-1 rounded-md cursor-pointer transition-colors ${done ? 'bg-purple' : 'bg-foreground/5 border-2 border-foreground/10 hover:border-purple/50'}`}
                          ></div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
