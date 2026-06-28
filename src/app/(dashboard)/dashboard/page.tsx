"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare2, BookOpen, CreditCard, Activity,
  SunMedium, TrendingUp, Flame, ArrowRight, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRole, isTeamRole, ROLE_HOME } from "@/contexts/RoleContext";
import { formatINR, formatINRCompact } from "@/lib/currency";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useNotes } from "@/hooks/useNotes";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SkeletonDashboard } from "@/components/ui/Skeleton";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function toMonthly(amount: number, cycle: string) {
  if (cycle === "weekly") return amount * 4.33;
  if (cycle === "monthly") return amount;
  if (cycle === "quarterly") return amount / 3;
  if (cycle === "yearly") return amount / 12;
  return amount;
}

export default function DashboardPage() {
  const router = useRouter();
  const { role, isLoaded } = useRole();
  useEffect(() => {
    if (isLoaded && isTeamRole(role)) router.replace(ROLE_HOME[role]);
  }, [role, isLoaded, router]);
  if (!isLoaded || isTeamRole(role)) return null;
  return <PersonalDashboard />;
}

function PersonalDashboard() {
  const { tasks, isLoading: lT }             = useTasks();
  const { habits, isLoading: lH }            = useHabits();
  const { notes, isLoading: lN }             = useNotes();
  const { subscriptions: subs, isLoading: lS } = useSubscriptions();
  const { profile, isLoading: lU }           = useUserProfile();

  if (lT || lH || lN || lS || lU) return <SkeletonDashboard />;

  const todayStr   = new Date().toISOString().split("T")[0];
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const habitsDone  = habits.filter((h) => h.history.includes(todayStr)).length;
  const overdue     = activeTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0))
  ).length;
  const doneRate    = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.isCompleted).length / tasks.length) * 100)
    : 0;
  const bestStreak  = Math.max(0, ...habits.map((h) => h.currentStreak));
  const totalSpend  = subs
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((a, s) => a + toMonthly(s.amount, s.billingCycle), 0);

  const firstName = (profile?.displayName || profile?.name || "").split(" ")[0];
  const greeting  = `${getGreeting()}${firstName ? `, ${firstName}` : ""} 👋`;
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high:   "bg-orange-100 text-orange-700",
    medium: "bg-amber-100 text-amber-700",
    low:    "bg-green-100 text-green-700",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full">

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-foreground/40 font-medium mb-1">{dateLabel}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{greeting}</h1>
          <p className="text-foreground/55 mt-1 text-sm md:text-base">
            {overdue > 0
              ? <span className="text-red-500 font-semibold">⚠️ {overdue} overdue task{overdue !== 1 ? "s" : ""} need attention</span>
              : "Everything looks great — here's your overview."}
          </p>
        </div>
        <Link href="/dashboard/today"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple to-violet-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-purple/25 hover:shadow-purple/40 hover:scale-105 transition-all shrink-0">
          <SunMedium className="w-4 h-4" /> Today&apos;s Plan <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {/* Tasks */}
        <div className="bg-white rounded-2xl p-4 md:p-5 card-glow-blue border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckSquare2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">{doneRate}% done</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-foreground">{activeTasks.length}</p>
          <p className="text-xs text-foreground/50 mt-0.5 font-medium">active tasks</p>
        </div>

        {/* Overdue */}
        <div className={`rounded-2xl p-4 md:p-5 border ${overdue > 0 ? "bg-red-50 border-red-200 card-glow-red" : "bg-white border-green-100 card-glow-green"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${overdue > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <AlertTriangle className={`w-4 h-4 ${overdue > 0 ? "text-red-500" : "text-green-600"}`} />
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${overdue > 0 ? "text-red-500 bg-red-100" : "text-green-600 bg-green-50"}`}>
              {overdue > 0 ? "urgent" : "on track"}
            </span>
          </div>
          <p className={`text-2xl md:text-3xl font-extrabold ${overdue > 0 ? "text-red-600" : "text-green-600"}`}>{overdue}</p>
          <p className="text-xs text-foreground/50 mt-0.5 font-medium">overdue</p>
        </div>

        {/* Habits */}
        <div className="bg-white rounded-2xl p-4 md:p-5 card-glow-orange border border-orange-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-xs font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">{bestStreak}d streak</span>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold">
            {habitsDone}<span className="text-foreground/30 text-lg">/{habits.length}</span>
          </p>
          <p className="text-xs text-foreground/50 mt-0.5 font-medium">habits today</p>
        </div>

        {/* Spend */}
        <div className="bg-white rounded-2xl p-4 md:p-5 card-glow-green border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">/mo</span>
          </div>
          <p className="text-xl md:text-2xl font-extrabold">{formatINRCompact(totalSpend)}</p>
          <p className="text-xs text-foreground/50 mt-0.5 font-medium">{subs.filter(s => s.status === "active").length} subscriptions</p>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5">

        {/* Tasks widget */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-foreground/8 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-foreground/6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckSquare2 className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-base text-foreground">Active Tasks</h2>
            </div>
            <Link href="/dashboard/tasks" className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-foreground/3 hover:bg-blue-50/60 rounded-xl px-3 py-2.5 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    t.priority === "urgent" ? "bg-red-500" :
                    t.priority === "high"   ? "bg-orange-400" :
                    t.priority === "medium" ? "bg-yellow-400" : "bg-green-400"
                  }`} />
                  <span className="font-medium text-sm truncate">{t.title}</span>
                </div>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${PRIORITY_COLORS[t.priority] || ""}`}>
                  {t.priority}
                </span>
              </div>
            ))}
            {activeTasks.length === 0 && (
              <div className="col-span-2 py-6 text-center text-foreground/40 text-sm">
                All done! <Link href="/dashboard/tasks" className="text-blue-500 hover:underline">Add a task</Link>
              </div>
            )}
          </div>
        </div>

        {/* Habits widget */}
        <div className="md:col-span-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-orange-100/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="font-bold text-base">Habits</h2>
            </div>
            <Link href="/dashboard/habits" className="text-xs font-semibold text-orange-500 hover:text-orange-700 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {habits.slice(0, 5).map((h) => {
              const done = h.history.includes(todayStr);
              return (
                <div key={h.id} className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      done ? "bg-orange-500 shadow-sm shadow-orange-300" : "bg-orange-100"
                    }`}>
                      {done && <span className="text-white text-[10px] font-bold">✓</span>}
                    </div>
                    <span className={`text-sm font-medium truncate ${done ? "line-through text-foreground/40" : ""}`}>{h.title}</span>
                  </div>
                  {h.currentStreak > 0 && (
                    <span className="text-[10px] font-bold text-orange-500 flex items-center gap-0.5 shrink-0 ml-2">
                      <Flame className="w-3 h-3" />{h.currentStreak}d
                    </span>
                  )}
                </div>
              );
            })}
            {habits.length === 0 && (
              <div className="py-4 text-center text-sm text-foreground/40">
                <Link href="/dashboard/habits" className="text-orange-500 hover:underline">Add your first habit</Link>
              </div>
            )}
          </div>
        </div>

        {/* Notes widget */}
        <div className="md:col-span-5 bg-gradient-to-br from-yellow-50 to-amber-50/50 rounded-2xl border border-yellow-200/60 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-yellow-200/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-yellow-600" />
              </div>
              <h2 className="font-bold text-base">Notes</h2>
            </div>
            <Link href="/dashboard/notes" className="text-xs font-semibold text-yellow-600 hover:text-yellow-800 flex items-center gap-1">
              Open <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            <div className="bg-white/70 rounded-xl p-4 h-36 overflow-y-auto border border-yellow-200/40">
              {notes.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-2">{notes[0].title || "Scratchpad"}</p>
                  <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-wrap">{notes[0].content || "Empty note."}</p>
                </>
              ) : (
                <p className="text-sm text-foreground/40 italic">
                  No notes yet. <Link href="/dashboard/notes" className="text-yellow-600 hover:underline not-italic">Create one</Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subs widget */}
        <div className="md:col-span-4 bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-emerald-100/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-bold text-base">Subscriptions</h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {formatINRCompact(totalSpend)}/mo
            </span>
          </div>
          <div className="p-4 space-y-2">
            {subs.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-white/60 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                  {s.name.charAt(0)}
                </div>
                <span className="flex-1 font-medium text-sm truncate">{s.name}</span>
                <span className="font-mono text-xs font-bold text-foreground/60">{formatINR(s.amount, 0)}</span>
              </div>
            ))}
            {subs.length === 0 && (
              <p className="py-3 text-center text-sm text-foreground/40">
                <Link href="/dashboard/subscriptions" className="text-emerald-600 hover:underline">Add subscriptions</Link>
              </p>
            )}
            <Link href="/dashboard/subscriptions" className="block text-center text-xs font-semibold text-emerald-600 hover:text-emerald-800 mt-1 py-1">
              Manage all →
            </Link>
          </div>
        </div>

        {/* Insights teaser */}
        <div className="md:col-span-3 bg-gradient-to-br from-purple to-violet-500 rounded-2xl overflow-hidden shadow-lg shadow-purple/20 relative">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative p-5 flex flex-col h-full min-h-[160px] justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-white text-base mb-1">Insights</h2>
              <p className="text-white/70 text-xs leading-relaxed">Task rates, habit trends & spending in one view.</p>
            </div>
            <Link href="/dashboard/insights"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors">
              View Insights <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
