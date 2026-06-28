"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CheckSquare2, Home, Settings, Activity, BookOpen,
  CreditCard, LayoutGrid, FlaskConical, Rocket,
  BarChart3, Map, ListOrdered, FileText, Compass,
  Key, SunMedium, CalendarDays, TrendingUp, Upload,
  LogOut, Zap,
} from "lucide-react";
import { isTeamRole, ROLE_HOME, useRole } from "@/contexts/RoleContext";

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email[0].toUpperCase();
  return "TS";
}

/* Color per nav item: [icon bg, icon text, active bg, active border] */
const NAV_COLORS: Record<string, [string, string, string, string]> = {
  "/dashboard":              ["bg-violet-100",  "text-violet-600", "bg-violet-50",  "border-violet-200"],
  "/dashboard/today":        ["bg-amber-100",   "text-amber-600",  "bg-amber-50",   "border-amber-200"],
  "/dashboard/tasks":        ["bg-blue-100",    "text-blue-600",   "bg-blue-50",    "border-blue-200"],
  "/dashboard/habits":       ["bg-orange-100",  "text-orange-600", "bg-orange-50",  "border-orange-200"],
  "/dashboard/notes":        ["bg-yellow-100",  "text-yellow-600", "bg-yellow-50",  "border-yellow-200"],
  "/dashboard/calendar":     ["bg-cyan-100",    "text-cyan-600",   "bg-cyan-50",    "border-cyan-200"],
  "/dashboard/subscriptions":["bg-emerald-100", "text-emerald-600","bg-emerald-50", "border-emerald-200"],
  "/dashboard/insights":     ["bg-purple-100",  "text-purple-600", "bg-purple-50",  "border-purple-200"],
  "/dashboard/import":       ["bg-pink-100",    "text-pink-600",   "bg-pink-50",    "border-pink-200"],
};

const personalLinks = [
  { name: "Overview",       href: "/dashboard",               icon: Home },
  { name: "Today",          href: "/dashboard/today",          icon: SunMedium },
  { name: "Tasks",          href: "/dashboard/tasks",          icon: CheckSquare2 },
  { name: "Habits",         href: "/dashboard/habits",         icon: Activity },
  { name: "Notes",          href: "/dashboard/notes",          icon: BookOpen },
  { name: "Calendar",       href: "/dashboard/calendar",       icon: CalendarDays },
  { name: "Subscriptions",  href: "/dashboard/subscriptions",  icon: CreditCard },
  { name: "Insights",       href: "/dashboard/insights",       icon: TrendingUp },
  { name: "Import",         href: "/dashboard/import",         icon: Upload },
];

const teamSections = [
  {
    label: "Planning",
    links: [
      { name: "Insights",      href: "/dashboard/dev/insights",      icon: BarChart3 },
      { name: "Roadmap",       href: "/dashboard/dev/roadmap",        icon: Map },
      { name: "Backlog",       href: "/dashboard/dev/backlog",        icon: ListOrdered },
      { name: "Requirements",  href: "/dashboard/dev/requirements",   icon: FileText },
    ],
  },
  {
    label: "Delivery",
    links: [
      { name: "Board",   href: "/dashboard/dev",          icon: LayoutGrid },
      { name: "Sprints", href: "/dashboard/dev/sprints",  icon: Rocket },
      { name: "Vault",   href: "/dashboard/dev/vault",    icon: Key },
    ],
  },
  {
    label: "Quality & Design",
    links: [
      { name: "Test Lab",      href: "/dashboard/dev/tests",        icon: FlaskConical },
      { name: "Architecture",  href: "/dashboard/dev/architecture", icon: Compass },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const { role, isLoaded } = useRole();

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials    = getInitials(session?.user?.name, session?.user?.email);
  const teamMode    = isTeamRole(role);

  useEffect(() => {
    if (!isLoaded) return;
    if (teamMode && pathname === "/dashboard") router.replace(ROLE_HOME[role]);
  }, [teamMode, isLoaded, pathname, router, role]);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard/dev" && href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="w-64 bg-white border-r border-foreground/8 flex flex-col h-screen sticky top-0 hidden md:flex shadow-sm">

      {/* Logo */}
      <div className="px-5 py-5 shrink-0 border-b border-foreground/6">
        <Link
          href={teamMode ? ROLE_HOME[role] : "/dashboard"}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple to-violet-400 flex items-center justify-center shadow-md shadow-purple/30 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple to-violet-500 bg-clip-text text-transparent">
              taskshift
            </span>
            <span className="text-foreground/30 text-xs block leading-none">workspace</span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {teamMode ? (
          teamSections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-foreground/35">
                {section.label}
              </p>
              {section.links.map((link) => {
                const Icon   = link.icon;
                const active = isActive(link.href);
                return (
                  <Link key={link.name} href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      active
                        ? "bg-purple/10 text-purple"
                        : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                    }`}>
                    <Icon className="w-4 h-4" /> {link.name}
                  </Link>
                );
              })}
            </div>
          ))
        ) : (
          personalLinks.map((link) => {
            const Icon    = link.icon;
            const active  = isActive(link.href);
            const colors  = NAV_COLORS[link.href] ?? ["bg-gray-100", "text-gray-600", "bg-gray-50", "border-gray-200"];
            const [iconBg, iconText, activeBg, activeBorder] = colors;

            return (
              <Link key={link.name} href={link.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                  active
                    ? `${activeBg} ${activeBorder} text-foreground`
                    : "border-transparent text-foreground/60 hover:bg-white hover:text-foreground hover:border-foreground/8 hover:shadow-sm"
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? `${iconBg} ${iconText}` : `bg-foreground/6 ${iconText} group-hover:${iconBg}`} transition-colors`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{link.name}</span>
              </Link>
            );
          })
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-foreground/6 shrink-0">
        <Link href="/dashboard/settings"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/5 transition-colors group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple to-violet-400 flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden shadow-sm">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt={displayName} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-foreground/40 truncate">{session?.user?.email || ""}</p>
          </div>
          <Settings className="w-4 h-4 text-foreground/30 group-hover:text-foreground/60 shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
