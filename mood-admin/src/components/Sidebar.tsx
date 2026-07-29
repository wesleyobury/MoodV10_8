"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  TrendingUp,
  Repeat,
  Dumbbell,
  Heart,
  Search,
  Settings,
  LogOut,
  Users,
  Download,
  CreditCard,
  UserPlus,
  Rocket,
  DollarSign,
} from "lucide-react";

/**
 * Consolidated navigation: 3 clear groups instead of 11 flat tabs.
 * Analytics = the numbers; Explore = per-user digging; Admin = actions/config.
 */
const navSections: {
  title: string;
  items: { href: string; label: string; description: string; icon: React.ElementType }[];
}[] = [
  {
    title: "Analytics",
    items: [
      {
        href: "/overview",
        label: "Overview",
        description: "The headline numbers",
        icon: LayoutDashboard,
      },
      {
        href: "/growth",
        label: "Growth",
        description: "Signups, activation, funnels",
        icon: TrendingUp,
      },
      {
        href: "/acquisition",
        label: "Acquisition",
        description: "Store funnel: download → paid",
        icon: Download,
      },
      {
        href: "/onboarding",
        label: "Onboarding",
        description: "First-run funnel & drop-off",
        icon: Rocket,
      },
      {
        href: "/monetization",
        label: "Monetization",
        description: "Trials, subscriptions, revenue",
        icon: DollarSign,
      },
      {
        href: "/engagement",
        label: "Engagement",
        description: "Retention & workout quality",
        icon: Repeat,
      },
      {
        href: "/content",
        label: "Content",
        description: "Moods, equipment, exercises",
        icon: Dumbbell,
      },
      {
        href: "/social",
        label: "Social",
        description: "Posts, likes, community",
        icon: Heart,
      },
    ],
  },
  {
    title: "Explore",
    items: [
      {
        href: "/users",
        label: "User Explorer",
        description: "Look up any user",
        icon: Search,
      },
      {
        href: "/subscribers",
        label: "Subscribers",
        description: "Who's paying (or comped)",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        href: "/admin",
        label: "Admin & Config",
        description: "Access, app config, ops",
        icon: Settings,
      },
      {
        href: "/creators",
        label: "Creators",
        description: "Applications & creator codes",
        icon: UserPlus,
      },
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
