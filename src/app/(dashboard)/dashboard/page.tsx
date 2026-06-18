"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Settings, Plus, CreditCard, NotebookPen, Calendar, Activity } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState({
    tasks: [] as any[],
    habits: [] as any[],
    notes: [] as any[],
    subs: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [tasksRes, habitsRes, notesRes, subsRes] = await Promise.all([
          fetch("/api/todos"),
          fetch("/api/habits"),
          fetch("/api/notes"),
          fetch("/api/subscriptions")
        ]);
        
        setData({
          tasks: tasksRes.ok ? await tasksRes.json() : [],
          habits: habitsRes.ok ? await habitsRes.json() : [],
          notes: notesRes.ok ? await notesRes.json() : [],
          subs: subsRes.ok ? await subsRes.json() : []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-light-red/20 text-light-red";
      case "medium": return "bg-yellow-400/20 text-yellow-600";
      case "low": return "bg-green-400/20 text-green-700";
      default: return "bg-foreground/10 text-foreground";
    }
  };

  const totalSubCost = data.subs.reduce((acc, sub) => {
    if (sub.billingCycle === "monthly") return acc + sub.amount;
    if (sub.billingCycle === "yearly") return acc + (sub.amount / 12);
    if (sub.billingCycle === "weekly") return acc + (sub.amount * 4);
    return acc;
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full">
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants} className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Good morning, Team.</h1>
          <p className="text-foreground/60 text-lg">Here is your daily overview.</p>
        </motion.div>
        
        {loading ? (
          <div className="p-12 text-center text-foreground/50 font-bold text-xl">Loading dashboard...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Weekly Tasks - top wide */}
            <motion.div variants={itemVariants} className="md:col-span-8 bg-white rounded-xl border-2 border-foreground p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-2xl flex items-center gap-2"><Calendar className="w-6 h-6 text-purple" /> Active Tasks</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.tasks.filter((t: any) => !t.isCompleted).slice(0, 6).map((t: any) => (
                  <div key={t.id} className="bg-[#faf9f8] rounded-lg p-4 border-2 border-transparent flex justify-between items-center">
                    <span className="font-medium truncate mr-4">{t.title}</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                  </div>
                ))}
                {data.tasks.filter((t: any) => !t.isCompleted).length === 0 && (
                  <div className="col-span-2 text-foreground/50 text-sm font-bold">No active tasks. Enjoy your day!</div>
                )}
              </div>
            </motion.div>

            {/* Habit Tracker - right column top */}
            <motion.div variants={itemVariants} className="md:col-span-4 bg-purple-soft/30 rounded-xl border-2 border-purple p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-2xl flex items-center gap-2"><Activity className="w-6 h-6 text-purple" /> Habits</h2>
                <Link href="/dashboard/habits" className="text-purple hover:bg-purple/10 p-1 rounded-md transition-colors"><Plus className="w-5 h-5"/></Link>
              </div>
              <div className="space-y-6">
                {data.habits.slice(0, 4).map((habit: any) => {
                  const doneToday = (habit.history || []).includes(todayStr);
                  return (
                    <div key={habit.id} className="flex items-center justify-between">
                      <span className="font-bold text-sm truncate mr-4">{habit.title}</span>
                      <div className={`w-8 h-8 rounded-md flex-shrink-0 ${doneToday ? 'bg-purple' : 'bg-white border-2 border-purple/20'}`}></div>
                    </div>
                  );
                })}
                {data.habits.length === 0 && (
                  <div className="text-foreground/50 text-sm font-bold">No habits tracked yet.</div>
                )}
              </div>
            </motion.div>

            {/* Task Manager - left column bottom */}
            <motion.div variants={itemVariants} className="md:col-span-5 bg-white rounded-xl border-2 border-foreground/10 p-8 hover:border-foreground/30 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-foreground/40" /> Tasks</h2>
                <Link href="/dashboard/tasks" className="text-sm font-bold text-background bg-foreground px-4 py-2 rounded-lg hover:bg-purple hover:text-white transition-colors">View All</Link>
              </div>
              <div className="space-y-3">
                {data.tasks.slice(0, 4).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-[#faf9f8] cursor-pointer transition-colors border-2 border-transparent hover:border-foreground/5 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${t.isCompleted ? 'bg-purple border-purple' : 'border-foreground/30 group-hover:border-purple group-hover:bg-purple-soft/50'}`}>
                        <CheckCircle2 className={`w-4 h-4 text-white ${t.isCompleted ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
                      </div>
                      <p className={`font-medium truncate w-40 ${t.isCompleted ? 'line-through text-foreground/40' : ''}`}>{t.title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notes - middle column bottom */}
            <motion.div variants={itemVariants} className="md:col-span-4 bg-[#fff9db] rounded-xl border-2 border-[#ffe066] p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl flex items-center gap-2"><NotebookPen className="w-6 h-6 text-[#f59f00]" /> Notes</h2>
                <Link href="/dashboard/notes" className="text-[#f59f00] hover:bg-[#ffe066]/50 p-1 rounded-md transition-colors"><Settings className="w-5 h-5" /></Link>
              </div>
              <div className="bg-white/60 rounded-lg p-5 h-56 border-2 border-[#ffe066]/40 font-mono text-sm overflow-y-auto leading-relaxed">
                {data.notes.length > 0 ? (
                  <>
                    <p className="mb-4 font-bold text-[#f59f00] uppercase tracking-widest text-xs">{data.notes[0].title || "Scratchpad"}</p>
                    <p className="whitespace-pre-wrap">{data.notes[0].content}</p>
                  </>
                ) : (
                  <p className="text-[#b37400]/50 font-bold">No notes available.</p>
                )}
              </div>
            </motion.div>

            {/* Subscriptions - right column bottom */}
            <motion.div variants={itemVariants} className="md:col-span-3 bg-white rounded-xl border-2 border-foreground/10 p-8 hover:border-foreground/30 transition-colors">
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-2xl flex items-center gap-2"><CreditCard className="w-6 h-6 text-foreground/40" /> Subs</h2>
                <span className="text-sm font-bold text-light-red bg-light-red/10 px-3 py-1 rounded-lg">${totalSubCost.toFixed(2)}/mo</span>
              </div>
              <div className="space-y-4">
                {data.subs.slice(0, 4).map((sub: any) => (
                  <div key={sub.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#faf9f8] border-2 border-foreground/5 flex items-center justify-center text-lg">{sub.name.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-bold text-sm truncate w-24">{sub.name}</p>
                        <div className="font-mono font-bold text-sm">${sub.amount.toFixed(2)}</div>
                      </div>
                      <p className="text-xs text-foreground/50 font-mono">Renews {new Date(sub.renewalDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {data.subs.length === 0 && (
                  <div className="text-foreground/50 text-sm font-bold">No active subs.</div>
                )}
              </div>
              <Link href="/dashboard/subscriptions" className="block text-center w-full mt-6 py-3 border-2 border-foreground/10 rounded-lg text-sm font-bold hover:border-foreground/30 hover:bg-[#faf9f8] transition-all">Manage All</Link>
            </motion.div>

          </div>
        )}
      </motion.div>
    </div>
  );
}
