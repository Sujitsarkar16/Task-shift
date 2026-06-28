"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useTasks } from "@/hooks/useTasks";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatINR } from "@/lib/currency";

type CalEvent = { id: string; title: string; date: string; type: "task" | "subscription"; meta?: string; };

function toYMD(date: Date) { return date.toISOString().split("T")[0]; }

export default function CalendarPage() {
  const { tasks, isLoading: lT } = useTasks();
  const { subscriptions: subs, isLoading: lS } = useSubscriptions();
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const isLoading = lT || lS;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = toYMD(new Date());
  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const events: CalEvent[] = [
    ...tasks.filter((t) => t.deadline).map((t) => ({
      id: t.id, title: t.title, date: toYMD(new Date(t.deadline)), type: "task" as const, meta: t.priority,
    })),
    ...subs.filter((s) => s.renewalDate && s.status !== "cancelled").map((s) => ({
      id: s.id, title: s.name, date: toYMD(new Date(s.renewalDate)), type: "subscription" as const,
      meta: formatINR(s.amount, 0),
    })),
  ];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const dayEvents = (dayStr: string) => events.filter((e) => e.date === dayStr);
  const selectedEvents = selected ? dayEvents(selected) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full">
      <div className="flex justify-between items-end mb-6 md:mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Calendar</h1>
          <p className="text-foreground/60">Your tasks and renewals at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-foreground/10 hover:bg-foreground/5"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-bold min-w-[140px] md:min-w-[160px] text-center text-sm md:text-base">{monthLabel}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-foreground/10 hover:bg-foreground/5"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs font-semibold flex-wrap">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple" /> Task deadline</span>
        <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-amber-500" /> Subscription renewal</span>
      </div>

      <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
        <div className="grid grid-cols-7 border-b-2 border-foreground/5">
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <div key={i} className="p-2 md:p-3 text-center text-xs font-bold uppercase tracking-widest text-foreground/40">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[60px] md:min-h-[80px] p-2 border-b border-r border-foreground/5 animate-pulse bg-foreground/2" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dayStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
              const evs = dayStr ? dayEvents(dayStr) : [];
              const isToday = dayStr === todayStr;
              const isSel = dayStr === selected;
              return (
                <div key={i} onClick={() => dayStr && setSelected(isSel ? null : dayStr)}
                  className={`min-h-[60px] md:min-h-[80px] p-1.5 md:p-2 border-b border-r border-foreground/5 cursor-pointer transition-colors ${
                    !day ? "bg-foreground/2 cursor-default" : isSel ? "bg-purple/5" : "hover:bg-foreground/3"
                  }`}>
                  {day && (
                    <>
                      <div className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs md:text-sm font-bold mb-1 ${isToday ? "bg-purple text-white" : "text-foreground/70"}`}>{day}</div>
                      <div className="space-y-0.5">
                        {evs.slice(0, 2).map((ev, j) => (
                          <div key={j} className={`text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded font-semibold truncate ${ev.type === "task" ? "bg-purple/10 text-purple" : "bg-amber-100 text-amber-700"}`}>
                            {ev.title}
                          </div>
                        ))}
                        {evs.length > 2 && <div className="text-[9px] text-foreground/40 pl-1">+{evs.length - 2}</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && selectedEvents.length > 0 && (
        <div className="mt-4 md:mt-6 bg-white rounded-xl border-2 border-foreground/10 p-4 md:p-6">
          <h3 className="font-bold mb-4 text-sm text-foreground/60 uppercase tracking-wider">
            {new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <div className="space-y-2 md:space-y-3">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-foreground/3">
                {ev.type === "task" ? <CheckCircle2 className="w-4 h-4 text-purple shrink-0" /> : <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />}
                <span className="font-medium text-sm flex-1">{ev.title}</span>
                {ev.meta && <span className="text-xs font-semibold text-foreground/40">{ev.meta}</span>}
                <Link href={ev.type === "task" ? "/dashboard/tasks" : "/dashboard/subscriptions"} className="text-xs text-purple hover:underline">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
