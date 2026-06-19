"use client";

import { useEffect, useState } from "react";
import { BarChart3, Bug, CheckCircle2, Layers, ListTodo, TrendingUp } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";
import { useDevWorkItems } from "@/hooks/useDevWorkItems";
import { TYPE_STYLES, type WorkItem } from "@/lib/dev/types";

export default function InsightsPage() {
  const { project } = useDevProject();
  const { items } = useDevWorkItems(project?.id);
  const [sprints, setSprints] = useState<any[]>([]);

  useEffect(() => {
    if (!project?.id) return;
    fetch(`/api/sprints?projectId=${project.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setSprints)
      .catch(console.error);
  }, [project?.id]);

  const byStatus = (status: string) => items.filter((i) => i.status === status).length;
  const donePoints = items
    .filter((i) => i.status === "done")
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const activeSprint = sprints.find((s) => s.status === "active");
  const bugs = items.filter((i) => i.type === "bug").length;
  const epics = items.filter((i) => i.type === "epic").length;

  const priorityBreakdown = ["urgent", "high", "medium", "low"].map((p) => ({
    label: p,
    count: items.filter((i) => i.priority === p).length,
  }));

  return (
    <DevPageShell>
      <div className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div>
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple" />
              Insights
            </h1>
            <p className="text-foreground/60 text-lg">
              Portfolio health for {project?.name ?? "your project"}.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total items", value: items.length, icon: ListTodo },
              { label: "Done points", value: donePoints, icon: TrendingUp },
              { label: "Open bugs", value: bugs, icon: Bug },
              { label: "Epics", value: epics, icon: Layers },
            ].map((stat) => (
              <div
                key={stat.label}
               
                className="bg-white rounded-xl border-2 border-foreground/10 p-5"
              >
                <stat.icon className="w-5 h-5 text-purple mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
              <h2 className="font-bold mb-4">Workflow status</h2>
              <div className="space-y-3">
                {[
                  { key: "todo", label: "To Do", color: "bg-foreground/20" },
                  { key: "in-progress", label: "In Progress", color: "bg-purple" },
                  { key: "review", label: "In Review", color: "bg-[#ffe066]" },
                  { key: "done", label: "Done", color: "bg-emerald-400" },
                ].map((row) => {
                  const count = byStatus(row.key);
                  const pct = items.length ? Math.round((count / items.length) * 100) : 0;
                  return (
                    <div key={row.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{row.label}</span>
                        <span className="text-foreground/50">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border-2 border-foreground/10 p-6">
              <h2 className="font-bold mb-4">Priority mix</h2>
              <div className="space-y-2">
                {priorityBreakdown.map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-3 rounded-lg bg-[#faf9f8]">
                    <span className="text-sm font-medium capitalize">{row.label}</span>
                    <span className="font-mono font-bold">{row.count}</span>
                  </div>
                ))}
              </div>
              {activeSprint && (
                <div className="mt-6 p-4 rounded-lg bg-purple-soft/30 border-2 border-purple/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple mb-1">Active sprint</p>
                  <p className="font-bold">{activeSprint.name}</p>
                  <p className="text-sm text-foreground/60 mt-1">
                    {new Date(activeSprint.startDate).toLocaleDateString()} –{" "}
                    {new Date(activeSprint.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl border-2 border-foreground/10 p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple" />
              Recently completed
            </h2>
            {items.filter((i) => i.status === "done").length === 0 ? (
              <p className="text-foreground/50 text-sm">No completed items yet.</p>
            ) : (
              <div className="space-y-2">
                {items
                  .filter((i: WorkItem) => i.status === "done")
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#faf9f8]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${TYPE_STYLES[item.type].className}`}>
                          {TYPE_STYLES[item.type].label}
                        </span>
                        <span className="font-medium truncate">{item.title}</span>
                      </div>
                      {item.storyPoints ? (
                        <span className="text-xs font-mono text-foreground/50 shrink-0">{item.storyPoints} pts</span>
                      ) : null}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DevPageShell>
  );
}
