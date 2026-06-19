"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid,
  Users,
  Filter,
  Star,
  MoreHorizontal,
  X,
} from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import {
  KANBAN_COLUMNS,
  TYPE_STYLES,
  type Project,
  type WorkItem,
  type WorkItemStatus,
  type WorkItemType,
  type WorkItemPriority,
} from "@/lib/dev/types";


export function KanbanBoard() {
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<WorkItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBoard = useCallback(async () => {
    try {
      let projectsRes = await fetch("/api/projects");
      if (!projectsRes.ok) return;

      let projects: Project[] = await projectsRes.json();

      if (projects.length === 0) {
        const createRes = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Sprint Board",
            description: "Main development kanban board",
          }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          projects = [created];
        }
      }

      const activeProject = projects[0];
      if (!activeProject) return;

      setProject(activeProject);

      const itemsRes = await fetch(`/api/work-items?projectId=${activeProject.id}`);
      if (!itemsRes.ok) return;

      let workItems: WorkItem[] = await itemsRes.json();


      setItems(workItems);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDrop = async (status: WorkItemStatus) => {
    if (!dragItem || dragItem.status === status) {
      setDragItem(null);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === dragItem.id ? { ...item, status } : item)),
    );
    setDragItem(null);

    try {
      await fetch(`/api/work-items/${dragItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error(error);
      fetchBoard();
    }
  };

  const handleAdd = async (status: WorkItemStatus, title: string) => {
    if (!project) return;

    try {
      const res = await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title,
          status,
          type: "task",
          priority: "medium",
          order: Date.now(),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setItems((prev) => [...prev, created]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateSelected = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/work-items/${selectedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedItem.title,
          description: selectedItem.description,
          type: selectedItem.type,
          priority: selectedItem.priority,
          storyPoints: selectedItem.storyPoints,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedItem(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedItem || !confirm("Delete this card?")) return;
    try {
      const res = await fetch(`/api/work-items/${selectedItem.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
        setSelectedItem(null);
      }
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#faf9f8]">
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-purple" />
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {project?.name ?? "Board"}
            </h1>
            {project?.key && (
              <span className="text-xs font-mono bg-purple-soft text-purple px-2 py-0.5 rounded-lg font-bold">
                {project.key}
              </span>
            )}
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-colors"
            title="Star board"
          >
            <Star className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-foreground/10 bg-white hover:bg-foreground/5 text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-foreground/10 bg-white hover:bg-foreground/5 text-sm font-medium transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            type="button"
            className="p-2 rounded-lg border-2 border-foreground/10 bg-white hover:bg-foreground/5 text-foreground/60 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <div className="flex gap-4 h-full min-w-max pb-2">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              status={column.id}
              columnTitle={column.title}
              accent={column.accent}
              header={column.header}
              items={items
                .filter((item) => item.status === column.id)
                .sort((a, b) => a.order - b.order)}
              onDragStart={setDragItem}
              onDrop={handleDrop}
              onAdd={handleAdd}
              onCardClick={setSelectedItem}
            />
          ))}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40">
          <div className="bg-white rounded-xl border-2 border-foreground/10 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b-2 border-foreground/10">
              <div className="flex-1 min-w-0 pr-4">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 ${TYPE_STYLES[selectedItem.type].className}`}>
                  {TYPE_STYLES[selectedItem.type].label}
                </span>
                <input
                  value={selectedItem.title}
                  onChange={(event) =>
                    setSelectedItem({ ...selectedItem, title: event.target.value })
                  }
                  className="w-full text-lg font-bold text-foreground outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg hover:bg-foreground/5 text-foreground/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1 block">
                  Description
                </label>
                <textarea
                  value={selectedItem.description || ""}
                  onChange={(event) =>
                    setSelectedItem({ ...selectedItem, description: event.target.value })
                  }
                  className="w-full min-h-[100px] text-sm text-foreground border-2 border-foreground/10 rounded-lg p-3 outline-none focus:border-purple"
                  placeholder="Add a more detailed description…"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1 block">
                    Type
                  </label>
                  <select
                    value={selectedItem.type}
                    onChange={(event) =>
                      setSelectedItem({
                        ...selectedItem,
                        type: event.target.value as WorkItemType,
                      })
                    }
                    className="w-full text-sm border-2 border-foreground/10 rounded-lg px-2 py-1.5 outline-none focus:border-purple"
                  >
                    <option value="task">Task</option>
                    <option value="bug">Bug</option>
                    <option value="story">Story</option>
                    <option value="epic">Epic</option>
                    <option value="subtask">Subtask</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1 block">
                    Priority
                  </label>
                  <select
                    value={selectedItem.priority}
                    onChange={(event) =>
                      setSelectedItem({
                        ...selectedItem,
                        priority: event.target.value as WorkItemPriority,
                      })
                    }
                    className="w-full text-sm border-2 border-foreground/10 rounded-lg px-2 py-1.5 outline-none focus:border-purple"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1 block">
                    Points
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={selectedItem.storyPoints ?? ""}
                    onChange={(event) =>
                      setSelectedItem({
                        ...selectedItem,
                        storyPoints: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      })
                    }
                    className="w-full text-sm border-2 border-foreground/10 rounded-lg px-2 py-1.5 outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="text-sm font-medium text-light-red hover:text-light-red/80"
                >
                  Delete card
                </button>
                <button
                  type="button"
                  onClick={handleUpdateSelected}
                  disabled={saving}
                  className="px-4 py-2 bg-purple hover:bg-purple/90 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
