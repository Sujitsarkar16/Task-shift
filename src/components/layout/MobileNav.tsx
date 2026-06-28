"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, CheckCircle2, Home, Sun, Activity, NotebookPen,
  Calendar, CreditCard, TrendingUp, Upload, Settings,
  LayoutGrid, BarChart3, Map, ListOrdered, FileText, Compass, Key,
  FlaskConical, Rocket,
} from "lucide-react";
import { isTeamRole, ROLE_HOME, useRole } from "@/contexts/RoleContext";

const personalLinks = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Today", href: "/dashboard/today", icon: Sun },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckCircle2 },
  { name: "Habits", href: "/dashboard/habits", icon: Activity },
  { name: "Notes", href: "/dashboard/notes", icon: NotebookPen },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  { name: "Insights", href: "/dashboard/insights", icon: TrendingUp },
  { name: "Import", href: "/dashboard/import", icon: Upload },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const teamLinks = [
  { name: "Board", href: "/dashboard/dev", icon: LayoutGrid },
  { name: "Insights", href: "/dashboard/dev/insights", icon: BarChart3 },
  { name: "Roadmap", href: "/dashboard/dev/roadmap", icon: Map },
  { name: "Backlog", href: "/dashboard/dev/backlog", icon: ListOrdered },
  { name: "Requirements", href: "/dashboard/dev/requirements", icon: FileText },
  { name: "Sprints", href: "/dashboard/dev/sprints", icon: Rocket },
  { name: "Vault", href: "/dashboard/dev/vault", icon: Key },
  { name: "Test Lab", href: "/dashboard/dev/tests", icon: FlaskConical },
  { name: "Architecture", href: "/dashboard/dev/architecture", icon: Compass },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { role } = useRole();
  const teamMode = isTeamRole(role);
  const links = teamMode ? teamLinks : personalLinks;

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-foreground/5 transition-colors text-foreground/70"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-[#fdfdfc] z-50 flex flex-col shadow-2xl transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/10">
          <Link href={teamMode ? ROLE_HOME[role] : "/dashboard"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tighter">taskshift.</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-foreground/5 text-foreground/50"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && link.href !== "/dashboard/dev" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                  isActive
                    ? "bg-foreground/5 text-foreground"
                    : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
