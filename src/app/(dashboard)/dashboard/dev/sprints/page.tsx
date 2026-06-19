"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Rocket } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";
import { useDevWorkItems } from "@/hooks/useDevWorkItems";

type Sprint = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
};

export default function SprintsPage() {
  const { project } = useDevProject();
  const { items } = useDevWorkItems(project?.id);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  const fetchSprints = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await fetch(`/api/sprints?projectId=${project.id}`);
      if (res.ok) setSprints(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  const sprintVelocity = (sprintId: string) =>
    items
      .filter((i) => i.sprintId === sprintId && i.status === "done")
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const res = await fetch("/api/sprints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        status: "planned",
      }),
    });
    if (res.ok) {
      setForm({ name: "", startDate: "", endDate: "" });
      setShowForm(false);
      fetchSprints();
    }
  };

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/sprints/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSprints();
  };

  return (
    <DevPageShell>
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <Rocket className="w-8 h-8 text-purple" />
                Sprints
              </h1>
              <p className="text-foreground/60 text-lg">Plan iterations and track team velocity.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg font-medium hover:bg-purple/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New sprint
            </button>
          </div>

          {showForm && (
            <form
             
              onSubmit={handleCreate}
              className="mb-6 bg-white p-6 rounded-xl border-2 border-purple grid md:grid-cols-4 gap-4"
            >
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sprint name"
                className="md:col-span-2 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                required
              />
              <button type="submit" className="md:col-span-4 px-6 py-2 bg-foreground text-background rounded-lg font-bold">
                Create sprint
              </button>
            </form>
          )}

          <div className="grid gap-4">
            {sprints.length === 0 ? (
              <p className="text-center text-foreground/50 py-12 font-medium">No sprints yet.</p>
            ) : (
              sprints.map((sprint) => (
                <div
                  key={sprint.id}
                 
                  className="bg-white rounded-xl border-2 border-foreground/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-lg">{sprint.name}</h3>
                    <p className="text-sm text-foreground/60 mt-1">
                      {new Date(sprint.startDate).toLocaleDateString()} –{" "}
                      {new Date(sprint.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-foreground/40 uppercase tracking-wider font-bold">Velocity</p>
                      <p className="font-mono font-bold text-lg">{sprintVelocity(sprint.id)} pts</p>
                    </div>
                    <select
                      value={sprint.status}
                      onChange={(e) => setStatus(sprint.id, e.target.value)}
                      className="text-sm border-2 border-foreground/10 rounded-lg px-3 py-1.5 outline-none focus:border-purple capitalize"
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
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
