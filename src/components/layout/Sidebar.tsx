"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Home,
  Settings,
  Activity,
  NotebookPen,
  CreditCard,
  LayoutGrid,
  FlaskConical,
  Rocket,
  BarChart3,
  Map,
  ListOrdered,
  FileText,
  Compass,
  Key,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { isTeamRole, ROLE_HOME, useRole } from "@/contexts/RoleContext";

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "TS";
}

const personalLinks = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckCircle2 },
  { name: "Habits", href: "/dashboard/habits", icon: Activity },
  { name: "Notes", href: "/dashboard/notes", icon: NotebookPen },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
];

const teamSections = [
  {
    label: "Planning",
    links: [
      { name: "Insights", href: "/dashboard/dev/insights", icon: BarChart3 },
      { name: "Roadmap", href: "/dashboard/dev/roadmap", icon: Map },
      { name: "Backlog", href: "/dashboard/dev/backlog", icon: ListOrdered },
      { name: "Requirements", href: "/dashboard/dev/requirements", icon: FileText },
    ],
  },
  {
    label: "Delivery",
    links: [
      { name: "Board", href: "/dashboard/dev", icon: LayoutGrid },
      { name: "Sprints", href: "/dashboard/dev/sprints", icon: Rocket },
      { name: "Vault", href: "/dashboard/dev/vault", icon: Key },
    ],
  },
  {
    label: "Quality & Design",
    links: [
      { name: "Test Lab", href: "/dashboard/dev/tests", icon: FlaskConical },
      { name: "Architecture", href: "/dashboard/dev/architecture", icon: Compass },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { role, isLoaded } = useRole();
  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials = getInitials(session?.user?.name, session?.user?.email);
  const isSettingsActive = pathname === "/dashboard/settings";
  const teamMode = isTeamRole(role);

  useEffect(() => {
    if (!isLoaded) return;
    if (teamMode && pathname === "/dashboard") {
      router.replace(ROLE_HOME[role]);
    }
  }, [teamMode, isLoaded, pathname, router, role]);

  const isLinkActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard/dev" && href !== "/dashboard" && pathname.startsWith(href));

  return (
    <aside className="w-64 border-r-2 border-foreground/10 bg-[#fdfdfc] flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6 shrink-0">
        <Link href={teamMode ? ROLE_HOME[role] : "/dashboard"} className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center group-hover:bg-purple transition-colors">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tighter">taskshift.</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto space-y-4 mt-2">
        {teamMode ? (
          teamSections.map((section) => (
            <div key={section.label}>
              <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-3 text-sm ${
                        isActive
                          ? "bg-foreground/5 text-foreground"
                          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {personalLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 text-sm ${
                    isActive
                      ? "bg-foreground/5 text-foreground"
                      : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {link.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t-2 border-foreground/10 flex items-center justify-between gap-2 shrink-0">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-purple-soft border-2 border-purple flex items-center justify-center font-bold text-sm text-purple shrink-0 overflow-hidden">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="text-sm font-medium truncate">{displayName}</div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/dashboard/settings"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isSettingsActive
                ? "bg-foreground/10 text-foreground"
                : "hover:bg-foreground/5 text-foreground/70"
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <LogoutButton variant="sidebar" showIcon label="Log out" />
        </div>
      </div>
    </aside>
  );
}
