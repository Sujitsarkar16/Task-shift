"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Settings, Plus, CreditCard, NotebookPen,
  Calendar, Activity, Sun, TrendingUp, Flame, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRole, isTeamRole, ROLE_HOME } from "@/contexts/RoleContext";
import { formatINR, formatINRCompact } from "@/lib/currency";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const { role, isLoaded } = useRole();

  useEffect(() => {
    if (isLoaded && isTeamRole(role)) {
      router.replace(ROLE_HOME[role]);
    }
  }, [role, isLoaded, router]);

  if (!isLoaded || isTeamRole(role)) return null;
  return <PersonalDashboard />;
}

function PersonalDashboard() {
  const [data, setData] = useState({ tasks: [] as any[], habits: [] as any[], notes: [] as any[], subs: [] as any[] });
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const [tasksRes, habitsRes, notesRes, subsRes, userRes] = await Promise.all([
        fetch("/api/todos"),
        fetch("/api/habits"),
        fetch("/api/notes"),
        fetch("/api/subscriptions"),
        fetch("/api/users/me"),
      ]);
      const [tasks, habits, notes, subs, user] = await Promise.all([
        tasksRes.ok ? tasksRes.json() : [],
        habitsRes.ok ? habitsRes.json() : [],
        notesRes.ok ? notesRes.json() : [],
        subsRes.ok ? subsRes.json() : [],
        userRes.ok ? userRes.json() : {},
      ]);
      setData({ tasks, habits, notes, subs });
      setUserName(user.displayName || user.name || "");
      setLoading(false);
    };
    load();
  }, []);

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  const totalSubCost = data.subs
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((acc, sub) => {
      if (sub.billingCycle === "monthly") return acc + sub.amount;
      if (sub.billingCycle === "yearly") return acc + sub.amount / 12;
      if (sub.billingCycle === "weekly") return acc + sub.amount * 4.33;
      if (sub.billingCycle === "quarterly") return acc + sub.amount / 3;
      return acc;
    }, 0);

  const activeTasks = data.tasks.filter((t) => !t.isCompleted);
  const habitsDoneToday = data.habits.filter((h) => (h.history || []).includes(todayStr)).length;
  const overdueCount = activeTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0))).length;
  const taskCompletionRate = data.tasks.length > 0 ? Math.round((data.tasks.filter((t) => t.isCompleted).length / data.tasks.length) * 100) : 0;
  const bestStreak = Math.max(0, ...data.habits.map((h) => h.currentStreak || 0));

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greeting = `${getGreeting()}${userName ? `, ${userName.split(" ")[0]}` : ""}.`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 w-full">
      {/* Header */}
      <div className="mb-10 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <p className="text-foreground/40 font-mono text-sm mb-2 flex items-center gap-2">
            <Sun className="w-4 h-4" /> {dateLabel}
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{greeting}</h1>
          <p className="text-foreground/60 text-lg">
            {overdueCount > 0
              ? `You have ${overdueCount} overdue task${overdueCount !== 1 ? "s" : ""} to clear.`
              : "Here's your daily overview."}
          </p>
        </div>
        <Link href="/dashboard/today" className="flex items-center gap-2 px-4 py-2.5 bg-purple text-white rounded-xl font-semibold hover:bg-purple/90 transition-colors">
          <Sun className="w-4 h-4" /> Today's Plan <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-foreground/50 font-bold text-xl">Loading dashboard...</div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border-2 border-foreground/10 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Active Tasks</p>
              <p className="text-3xl font-bold font-mono">{activeTasks.length}</p>
              <p className="text-xs text-foreground/40 mt-1">{taskCompletionRate}% completion rate</p>
            </div>
            <div className={`rounded-xl border-2 p-4 ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-foreground/10"}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Overdue</p>
              <p className={`text-3xl font-bold font-mono ${overdueCount > 0 ? "text-red-600" : ""}`}>{overdueCount}</p>
              <p className="text-xs text-foreground/40 mt-1">{overdueCount === 0 ? "All on track!" : "need attention"}</p>
            </div>
            <div className="bg-white rounded-xl border-2 border-foreground/10 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Habits Today</p>
              <p className="text-3xl font-bold font-mono flex items-center gap-1">
                {habitsDoneToday}<span className="text-foreground/30 text-lg">/{data.habits.length}</span>
              </p>
              <p className="text-xs text-foreground/40 mt-1">best streak: {bestStreak}d <Flame className="inline w-3 h-3 text-orange-400" /></p>
            </div>
            <div className="bg-white rounded-xl border-2 border-foreground/10 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Monthly Spend</p>
              <p className="text-3xl font-bold font-mono">{formatINRCompact(totalSubCost)}</p>
              <p className="text-xs text-foreground/40 mt-1">{data.subs.filter((s) => s.status === "active").length} active subscriptions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Active Tasks */}
            <div className="md:col-span-8 bg-white rounded-xl border-2 border-foreground p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple" /> Active Tasks
                </h2>
                <Link href="/dashboard/tasks" className="text-sm text-purple hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeTasks.slice(0, 6).map((t) => (
                  <div key={t.id} className="bg-[#faf9f8] rounded-lg p-3.5 border-2 border-transparent flex justify-between items-center gap-2">
                    <span className="font-medium text-sm truncate">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${PRIORITY_COLORS[t.priority] || "bg-foreground/5"}`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
                {activeTasks.length === 0 && (
                  <div className="col-span-2 text-foreground/40 text-sm font-semibold py-4">
                    No active tasks. <Link href="/dashboard/tasks" className="text-purple hover:underline">Add one</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Habits */}
            <div className="md:col-span-4 bg-purple/5 rounded-xl border-2 border-purple p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple" /> Habits
                </h2>
                <Link href="/dashboard/habits" className="text-purple hover:bg-purple/10 p-1 rounded-md transition-colors">
                  <Plus className="w-5 h-5" />
                </Link>
              </div>
              <div className="space-y-4">
                {data.habits.slice(0, 5).map((habit) => {
                  const doneToday = (habit.history || []).includes(todayStr);
                  return (
                    <div key={habit.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm">{habit.title}</span>
                        {(habit.currentStreak || 0) > 0 && (
                          <span className="ml-2 text-orange-500 text-xs font-bold flex items-center gap-0.5 inline-flex">
                            <Flame className="w-3 h-3" />{habit.currentStreak}d
                          </span>
                        )}
                      </div>
                      <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center ${doneToday ? "bg-purple" : "bg-white border-2 border-purple/20"}`}>
                        {doneToday && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  );
                })}
                {data.habits.length === 0 && (
                  <div className="text-foreground/40 text-sm font-semibold">
                    No habits yet. <Link href="/dashboard/habits" className="text-purple hover:underline">Add one</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-5 bg-[#fff9db] rounded-xl border-2 border-[#ffe066] p-8">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <NotebookPen className="w-5 h-5 text-[#f59f00]" /> Notes
                </h2>
                <Link href="/dashboard/notes" className="text-[#f59f00] hover:bg-[#ffe066]/50 p-1 rounded-md transition-colors">
                  <Settings className="w-5 h-5" />
                </Link>
              </div>
              <div className="bg-white/60 rounded-lg p-4 h-44 border-2 border-[#ffe066]/40 font-mono text-sm overflow-y-auto leading-relaxed">
                {data.notes.length > 0 ? (
                  <>
                    <p className="mb-3 font-bold text-[#f59f00] uppercase tracking-widest text-xs">{data.notes[0].title || "Scratchpad"}</p>
                    <p className="whitespace-pre-wrap text-foreground/70">{data.notes[0].content || "Empty note."}</p>
                  </>
                ) : (
                  <p className="text-[#b37400]/50 font-semibold">
                    No notes yet. <Link href="/dashboard/notes" className="text-[#f59f00] hover:underline">Create one</Link>
                  </p>
                )}
              </div>
            </div>

            {/* Subscriptions */}
            <div className="md:col-span-4 bg-white rounded-xl border-2 border-foreground/10 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-foreground/40" /> Subs
                </h2>
                <span className="text-sm font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">{formatINRCompact(totalSubCost)}/mo</span>
              </div>
              <div className="space-y-3">
                {data.subs.slice(0, 4).map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#faf9f8] border-2 border-foreground/5 flex items-center justify-center text-sm font-bold">
                      {sub.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{sub.name}</p>
                      <p className="text-xs text-foreground/40 font-mono">Renews {new Date(sub.renewalDate).toLocaleDateString()}</p>
                    </div>
                    <span className="font-mono font-bold text-sm">{formatINR(sub.amount, 0)}</span>
                  </div>
                ))}
                {data.subs.length === 0 && <div className="text-foreground/40 text-sm font-semibold">No active subs.</div>}
              </div>
              <Link href="/dashboard/subscriptions" className="block text-center w-full mt-5 py-2.5 border-2 border-foreground/10 rounded-lg text-sm font-semibold hover:border-foreground/30 hover:bg-[#faf9f8] transition-all">
                Manage All
              </Link>
            </div>

            {/* Insights teaser */}
            <div className="md:col-span-3 bg-gradient-to-br from-purple/5 to-purple/15 rounded-xl border-2 border-purple/20 p-8 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-xl flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-purple" /> Insights
                </h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  See your task completion rate, habit trends, and subscription spending all in one place.
                </p>
              </div>
              <Link href="/dashboard/insights" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-purple text-white rounded-xl font-semibold hover:bg-purple/90 transition-colors text-sm">
                View Insights <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
