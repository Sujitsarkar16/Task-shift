"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Flame, CreditCard, TrendingUp, BarChart2, Award, Target } from "lucide-react";
import Link from "next/link";
import { formatINR, formatINRCompact } from "@/lib/currency";

function toMonthly(amount: number, cycle: string) {
  if (cycle === "weekly") return amount * 4.33;
  if (cycle === "monthly") return amount;
  if (cycle === "quarterly") return amount / 3;
  if (cycle === "yearly") return amount / 12;
  return amount;
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function getLast4Weeks() {
  return Array.from({ length: 4 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return {
      label: `Week ${4 - i}`,
      days: Array.from({ length: 7 }, (_, j) => {
        const d = new Date(start);
        d.setDate(start.getDate() + j);
        return d.toISOString().split("T")[0];
      }),
    };
  }).reverse();
}

export default function InsightsPage() {
  const [data, setData] = useState({ tasks: [] as any[], habits: [] as any[], subs: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [tasksRes, habitsRes, subsRes] = await Promise.all([
        fetch("/api/todos"),
        fetch("/api/habits"),
        fetch("/api/subscriptions"),
      ]);
      const [tasks, habits, subs] = await Promise.all([
        tasksRes.ok ? tasksRes.json() : [],
        habitsRes.ok ? habitsRes.json() : [],
        subsRes.ok ? subsRes.json() : [],
      ]);
      setData({ tasks, habits, subs });
      setLoading(false);
    };
    load();
  }, []);

  const last7 = getLast7Days();
  const last4Weeks = getLast4Weeks();

  // Task metrics
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter((t) => t.isCompleted).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdue = data.tasks.filter((t) => !t.isCompleted && new Date(t.deadline) < new Date()).length;

  // Priority breakdown
  const priorityBreakdown = ["urgent", "high", "medium", "low"].map((p) => ({
    label: p,
    count: data.tasks.filter((t) => t.priority === p && !t.isCompleted).length,
  }));

  // Habit metrics
  const habitCompletionThisWeek = data.habits.map((h) => {
    const done = last7.filter((d) => (h.history || []).includes(d)).length;
    return { title: h.title, done, rate: Math.round((done / 7) * 100), streak: h.currentStreak || 0 };
  });
  const avgHabitRate = habitCompletionThisWeek.length > 0
    ? Math.round(habitCompletionThisWeek.reduce((a, h) => a + h.rate, 0) / habitCompletionThisWeek.length)
    : 0;

  // Weekly habit activity (total completions per day last 7 days)
  const dailyHabitActivity = last7.map((day) => ({
    day: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
    count: data.habits.filter((h) => (h.history || []).includes(day)).length,
  }));
  const maxDaily = Math.max(1, ...dailyHabitActivity.map((d) => d.count));

  // Subscription metrics
  const activeSubs = data.subs.filter((s) => s.status === "active" || s.status === "trial");
  const totalMonthly = activeSubs.reduce((a, s) => a + toMonthly(s.amount, s.billingCycle), 0);
  const byCategory = ["streaming", "software", "utilities", "gaming", "other"].map((cat) => {
    const catSubs = activeSubs.filter((s) => (s.category || "other") === cat);
    return {
      cat,
      count: catSubs.length,
      monthly: catSubs.reduce((a, s) => a + toMonthly(s.amount, s.billingCycle), 0),
    };
  }).filter((c) => c.count > 0);

  const CAT_COLORS: Record<string, string> = {
    streaming: "bg-pink-400",
    software: "bg-blue-400",
    utilities: "bg-yellow-400",
    gaming: "bg-purple",
    other: "bg-gray-300",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-foreground/40 font-semibold">Loading insights…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Insights</h1>
        <p className="text-foreground/60 text-lg">Your life at a glance — across tasks, habits, and spending.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple" />
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Task rate</p>
          </div>
          <p className="text-3xl font-bold font-mono">{completionRate}%</p>
          <p className="text-xs text-foreground/40 mt-1">{completedTasks}/{totalTasks} completed</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Habit rate</p>
          </div>
          <p className="text-3xl font-bold font-mono">{avgHabitRate}%</p>
          <p className="text-xs text-foreground/40 mt-1">avg this week</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Monthly spend</p>
          </div>
          <p className="text-3xl font-bold font-mono">{formatINRCompact(totalMonthly)}</p>
          <p className="text-xs text-foreground/40 mt-1">{activeSubs.length} active subs</p>
        </div>
        <div className={`rounded-xl border-2 p-5 ${overdue > 0 ? "bg-red-50 border-red-200" : "bg-white border-foreground/10"}`}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className={`w-4 h-4 ${overdue > 0 ? "text-red-500" : "text-green-500"}`} />
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Overdue</p>
          </div>
          <p className={`text-3xl font-bold font-mono ${overdue > 0 ? "text-red-600" : "text-green-600"}`}>{overdue}</p>
          <p className="text-xs text-foreground/40 mt-1">tasks past deadline</p>
        </div>
      </div>

      {/* Habit activity bar chart */}
      <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
        <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple" /> Daily Habit Activity (Last 7 Days)
        </h2>
        <div className="flex items-end gap-3 h-32">
          {dailyHabitActivity.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-foreground/40">{d.count > 0 ? d.count : ""}</span>
              <div
                className="w-full bg-purple rounded-t-md transition-all"
                style={{ height: `${Math.max(4, (d.count / maxDaily) * 88)}px` }}
              />
              <span className="text-xs text-foreground/50 font-semibold">{d.day}</span>
            </div>
          ))}
        </div>
        {data.habits.length === 0 && (
          <p className="text-center text-foreground/40 text-sm mt-4">
            No habits tracked yet. <Link href="/dashboard/habits" className="text-purple hover:underline">Add habits</Link>
          </p>
        )}
      </div>

      {/* Habit breakdown */}
      {habitCompletionThisWeek.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-400" /> Habit Performance This Week
          </h2>
          <div className="space-y-4">
            {habitCompletionThisWeek.sort((a, b) => b.rate - a.rate).map((h) => (
              <div key={h.title}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{h.title}</span>
                    {h.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-500 text-xs font-bold">
                        <Flame className="w-3 h-3" />{h.streak}d
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-sm font-mono">{h.done}/7</span>
                </div>
                <div className="w-full bg-foreground/5 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${h.rate >= 80 ? "bg-green-400" : h.rate >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
                    style={{ width: `${h.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks by priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple" /> Active Tasks by Priority
          </h2>
          {priorityBreakdown.every((p) => p.count === 0) ? (
            <p className="text-foreground/40 text-sm">No active tasks.</p>
          ) : (
            <div className="space-y-3">
              {priorityBreakdown.filter((p) => p.count > 0).map((p) => {
                const max = Math.max(...priorityBreakdown.map((x) => x.count), 1);
                const COLORS: Record<string, string> = { urgent: "bg-red-400", high: "bg-orange-400", medium: "bg-yellow-400", low: "bg-green-400" };
                return (
                  <div key={p.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold capitalize">{p.label}</span>
                      <span className="text-sm font-bold font-mono">{p.count}</span>
                    </div>
                    <div className="w-full bg-foreground/5 rounded-full h-2">
                      <div className={`${COLORS[p.label]} h-2 rounded-full`} style={{ width: `${(p.count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription spend by category */}
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" /> Spend by Category
          </h2>
          {byCategory.length === 0 ? (
            <p className="text-foreground/40 text-sm">No active subscriptions.</p>
          ) : (
            <div className="space-y-3">
              {byCategory.sort((a, b) => b.monthly - a.monthly).map((c) => (
                <div key={c.cat}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold capitalize">{c.cat}</span>
                    <span className="text-sm font-bold font-mono">{formatINR(c.monthly, 0)}/mo</span>
                  </div>
                  <div className="w-full bg-foreground/5 rounded-full h-2">
                    <div
                      className={`${CAT_COLORS[c.cat] || "bg-gray-300"} h-2 rounded-full`}
                      style={{ width: `${(c.monthly / totalMonthly) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actionable footer */}
      <div className="bg-gradient-to-r from-purple/5 to-purple/10 rounded-xl border-2 border-purple/20 p-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple" /> Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {overdue > 0 && (
            <Link href="/dashboard/tasks" className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors">
              Clear {overdue} overdue task{overdue !== 1 ? "s" : ""}
            </Link>
          )}
          {avgHabitRate < 50 && data.habits.length > 0 && (
            <Link href="/dashboard/today" className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors">
              Check in today's habits
            </Link>
          )}
          {totalMonthly > 8000 && (
            <Link href="/dashboard/subscriptions" className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-200 transition-colors">
              Review subscriptions ({formatINRCompact(totalMonthly)}/mo)
            </Link>
          )}
          <Link href="/dashboard/calendar" className="px-4 py-2 bg-purple/10 text-purple rounded-lg text-sm font-semibold hover:bg-purple/20 transition-colors">
            Open calendar view
          </Link>
        </div>
      </div>
    </div>
  );
}
