export type WorkItemStatus = "todo" | "in-progress" | "review" | "done";
export type WorkItemType = "epic" | "story" | "task" | "bug" | "subtask";
export type WorkItemPriority = "low" | "medium" | "high" | "urgent";

export type WorkItem = {
  id: string;
  projectId: string;
  type: WorkItemType;
  title: string;
  description?: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  storyPoints?: number;
  order: number;
  assigneeId?: string;
  dueDate?: string;
  sprintId?: string;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  key?: string;
  description?: string;
};

export const KANBAN_COLUMNS: {
  id: WorkItemStatus;
  title: string;
  accent: string;
  header: string;
}[] = [
  {
    id: "todo",
    title: "To Do",
    accent: "border-foreground/10",
    header: "bg-white",
  },
  {
    id: "in-progress",
    title: "In Progress",
    accent: "border-purple/30",
    header: "bg-purple-soft/40",
  },
  {
    id: "review",
    title: "In Review",
    accent: "border-[#ffe066]/60",
    header: "bg-[#fff9db]",
  },
  {
    id: "done",
    title: "Done",
    accent: "border-emerald-200",
    header: "bg-emerald-50",
  },
];

export const TYPE_STYLES: Record<WorkItemType, { label: string; className: string }> = {
  epic: { label: "Epic", className: "bg-violet-100 text-violet-700" },
  story: { label: "Story", className: "bg-indigo-100 text-indigo-700" },
  task: { label: "Task", className: "bg-sky-100 text-sky-700" },
  bug: { label: "Bug", className: "bg-red-100 text-red-700" },
  subtask: { label: "Sub", className: "bg-slate-100 text-slate-600" },
};

export const PRIORITY_STYLES: Record<WorkItemPriority, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};
