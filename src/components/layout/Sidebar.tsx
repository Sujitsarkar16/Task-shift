"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Home, Settings, Activity, NotebookPen, CreditCard } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/dashboard", icon: Home },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckCircle2 },
    { name: "Habits", href: "/dashboard/habits", icon: Activity },
    { name: "Notes", href: "/dashboard/notes", icon: NotebookPen },
    { name: "Subscriptions", href: "/dashboard/subscriptions", icon: CreditCard },
  ];

  return (
    <aside className="w-64 border-r-2 border-foreground/10 bg-[#fdfdfc] flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center group-hover:bg-purple transition-colors">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tighter">taskshift.</span>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-6">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.name}
              href={link.href} 
              className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 text-sm ${isActive ? 'bg-foreground/5 text-foreground' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'}`}
            >
              <Icon className="w-4 h-4" /> {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t-2 border-foreground/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-soft border-2 border-purple flex items-center justify-center font-bold text-sm text-purple">
            TS
          </div>
          <div className="text-sm font-medium">Team Space</div>
        </div>
        <button className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-foreground/70 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
