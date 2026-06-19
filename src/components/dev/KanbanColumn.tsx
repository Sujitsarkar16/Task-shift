"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { WorkItem, WorkItemStatus } from "@/lib/dev/types";
import { WorkItemCard } from "./WorkItemCard";

type KanbanColumnProps = {
  status: WorkItemStatus;
  columnTitle: string;
  accent: string;
  header: string;
  items: WorkItem[];
  onDragStart: (item: WorkItem) => void;
  onDrop: (status: WorkItemStatus) => void;
  onAdd: (status: WorkItemStatus, title: string) => void;
  onCardClick: (item: WorkItem) => void;
};

export function KanbanColumn({
  status,
  columnTitle,
  accent,
  header,
  items,
  onDragStart,
  onDrop,
  onAdd,
  onCardClick,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const submitCard = () => {
    if (!cardTitle.trim()) return;
    onAdd(status, cardTitle.trim());
    setCardTitle("");
    setIsAdding(false);
  };

  return (
    <section
      className={`w-72 shrink-0 flex flex-col max-h-full rounded-xl border-2 ${accent} ${
        isDragOver ? "ring-2 ring-purple ring-offset-2" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        onDrop(status);
      }}
    >
      <header className={`px-3 py-2.5 rounded-t-[10px] ${header} flex items-center justify-between`}>
        <h3 className="text-sm font-bold text-foreground">{columnTitle}</h3>
        <span className="text-xs font-bold text-foreground/50 bg-white/80 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#faf9f8] min-h-[120px]">
        {items.map((item) => (
          <WorkItemCard
            key={item.id}
            item={item}
            onDragStart={onDragStart}
            onClick={onCardClick}
          />
        ))}
      </div>

      <div className="p-2 bg-[#faf9f8] rounded-b-[10px]">
        {isAdding ? (
          <div className="bg-white rounded-lg border-2 border-foreground/10 p-2 shadow-sm">
            <textarea
              value={cardTitle}
              onChange={(event) => setCardTitle(event.target.value)}
              placeholder="Enter a title for this card…"
              className="w-full text-sm resize-none outline-none min-h-[60px] text-foreground"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitCard();
                }
                if (event.key === "Escape") {
                  setIsAdding(false);
                  setCardTitle("");
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={submitCard}
                className="px-3 py-1.5 bg-purple hover:bg-purple/90 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setCardTitle("");
                }}
                className="px-3 py-1.5 text-foreground/60 text-xs font-medium hover:bg-foreground/5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-foreground/60 hover:bg-foreground/5 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add a card
          </button>
        )}
      </div>
    </section>
  );
}
