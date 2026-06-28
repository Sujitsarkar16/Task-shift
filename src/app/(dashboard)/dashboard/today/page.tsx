"use client";

import { CheckCircle2, Flame, CreditCard, AlertTriangle, Sun } from "lucide-react";
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
  const hour = new Date().getHours();
  const g = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${g}, ${name.split(" ")[0]}.` : `${g}.`;
}

export default function TodayPage() {
  const { tasks, isLoading: loadingTasks, mutate: mutateTasks } = useTasks();
  const { habits, isLoading: loadingHabits, mutate: mutateHabits } = useHabits();
  const { subscriptions, isLoading: loadingSubs } = useSubscriptions();
  const { profile, isLoading: loadingUser } = useUserProfile();
  const { error: toastError } = useToast();

  const isLoading = loadingTasks || loadingHabits || loadingSubs || loadingUser;
  const todayStr = new Date().toISOString().split("T")[0];

  const toggleTask = async (id: string, current: boolean) => {
    mutateTasks(tasks.map((t) => (t.id === id ? { ...t, isCompleted: !current } : t)), false);
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      });
    } catch { toastError("Failed to update task"); mutateTasks(); }
  };

  const toggleHabit = async (habit: ReturnType<typeof useHabits>["habits"][0]) => {
    const historySet = new Set<string>(habit.history);
    if (historySet.has(todayStr)) historySet.delete(todayStr);
    else historySet.add(todayStr);
    const newHistory = Array.from(historySet);
    const { currentStreak, longestStreak } = computeStreaks(newHistory);
    mutateHabits(habits.map((h) => h.id === habit.id ? { ...h, history: newHistory, currentStreak, longestStreak } : h), false);
    try {
      await fetch(`/api/habits/${habit.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: newHistory }),
      });
    } catch { toastError("Failed to update habit"); mutateHabits(); }
  };

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const todayTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const deadline = new Date(t.deadline);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    return deadline <= todayEnd;
  });
  const overdueCount = todayTasks.filter((t) => new Date(t.deadline) < new Date(now.setHours(0,0,0,0))).length;
  const habitsNotDone = habits.filter((h) => !h.history.includes(todayStr));
  const habitsDone = habits.filter((h) => h.history.includes(todayStr));
  const renewingSoon = subscriptions.filter((s) => {
    const days = Math.ceil((new Date(s.renewalDate).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 7 && s.status === "active";
  });

  const PRIORITY_DOT: Record<string, string> = {
    urgent: "bg-red-500", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-green-400",
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-foreground/5 animate-pulse" />
          <div className="h-10 w-64 rounded bg-foreground/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full space-y-8">
      <div>
        <p className="text-foreground/40 font-mono text-sm mb-2 flex items-center gap-2">
          <Sun className="w-4 h-4" /> {dateLabel}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{getGreeting(profile?.displayName || profile?.name)}</h1>
        <p className="text-foreground/50 text-sm md:text-base">
          {todayTasks.length === 0 && habitsNotDone.length === 0
            ? "You're all caught up for today. 🎉"
            : `${todayTasks.length} task${todayTasks.length !== 1 ? "s" : ""} and ${habitsNotDone.length} habit${habitsNotDone.length !== 1 ? "s" : ""} remaining.`}
        </p>
      </div>

      {overdueCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-red-700 font-medium text-sm">{overdueCount} overdue task{overdueCount !== 1 ? "s" : ""} — tackle them first!</p>
        </div>
      )}

      {/* Tasks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple" /> Tasks for Today
            <span className="text-sm font-normal text-foreground/40">({todayTasks.length})</span>
          </h2>
          <Link href="/dashboard/tasks" className="text-sm text-purple hover:underline">View all</Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-foreground/10 p-6 text-center text-foreground/40 text-sm">
            No tasks due today. <Link href="/dashboard/tasks" className="text-purple hover:underline">Add one</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t) => {
              const isOverdue = new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
              return (
                <div key={t.id} className="flex items-center gap-4 bg-white rounded-xl border-2 border-foreground/10 px-4 md:px-5 py-3 md:py-4 hover:border-purple/30 transition-colors group">
                  <button onClick={() => toggleTask(t.id, t.isCompleted)}
                    className="w-5 h-5 rounded border-2 border-foreground/30 hover:border-purple flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple opacity-0 group-hover:opacity-50" />
                  </button>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_DOT[t.priority] || "#ccc" }} />
                  <span className={`flex-1 font-medium text-sm ${isOverdue ? "text-red-600" : ""}`}>{t.title}</span>
                  {isOverdue && <span className="text-xs text-red-500 font-semibold shrink-0">Overdue</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Habits */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Today's Habits
            <span className="text-sm font-normal text-foreground/40">({habitsDone.length}/{habits.length})</span>
          </h2>
          <Link href="/dashboard/habits" className="text-sm text-purple hover:underline">View all</Link>
        </div>
        {habits.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-foreground/10 p-6 text-center text-foreground/40 text-sm">
            No habits tracked. <Link href="/dashboard/habits" className="text-purple hover:underline">Add habits</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {habits.map((h) => {
              const done = h.history.includes(todayStr);
              return (
                <button key={h.id} onClick={() => toggleHabit(h)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    done ? "bg-purple/5 border-purple/40 text-purple" : "bg-white border-foreground/10 hover:border-purple/30"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-purple" : "bg-foreground/5"}`}>
                    <CheckCircle2 className={`w-4 h-4 ${done ? "text-white" : "text-foreground/30"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{h.title}</p>
                    {h.currentStreak > 0 && (
                      <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                        <Flame className="w-3 h-3" /> {h.currentStreak}d streak
                      </p>
                    )}
                  </div>
                  {done && <span className="ml-auto text-xs font-bold text-purple">Done ✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Renewals */}
      {renewingSoon.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-foreground/40" /> Upcoming Renewals
            </h2>
            <Link href="/dashboard/subscriptions" className="text-sm text-purple hover:underline">Manage</Link>
          </div>
          <div className="space-y-2">
            {renewingSoon.map((s) => {
              const days = Math.ceil((new Date(s.renewalDate).getTime() - Date.now()) / 86_400_000);
              return (
                <div key={s.id} className="flex items-center justify-between bg-amber-50 border-2 border-amber-200 rounded-xl px-4 md:px-5 py-3 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center font-bold text-amber-700">{s.name.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-amber-600">{days === 0 ? "Renews today" : `In ${days} day${days !== 1 ? "s" : ""}`}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sm">{formatINR(s.amount, 0)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
