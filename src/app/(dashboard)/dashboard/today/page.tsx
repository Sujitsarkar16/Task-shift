"use client";

import { CheckCircle2, Flame, CreditCard, AlertTriangle, SunMedium, CheckSquare2 } from "lucide-react";
import Link from "next/link";
import { formatINR } from "@/lib/currency";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/components/ui/Toast";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { computeStreaks } from "@/lib/habits";

function getGreeting(name?: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${g}, ${name.split(" ")[0]} 👋` : `${g} 👋`;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-green-400",
};

export default function TodayPage() {
  const { tasks, isLoading: lT, mutate: mutateTasks } = useTasks();
  const { habits, isLoading: lH, mutate: mutateHabits } = useHabits();
  const { subscriptions, isLoading: lS } = useSubscriptions();
  const { profile, isLoading: lU } = useUserProfile();
  const { error: toastError } = useToast();

  const isLoading = lT || lH || lS || lU;
  const todayStr = new Date().toISOString().split("T")[0];

  const toggleTask = async (id: string, current: boolean) => {
    mutateTasks(tasks.map((t) => t.id === id ? { ...t, isCompleted: !current } : t), false);
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      });
    } catch { toastError("Failed to update task"); mutateTasks(); }
  };

  const toggleHabit = async (habit: typeof habits[0]) => {
    const set = new Set<string>(habit.history);
    if (set.has(todayStr)) set.delete(todayStr); else set.add(todayStr);
    const newHistory = Array.from(set);
    const { currentStreak, longestStreak } = computeStreaks(newHistory);
    mutateHabits(habits.map((h) => h.id === habit.id ? { ...h, history: newHistory, currentStreak, longestStreak } : h), false);
    try {
      await fetch(`/api/habits/${habit.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }),
      });
    } catch { toastError("Failed to update habit"); mutateHabits(); }
  };

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const todayTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const d = new Date(t.deadline); d.setHours(23, 59, 59, 999);
    return d >= new Date();
  });
  const overdueTasks = todayTasks.filter((t) => new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0)));
  const habitsDone = habits.filter((h) => h.history.includes(todayStr));
  const habitsLeft = habits.filter((h) => !h.history.includes(todayStr));
  const renewingSoon = subscriptions.filter((s) => {
    const d = Math.ceil((new Date(s.renewalDate).getTime() - Date.now()) / 86_400_000);
    return d >= 0 && d <= 7 && s.status === "active";
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">
        <div className="h-28 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">{[1,2].map(i=><SkeletonCard key={i}/>)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-6 text-white shadow-lg shadow-orange-200">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2 text-white/80 text-sm font-medium">
            <SunMedium className="w-4 h-4" /> {dateLabel}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{getGreeting(profile?.displayName || profile?.name)}</h1>
          <p className="text-white/80 mt-1 text-sm">
            {todayTasks.length === 0 && habitsLeft.length === 0
              ? "You're all caught up! 🎉"
              : `${todayTasks.length} task${todayTasks.length !== 1 ? "s" : ""} · ${habitsLeft.length} habit${habitsLeft.length !== 1 ? "s" : ""} remaining`}
          </p>
        </div>
      </div>

      {/* ── Overdue alert ── */}
      {overdueTasks.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-red-700 text-sm">Overdue tasks need attention!</p>
            <p className="text-red-600 text-xs mt-0.5">{overdueTasks.map(t => t.title).join(", ")}</p>
          </div>
        </div>
      )}

      {/* ── Tasks ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckSquare2 className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-bold text-base">Tasks for Today</h2>
            <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{todayTasks.length}</span>
          </div>
          <Link href="/dashboard/tasks" className="text-xs text-blue-500 font-semibold hover:underline">View all</Link>
        </div>

        {todayTasks.length === 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center text-sm text-blue-400 font-medium">
            No tasks due today 🎯 <Link href="/dashboard/tasks" className="text-blue-600 hover:underline font-semibold">Add one</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t) => {
              const isOvr = new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
              return (
                <div key={t.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all group cursor-pointer ${
                    isOvr ? "bg-red-50 border-red-200" : "bg-white border-foreground/8 hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                  onClick={() => toggleTask(t.id, t.isCompleted)}>
                  <div className="w-5 h-5 rounded-md border-2 border-foreground/20 group-hover:border-blue-400 flex items-center justify-center shrink-0 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-40" />
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] || "bg-gray-300"}`} />
                  <span className={`flex-1 text-sm font-medium ${isOvr ? "text-red-600" : ""}`}>{t.title}</span>
                  {isOvr && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Habits ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="font-bold text-base">Today&apos;s Habits</h2>
            <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              {habitsDone.length}/{habits.length}
            </span>
          </div>
          <Link href="/dashboard/habits" className="text-xs text-orange-500 font-semibold hover:underline">View all</Link>
        </div>

        {habits.length === 0 ? (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center text-sm text-orange-400 font-medium">
            <Link href="/dashboard/habits" className="text-orange-600 font-semibold hover:underline">Add your first habit</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {habits.map((h) => {
              const done = h.history.includes(todayStr);
              return (
                <button key={h.id} onClick={() => toggleHabit(h)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all font-medium ${
                    done
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm"
                      : "bg-white border-foreground/8 hover:border-orange-200 hover:bg-orange-50/40"
                  }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    done ? "bg-orange-500 shadow-md shadow-orange-200" : "bg-orange-100"
                  }`}>
                    {done
                      ? <span className="text-white text-sm">✓</span>
                      : <Flame className="w-4 h-4 text-orange-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${done ? "text-orange-700" : ""}`}>{h.title}</p>
                    {h.currentStreak > 0 && (
                      <p className="text-[11px] text-orange-500 font-bold flex items-center gap-0.5 mt-0.5">
                        <Flame className="w-3 h-3" />{h.currentStreak}d streak
                      </p>
                    )}
                  </div>
                  {done && <span className="ml-auto text-xs font-bold text-orange-500 shrink-0">Done ✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Renewals ── */}
      {renewingSoon.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-bold text-base">Upcoming Renewals</h2>
            </div>
            <Link href="/dashboard/subscriptions" className="text-xs text-emerald-600 font-semibold hover:underline">Manage</Link>
          </div>
          <div className="space-y-2">
            {renewingSoon.map((s) => {
              const days = Math.ceil((new Date(s.renewalDate).getTime() - Date.now()) / 86_400_000);
              return (
                <div key={s.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center font-bold text-amber-700 text-sm">{s.name.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-amber-600 font-medium">{days === 0 ? "Renews today" : `In ${days} day${days !== 1 ? "s" : ""}`}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-700">{formatINR(s.amount, 0)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
