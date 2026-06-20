"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";

type CalEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: "task" | "subscription";
  meta?: string; // priority / amount
};

function toYMD(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const [tasksRes, subsRes] = await Promise.all([
        fetch("/api/todos"),
        fetch("/api/subscriptions"),
      ]);
      const [tasks, subs] = await Promise.all([
        tasksRes.ok ? tasksRes.json() : [],
        subsRes.ok ? subsRes.json() : [],
      ]);

      const taskEvents: CalEvent[] = tasks
        .filter((t: any) => t.deadline)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          date: toYMD(new Date(t.deadline)),
          type: "task" as const,
          meta: t.priority,
        }));

      const subEvents: CalEvent[] = subs
        .filter((s: any) => s.renewalDate && s.status !== "cancelled")
        .map((s: any) => ({
          id: s.id,
          title: s.name,
          date: toYMD(new Date(s.renewalDate)),
          type: "subscription" as const,
          meta: `$${s.amount}`,
        }));

      setEvents([...taskEvents, ...subEvents]);
      setLoading(false);
    };
    load();
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toYMD(new Date());

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };

  const dayEvents = (dayStr: string) => events.filter((e) => e.date === dayStr);

  // Weeks grid: fill leading empty cells
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const [selected, setSelected] = useState<string | null>(null);
  const selectedEvents = selected ? dayEvents(selected) : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Calendar</h1>
          <p className="text-foreground/60 text-lg">Your tasks and renewals at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-foreground/10 hover:bg-foreground/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold min-w-[160px] text-center">{monthLabel}</span>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-foreground/10 hover:bg-foreground/5 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs font-semibold">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple" /> Task deadline</span>
        <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-amber-500" /> Subscription renewal</span>
      </div>

      <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b-2 border-foreground/5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-3 text-center text-xs font-bold uppercase tracking-widest text-foreground/40">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {!loading && (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
              const evs = dayStr ? dayEvents(dayStr) : [];
              const isToday = dayStr === todayStr;
              const isSelected = dayStr === selected;

              return (
                <div
                  key={i}
                  onClick={() => dayStr && setSelected(isSelected ? null : dayStr)}
                  className={`min-h-[80px] p-2 border-b border-r border-foreground/5 cursor-pointer transition-colors ${
                    !day ? "bg-foreground/2 cursor-default" : isSelected ? "bg-purple/5" : "hover:bg-foreground/3"
                  }`}
                >
                  {day && (
                    <>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                        isToday ? "bg-purple text-white" : "text-foreground/70"
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {evs.slice(0, 3).map((ev, j) => (
                          <div
                            key={j}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold truncate ${
                              ev.type === "task"
                                ? "bg-purple/10 text-purple"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div className="text-[10px] text-foreground/40 font-semibold pl-1">+{evs.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day panel */}
      {selected && selectedEvents.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border-2 border-foreground/10 p-6">
          <h3 className="font-bold mb-4 text-sm text-foreground/60 uppercase tracking-wider">
            {new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <div className="space-y-3">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-foreground/3">
                {ev.type === "task" ? (
                  <CheckCircle2 className="w-4 h-4 text-purple shrink-0" />
                ) : (
                  <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className="font-medium text-sm flex-1">{ev.title}</span>
                {ev.meta && (
                  <span className="text-xs font-semibold text-foreground/40">{ev.meta}</span>
                )}
                <Link
                  href={ev.type === "task" ? "/dashboard/tasks" : "/dashboard/subscriptions"}
                  className="text-xs text-purple hover:underline"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
