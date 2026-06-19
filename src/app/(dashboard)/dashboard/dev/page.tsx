"use client";

import { KanbanBoard } from "@/components/dev/KanbanBoard";
import { DevPageShell } from "@/components/dev/DevPageShell";

export default function DeveloperDashboardPage() {
  return (
    <DevPageShell>
      <KanbanBoard />
    </DevPageShell>
  );
}
