"use client";

import { useState } from "react";
import { Map, Plus } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";
import { useDevWorkItems } from "@/hooks/useDevWorkItems";
import { TYPE_STYLES } from "@/lib/dev/types";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function RoadmapPage() {
  const { project } = useDevProject();
  const { items, refresh } = useDevWorkItems(project?.id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");

  const epics = items.filter((i) => i.type === "epic" || i.type === "story");

  const getQuarter = (item: (typeof items)[0]) => {
    const date = item.dueDate ? new Date(item.dueDate) : new Date();
    return QUARTERS[Math.floor(date.getMonth() / 3)];
  };

  const handleAddEpic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !title.trim()) return;
    await fetch("/api/work-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        title: title.trim(),
        type: "epic",
        status: "todo",
        priority: "medium",
        order: Date.now(),
      }),
    });
    setTitle("");
    setShowForm(false);
    refresh();
  };

  return (
    <DevPageShell>
      <div className="max-w-6xl mx-auto px-6 py-12 w-full">
        <div>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <Map className="w-8 h-8 text-purple" />
                Roadmap
              </h1>
              <p className="text-foreground/60 text-lg">Epics and initiatives on a quarterly timeline.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-purple hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Add epic
            </button>
          </div>

          {showForm && (
            <form
             
              onSubmit={handleAddEpic}
              className="mb-6 bg-white p-6 rounded-xl border-2 border-purple flex gap-4"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Epic title…"
                className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                autoFocus
              />
              <button type="submit" className="px-6 py-2 bg-purple text-white rounded-lg font-bold">
                Save
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {QUARTERS.map((quarter) => {
              const quarterItems = epics.filter((i) => getQuarter(i) === quarter);
              return (
                <div
                  key={quarter}
                 
                  className="bg-white rounded-xl border-2 border-foreground/10 p-4 min-h-[200px]"
                >
                  <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/40 mb-4">
                    {quarter} 2026
                  </h3>
                  <div className="space-y-2">
                    {quarterItems.length === 0 ? (
                      <p className="text-xs text-foreground/40">No epics planned</p>
                    ) : (
                      quarterItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border-2 border-foreground/5 bg-[#faf9f8] hover:border-purple/30 transition-colors"
                        >
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TYPE_STYLES[item.type].className}`}>
                            {TYPE_STYLES[item.type].label}
                          </span>
                          <p className="font-medium text-sm mt-2">{item.title}</p>
                          {item.storyPoints ? (
                            <p className="text-xs text-foreground/50 mt-1">{item.storyPoints} pts</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DevPageShell>
  );
}
