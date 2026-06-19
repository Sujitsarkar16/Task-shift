"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Plus } from "lucide-react";
import { DevPageShell } from "@/components/dev/DevPageShell";
import { useDevProject } from "@/hooks/useDevProject";
import { useDevWorkItems } from "@/hooks/useDevWorkItems";
import { TYPE_STYLES } from "@/lib/dev/types";

export default function RequirementsPage() {
  const { project } = useDevProject();
  const { items, refresh } = useDevWorkItems(project?.id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "story" });

  const requirements = items.filter((i) => i.type === "epic" || i.type === "story");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !form.title.trim()) return;
    await fetch("/api/work-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        title: form.title.trim(),
        description: form.description,
        type: form.type,
        status: "todo",
        priority: "medium",
        order: Date.now(),
      }),
    });
    setForm({ title: "", description: "", type: "story" });
    setShowForm(false);
    refresh();
  };

  const saveDescription = async (id: string, description: string) => {
    await fetch(`/api/work-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    refresh();
  };

  return (
    <DevPageShell>
      <div className="max-w-5xl mx-auto px-6 py-12 w-full">
        <div>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple" />
                Requirements
              </h1>
              <p className="text-foreground/60 text-lg">
                PRDs and user stories linked to delivery work.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple text-white rounded-lg font-medium hover:bg-purple/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New requirement
            </button>
          </div>

          {showForm && (
            <form
             
              onSubmit={handleCreate}
              className="mb-6 bg-white p-6 rounded-xl border-2 border-purple space-y-4"
            >
              <div className="flex gap-4">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                >
                  <option value="story">User Story</option>
                  <option value="epic">Epic / PRD</option>
                </select>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Requirement title"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple"
                  required
                />
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="As a user, I want… / Acceptance criteria…"
                className="w-full min-h-[120px] px-4 py-3 rounded-lg border-2 border-foreground/10 focus:outline-none focus:border-purple resize-none"
              />
              <button type="submit" className="px-6 py-2 bg-foreground text-background rounded-lg font-bold">
                Create
              </button>
            </form>
          )}

          <div className="space-y-3">
            {requirements.length === 0 ? (
              <p className="text-foreground/50 text-center py-12 font-medium">No requirements yet.</p>
            ) : (
              requirements.map((req) => {
                const isOpen = expanded === req.id;
                return (
                  <div
                    key={req.id}
                   
                    className="bg-white rounded-xl border-2 border-foreground/10 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : req.id)}
                      className="w-full flex items-center gap-3 p-5 text-left hover:bg-[#faf9f8] transition-colors"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-foreground/40 shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-foreground/40 shrink-0" />
                      )}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${TYPE_STYLES[req.type].className}`}>
                        {TYPE_STYLES[req.type].label}
                      </span>
                      <span className="font-bold flex-1">{req.title}</span>
                      <span className="text-xs text-foreground/40 capitalize">{req.status.replace("-", " ")}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-foreground/5 pt-4">
                        <textarea
                          defaultValue={req.description || ""}
                          onBlur={(e) => saveDescription(req.id, e.target.value)}
                          className="w-full min-h-[140px] text-sm leading-relaxed border-2 border-foreground/10 rounded-lg p-4 focus:outline-none focus:border-purple resize-none"
                          placeholder="Write acceptance criteria, user flows, and success metrics…"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DevPageShell>
  );
}
