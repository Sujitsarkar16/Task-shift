"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "personal" | "developer";

type RoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoaded: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "taskstack-usecase-role";

const VALID_ROLES: UserRole[] = [
  "personal",
  "developer",
];

export function isTeamRole(role: UserRole) {
  return role !== "personal";
}

export const ROLE_HOME: Record<UserRole, string> = {
  personal: "/dashboard",
  developer: "/dashboard/dev",
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("personal");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (stored && VALID_ROLES.includes(stored)) {
      setRoleState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setRole = (next: UserRole) => {
    setRoleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, isLoaded }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}

export const ROLE_OPTIONS = [
  {
    id: "personal" as const,
    label: "Personal",
    description: "Tasks, habits, notes & subscriptions",
  },
  {
    id: "developer" as const,
    label: "Developer",
    description: "Kanban board, architecture, roadmap & insights",
  },
];
