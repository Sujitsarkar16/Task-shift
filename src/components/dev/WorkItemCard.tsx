"use client";

import { Bug, BookOpen, Layers, ListTodo, GitBranch } from "lucide-react";
import type { WorkItem, WorkItemType } from "@/lib/dev/types";
import { PRIORITY_STYLES, TYPE_STYLES } from "@/lib/dev/types";

const typeIcons: Record<WorkItemType, typeof ListTodo> = {
  epic: Layers,
  story: BookOpen,
  task: ListTodo,
  bug: Bug,
  subtask: GitBranch,
};

type WorkItemCardProps = {
  item: WorkItem;
  onDragStart: (item: WorkItem) => void;
  onClick: (item: WorkItem) => void;
};

export function WorkItemCard({ item, onDragStart, onClick }: WorkItemCardProps) {
  const typeStyle = TYPE_STYLES[item.type] ?? TYPE_STYLES.task;
  const TypeIcon = typeIcons[item.type] ?? ListTodo;

  return (
    <article
      draggable
      onDragStart={() => onDragStart(item)}
      onClick={() => onClick(item)}
      className="bg-white rounded-lg border-2 border-foreground/10 p-3 cursor-grab active:cursor-grabbing hover:border-purple/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${typeStyle.className}`}>
          <TypeIcon className="w-3 h-3" />
          {typeStyle.label}
        </span>
        <span
          className={`w-2 h-2 rounded-full shrink-0 mt-1 ${PRIORITY_STYLES[item.priority]}`}
          title={`${item.priority} priority`}
        />
      </div>
      <h4 className="text-sm font-semibold text-foreground leading-snug mb-2">
        {item.title}
      </h4>
      {item.description && (
        <p className="text-xs text-foreground/50 line-clamp-2 mb-2">{item.description}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        {item.storyPoints !== undefined && item.storyPoints > 0 ? (
          <span className="text-[10px] font-bold text-foreground/50 bg-foreground/5 px-2 py-0.5 rounded">
            {item.storyPoints} pts
          </span>
        ) : (
          <span />
        )}
        {item.dueDate && (
          <span className="text-[10px] text-foreground/50">
            {new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </article>
  );
}
