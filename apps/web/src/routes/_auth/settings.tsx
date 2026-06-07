import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Moon, Shield, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/settings")({ component: SettingsPage });

interface SettingItem {
  icon: LucideIcon;
  label: string;
  description: string;
}

const SECTIONS: { title: string; items: SettingItem[] }[] = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", description: "Name, photo, units" },
      { icon: Bell, label: "Notifications", description: "Workout reminders & alerts" },
      { icon: Shield, label: "Privacy", description: "Data & security" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Moon, label: "Appearance", description: "Dark / light mode" },
    ],
  },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const userName = session?.user.name ?? "Athlete";
  const userEmail = session?.user.email ?? "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleSignOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate({ to: "/login" }),
      },
    });
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      {/* Profile card */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xl font-bold text-foreground">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{userName}</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      {/* Setting sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1.5">
          <h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {section.title}
          </h2>
          <div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card">
            {section.items.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 active:bg-muted"
              >
                <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-card">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left text-destructive transition-colors hover:bg-destructive/5 active:bg-destructive/10"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>

      <p className="pb-2 text-center text-[10px] text-muted-foreground/40">
        GymTracker · v0.1.0
      </p>
    </div>
  );
}
