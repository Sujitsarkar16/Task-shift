"use client";

import { ReactNode } from "react";
import { useTeamWorkspaceGuard } from "@/hooks/useTeamWorkspaceGuard";

export function DevPageShell({ children }: { children: ReactNode }) {
  useTeamWorkspaceGuard();
  return <>{children}</>;
}
