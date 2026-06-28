"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Settings, Plus, CreditCard, NotebookPen, Activity, Sun, TrendingUp, Flame, ArrowRight } from "lucide-react";
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
  const { tasks, isLoading: lT } = useTasks();
  const { habits, isLoading: lH } = useHabits();
  const { notes, isLoading: lN } = useNotes();
  const { subscriptions: subs, isLoading: lS } = useSubscriptions();
  const { profile, isLoading: lU } = useUserProfile();

  const isLoading = lT || lH || lN || lS || lU;
  const todayStr = new Date().toISOString().split("T")[0];

  const totalSubCost = subs
    .filter((s) => s.status === "active" || s.status === "trial")
    .reduce((acc, s) => acc + toMonthly(s.amount, s.billingCycle), 0);

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const habitsDoneToday = habits.filter((h) => h.history.includes(todayStr)).length;
  const overdueCount = activeTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0))).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((tasks.filter((t) => t.isCompleted).length / tasks.length) * 100) : 0;
  const bestStreak = Math.max(0, ...habits.map((h) => h.currentStreak));

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700", low: "bg-green-100 text-green-700",
  };
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greeting = `${getGreeting()}${profile?.displayName || profile?.name ? `, ${(profile.displayName || profile.name)!.split(" ")[0]}` : ""}.`;

  if (isLoading) return <SkeletonDashboard />;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full">
      <div className="mb-8 md:mb-10 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <p className="text-foreground/40 font-mono text-xs md:text-sm mb-1 flex items-center gap-2"><Sun className="w-4 h-4" /> {dateLabel}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">{greeting}</h1>
          <p className="text-foreground/60 text-sm md:text-base">
            {overdueCount > 0 ? `You have ${overdueCount} overdue task${overdueCount !== 1 ? "s" : ""} to clear.` : "Here's your daily overview."}
          </p>
        </div>
        <Link href="/dashboard/today" className="flex items-center gap-2 px-4 py-2.5 bg-purple text-white rounded-xl font-semibold hover:bg-purple/90 transition-colors text-sm shrink-0">
          <Sun className="w-4 h-4" /> Today's Plan <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-3 md:p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Active Tasks</p>
          <p className="text-2xl md:text-3xl font-bold font-mono">{activeTasks.length}</p>
          <p className="text-xs text-foreground/40 mt-1">{taskCompletionRate}% done</p>
        </div>
        <div className={`rounded-xl border-2 p-3 md:p-4 ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-foreground/10"}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Overdue</p>
          <p className={`text-2xl md:text-3xl font-bold font-mono ${overdueCount > 0 ? "text-red-600" : ""}`}>{overdueCount}</p>
          <p className="text-xs text-foreground/40 mt-1">{overdueCount === 0 ? "All on track!" : "need attention"}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-3 md:p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Habits Today</p>
          <p className="text-2xl md:text-3xl font-bold font-mono">
            {habitsDoneToday}<span className="text-foreground/30 text-lg">/{habits.length}</span>
          </p>
          <p className="text-xs text-foreground/40 mt-1 flex items-center gap-1">
            best streak: {bestStreak}d <Flame className="w-3 h-3 text-orange-400" />
          </p>
        </div>
        <div className="bg-white rounded-xl border-2 border-foreground/10 p-3 md:p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-1">Monthly Spend</p>
          <p className="text-2xl md:text-3xl font-bold font-mono">{formatINRCompact(totalSubCost)}</p>
          <p className="text-xs text-foreground/40 mt-1">{subs.filter((s) => s.status === "active").length} active subs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Tasks */}
        <div className="md:col-span-8 bg-white rounded-xl border-2 border-foreground p-5 md:p-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg md:text-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-purple" /> Active Tasks</h2>
            <Link href="/dashboard/tasks" className="text-sm text-purple hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTasks.slice(0, 6).map((t) => (
              <div key={t.id} className="bg-[#faf9f8] rounded-lg p-3 border-2 border-transparent flex justify-between items-center gap-2">
                <span className="font-medium text-sm truncate">{t.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${PRIORITY_COLORS[t.priority] || "bg-foreground/5"}`}>{t.priority}</span>
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
        <div className="md:col-span-4 bg-purple/5 rounded-xl border-2 border-purple p-5 md:p-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg md:text-xl flex items-center gap-2"><Activity className="w-5 h-5 text-purple" /> Habits</h2>
            <Link href="/dashboard/habits" className="text-purple hover:bg-purple/10 p-1 rounded-md"><Plus className="w-5 h-5" /></Link>
          </div>
          <div className="space-y-4">
            {habits.slice(0, 5).map((h) => {
              const done = h.history.includes(todayStr);
              return (
                <div key={h.id} className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate mr-2">{h.title}</span>
                  <div className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center ${done ? "bg-purple" : "bg-white border-2 border-purple/20"}`}>
                    {done && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>
              );
            })}
            {habits.length === 0 && <p className="text-foreground/40 text-sm">No habits. <Link href="/dashboard/habits" className="text-purple hover:underline">Add one</Link></p>}
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-5 bg-[#fff9db] rounded-xl border-2 border-[#ffe066] p-5 md:p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg md:text-xl flex items-center gap-2"><NotebookPen className="w-5 h-5 text-[#f59f00]" /> Notes</h2>
            <Link href="/dashboard/notes" className="text-[#f59f00] hover:bg-[#ffe066]/50 p-1 rounded-md"><Settings className="w-5 h-5" /></Link>
          </div>
          <div className="bg-white/60 rounded-lg p-4 h-40 border-2 border-[#ffe066]/40 font-mono text-sm overflow-y-auto leading-relaxed">
            {notes.length > 0 ? (
              <><p className="mb-2 font-bold text-[#f59f00] uppercase tracking-widest text-xs">{notes[0].title || "Scratchpad"}</p>
              <p className="whitespace-pre-wrap text-foreground/70">{notes[0].content || "Empty note."}</p></>
            ) : (
              <p className="text-[#b37400]/50 font-semibold">No notes. <Link href="/dashboard/notes" className="text-[#f59f00] hover:underline">Create one</Link></p>
            )}
          </div>
        </div>

        {/* Subs */}
        <div className="md:col-span-4 bg-white rounded-xl border-2 border-foreground/10 p-5 md:p-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-lg md:text-xl flex items-center gap-2"><CreditCard className="w-5 h-5 text-foreground/40" /> Subs</h2>
            <span className="text-sm font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">{formatINRCompact(totalSubCost)}/mo</span>
          </div>
          <div className="space-y-3">
            {subs.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 border-2 border-foreground/5 flex items-center justify-center text-sm font-bold shrink-0">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-foreground/40 font-mono">Renews {new Date(s.renewalDate).toLocaleDateString()}</p>
                </div>
                <span className="font-mono font-bold text-sm">{formatINR(s.amount, 0)}</span>
              </div>
            ))}
            {subs.length === 0 && <p className="text-foreground/40 text-sm">No subs.</p>}
          </div>
          <Link href="/dashboard/subscriptions" className="block text-center w-full mt-4 py-2.5 border-2 border-foreground/10 rounded-lg text-sm font-semibold hover:bg-foreground/5 transition-colors">Manage All</Link>
        </div>

        {/* Insights teaser */}
        <div className="md:col-span-3 bg-gradient-to-br from-purple/5 to-purple/15 rounded-xl border-2 border-purple/20 p-5 md:p-8 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-purple" /> Insights</h2>
            <p className="text-sm text-foreground/60 leading-relaxed">Task completion, habit trends, and spending in one view.</p>
          </div>
          <Link href="/dashboard/insights" className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-purple text-white rounded-xl font-semibold hover:bg-purple/90 transition-colors text-sm">
            View Insights <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
