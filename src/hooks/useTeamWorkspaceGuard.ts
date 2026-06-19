"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isTeamRole, useRole } from "@/contexts/RoleContext";

export function useTeamWorkspaceGuard() {
  const { role, isLoaded } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isTeamRole(role)) {
      router.replace("/dashboard");
    }
  }, [role, isLoaded, router]);

  return { isReady: isLoaded && isTeamRole(role) };
}
