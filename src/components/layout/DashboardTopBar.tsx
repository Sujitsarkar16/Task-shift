"use client";

import { RoleSwitcher } from "./RoleSwitcher";
import { useRole } from "@/contexts/RoleContext";

const WORKSPACE_LABELS: Record<string, string> = {
  personal: "Personal workspace",
  developer: "Developer workspace",
};

export function DashboardTopBar() {
  const { role } = useRole();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground/10 bg-[#fdfdfc] px-6 py-3 flex items-center justify-between">
      <div className="text-sm font-medium text-foreground/60">
        {WORKSPACE_LABELS[role] ?? "Workspace"}
      </div>
      <RoleSwitcher />
    </header>
  );
}
