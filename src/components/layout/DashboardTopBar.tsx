"use client";

import { RoleSwitcher } from "./RoleSwitcher";
import { useRole } from "@/contexts/RoleContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { QuickCapture } from "@/components/QuickCapture";
import { MobileNav } from "./MobileNav";

const WORKSPACE_LABELS: Record<string, string> = {
  personal: "Personal workspace",
  developer: "Developer workspace",
};

export function DashboardTopBar() {
  const { role } = useRole();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground/10 bg-[#fdfdfc] px-4 md:px-6 py-3 flex items-center justify-between gap-3">
      {/* Left: hamburger (mobile) + workspace label */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="text-sm font-medium text-foreground/60 hidden sm:block">
          {WORKSPACE_LABELS[role] ?? "Workspace"}
        </div>
      </div>

      {/* Right: quick add, notifications, role switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        <QuickCapture />
        <NotificationBell />
        <RoleSwitcher />
      </div>
    </header>
  );
}
