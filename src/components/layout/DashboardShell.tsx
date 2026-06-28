"use client";

import { RoleProvider } from "@/contexts/RoleContext";
import { Sidebar } from "./Sidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <ToastProvider>
        <RoleProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <DashboardTopBar />
              <main className="flex-1 flex flex-col min-h-0">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        </RoleProvider>
      </ToastProvider>
    </SWRProvider>
  );
}
