"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, User, Code2 } from "lucide-react";
import { ROLE_HOME, ROLE_OPTIONS, useRole, type UserRole } from "@/contexts/RoleContext";

const roleIcons: Record<UserRole, typeof User> = {
  personal: User,
  developer: Code2,
};

export function RoleSwitcher() {
  const { role, setRole, isLoaded } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const active = ROLE_OPTIONS.find((option) => option.id === role) ?? ROLE_OPTIONS[0];
  const ActiveIcon = roleIcons[role];

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (next: UserRole) => {
    setRole(next);
    setOpen(false);
    router.push(ROLE_HOME[next]);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-foreground/10 bg-white hover:border-purple/40 hover:bg-purple-soft/10 transition-colors text-sm font-medium"
      >
        <ActiveIcon className="w-4 h-4 text-purple" />
        <span className="hidden sm:inline">{active.label}</span>
        <span className="sm:hidden">Role</span>
        <ChevronDown
          className={`w-4 h-4 text-foreground/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border-2 border-foreground/10 bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">
              Use case / Role
            </p>
          </div>
          {ROLE_OPTIONS.map((option) => {
            const Icon = roleIcons[option.id];
            const selected = option.id === role;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-foreground/5 transition-colors ${
                  selected ? "bg-purple-soft/20" : ""
                }`}
              >
                <div
                  className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selected ? "bg-purple text-white" : "bg-foreground/5 text-foreground/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{option.label}</span>
                    {selected && <Check className="w-4 h-4 text-purple shrink-0" />}
                  </div>
                  <p className="text-xs text-foreground/50 mt-0.5">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
