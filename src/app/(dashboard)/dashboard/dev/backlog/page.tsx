"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, ListOrdered } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";
import { useDevWorkItems } from "@/hooks/useDevWorkItems";
import { PRIORITY_STYLES, TYPE_STYLES } from "@/lib/dev/types";

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function BacklogPage() {
  const { project } = useDevProject();
  const { items, refresh } = useDevWorkItems(project?.id);
  const [filter, setFilter] = useState<string>("all");
  const [sortAsc, setSortAsc] = useState(true);

  let backlog = items.filter((i) => i.status === "todo" || i.status === "in-progress");

  if (filter !== "all") {
    backlog = backlog.filter((i) => i.type === filter);
  }

  backlog = [...backlog].sort((a, b) => {
    const diff =
      PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] -
      PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER];
    return sortAsc ? diff : -diff;
  });

  const updatePriority = async (id: string, priority: string) => {
    await fetch(`/api/work-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    refresh();
  };

  return (
    <DevPageShell>
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div>
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <ListOrdered className="w-8 h-8 text-purple" />
              Backlog
            </h1>
            <p className="text-foreground/60 text-lg">
              Prioritize and groom work before sprint planning.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {["all", "epic", "story", "task", "bug"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  filter === type
                    ? "bg-purple text-white"
                    : "bg-white border-2 border-foreground/10 hover:border-purple/30"
                }`}
              >
                {type}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-foreground/10 text-sm font-medium hover:bg-foreground/5"
            >
              Priority {sortAsc ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-foreground/5 text-xs font-bold uppercase tracking-widest text-foreground/50 border-b-2 border-foreground/10">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2 text-right">Points</div>
            </div>
            {backlog.length === 0 ? (
              <p className="p-8 text-center text-foreground/50 font-medium">Backlog is empty.</p>
            ) : (
              backlog.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-foreground/5 last:border-0 hover:bg-[#faf9f8] items-center"
                >
                  <div className="col-span-1 text-sm font-mono text-foreground/40">{index + 1}</div>
                  <div className="col-span-5 font-medium text-sm truncate">{item.title}</div>
                  <div className="col-span-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${TYPE_STYLES[item.type].className}`}>
                      {TYPE_STYLES[item.type].label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={item.priority}
                      onChange={(e) => updatePriority(item.id, e.target.value)}
                      className="text-xs border-2 border-foreground/10 rounded-lg px-2 py-1 outline-none focus:border-purple"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_STYLES[item.priority]}`} />
                    <span className="font-mono text-sm">{item.storyPoints ?? "—"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DevPageShell>
  );
}
