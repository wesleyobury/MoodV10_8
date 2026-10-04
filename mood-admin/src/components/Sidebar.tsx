"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Activity,
  Rocket,
  Dumbbell,
  Repeat,
  DollarSign,
  Search,
  Settings,
  LogOut,
  Users,
} from "lucide-react";

/**
 * V3 founder dashboard (Oct 2026): seven pages, one per question about the V3 loop
 * (acquire, onboard, generate, start, complete, return, attempt #2, convert, retain), plus users and ops.
 * Old routes redirect here (next.config.mjs).
 */
const navSections: {
  title: string;
  items: { href: string; label: string; description: string; icon: React.ElementType }[];
}[] = [
  {
    title: "The loop",
    items: [
      { href: "/pulse", label: "Pulse", description: "How is MOOD doing right now?", icon: Activity },
      { href: "/activation", label: "Activation", description: "Signup to first finished workout", icon: Rocket },
      { href: "/workouts", label: "Workouts", description: "Generated, started, finished", icon: Dumbbell },
      { href: "/retention", label: "Retention", description: "Coming back, workout #2, habit", icon: Repeat },
      { href: "/revenue", label: "Revenue", description: "Workout #2 gate to paid", icon: DollarSign },
    ],
  },
  {
    title: "People & ops",
    items: [
      { href: "/users", label: "Users", description: "What did this person do?", icon: Search },
      { href: "/admin", label: "Admin & Ops", description: "Tracking health, access, config", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">MOOD Admin</h1>
        <p className="text-xs text-muted-foreground mt-1">Analytics Dashboard</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-start gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="flex flex-col">
                        <span>{item.label}</span>
                        <span
                          className={`text-[11px] font-normal ${
                            isActive ? "text-primary/70" : "text-muted-foreground/60"
                          }`}
                        >
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
