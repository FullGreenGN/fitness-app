import { Link, Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { Activity, Apple, Dumbbell, Home, Settings, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RestTimer } from "@/components/RestTimer";
import { authClient } from "@/lib/auth-client";

// Redirect unauthenticated users before any protected route renders.
// beforeLoad runs on every navigation into /_auth — including child routes —
// so a single guard here protects /, /programs, /workout, and /settings.
export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: AuthLayout,
});

// ─── Bottom navigation ────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home, exact: true },
  { to: "/programs", label: "Programs", icon: Dumbbell, exact: false },
  { to: "/nutrition", label: "Nutrition", icon: Apple, exact: false },
  { to: "/performance", label: "Progress", icon: Activity, exact: false },
  { to: "/workout", label: "Live", icon: Zap, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
];

function BottomNav() {
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to as "/"}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors"
            >
              <Icon
                className={`h-6 w-6 transition-all duration-200 ${
                  isActive ? "scale-110 text-foreground" : "scale-100 text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Authenticated layout ────────────────────────────────────────────────────

function AuthLayout() {
  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <RestTimer />
      <BottomNav />
    </div>
  );
}
