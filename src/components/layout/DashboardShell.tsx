"use client";

import { RoleProvider } from "@/contexts/RoleContext";
import { Sidebar } from "./Sidebar";
import { DashboardTopBar } from "./DashboardTopBar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-[#faf9f8]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardTopBar />
          <main className="flex-1 flex flex-col min-h-0">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
