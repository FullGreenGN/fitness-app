import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, Download, LogOut, Monitor, Moon, Shield, Sun, Target, User } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/settings/")({ component: SettingsPage });

function SettingsPage() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const { canInstall, triggerInstall } = useInstallPrompt();
	const { theme, setTheme } = useTheme();

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
			fetchOptions: { onSuccess: () => navigate({ to: "/login" }) },
		});
	}

	return (
		<div className="space-y-6 px-4 py-6 pb-24">
			<h1 className="text-3xl font-bold tracking-tight">Settings</h1>

			{/* Profile card */}
			<Link to="/settings/profile">
				<div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 transition-colors active:bg-muted/40">
					<div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xl font-bold text-foreground">
						{initials}
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold">{userName}</p>
						<p className="truncate text-xs text-muted-foreground">{userEmail}</p>
					</div>
					<ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
				</div>
			</Link>

			{/* Account section */}
			<div className="space-y-1.5">
				<h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
					Account
				</h2>
				<div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card">
					<Link
						to="/settings/account"
						className="flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted"
					>
						<Target className="h-5 w-5 shrink-0 text-orange-400" />
						<div className="flex-1">
							<p className="text-sm font-medium">Goals & Macros</p>
							<p className="text-xs text-muted-foreground">
								Height, weight, goal, diet & auto-calculated targets
							</p>
						</div>
						<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
					</Link>

					<Link
						to="/settings/profile"
						className="flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted"
					>
						<User className="h-5 w-5 shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium">Profile</p>
							<p className="text-xs text-muted-foreground">Name & password</p>
						</div>
						<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
					</Link>

					<Link
						to="/settings/notifications"
						className="flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted"
					>
						<Bell className="h-5 w-5 shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium">Notifications</p>
							<p className="text-xs text-muted-foreground">Workout reminders & alerts</p>
						</div>
						<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
					</Link>

					<Link
						to="/settings/privacy"
						className="flex w-full items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted"
					>
						<Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
						<div className="flex-1">
							<p className="text-sm font-medium">Privacy</p>
							<p className="text-xs text-muted-foreground">Data & security</p>
						</div>
						<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
					</Link>
				</div>
			</div>

			{/* Preferences */}
			<div className="space-y-1.5">
				<h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
					Preferences
				</h2>
				<div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card">
					{/* Appearance — inline theme toggle, no navigation needed */}
					<div className="flex items-center gap-3.5 px-4 py-3.5">
						{theme === "dark" ? (
							<Moon className="h-5 w-5 shrink-0 text-muted-foreground" />
						) : theme === "light" ? (
							<Sun className="h-5 w-5 shrink-0 text-muted-foreground" />
						) : (
							<Monitor className="h-5 w-5 shrink-0 text-muted-foreground" />
						)}
						<div className="flex-1">
							<p className="text-sm font-medium">Appearance</p>
						</div>
						{/* Three-way segmented control */}
						<div className="flex rounded-xl bg-muted p-0.5">
							{(
								[
									{ value: "light", icon: Sun },
									{ value: "system", icon: Monitor },
									{ value: "dark", icon: Moon },
								] as const
							).map(({ value, icon: Icon }) => (
								<button
									key={value}
									type="button"
									onClick={() => setTheme(value)}
									className={`flex h-7 w-8 items-center justify-center rounded-[10px] transition-all ${
										theme === value
											? "bg-card text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Icon className="h-3.5 w-3.5" />
								</button>
							))}
						</div>
					</div>

					{canInstall && (
						<button
							type="button"
							onClick={() => void triggerInstall()}
							className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 active:bg-muted"
						>
							<Download className="h-5 w-5 shrink-0 text-orange-400" />
							<div className="flex-1">
								<p className="text-sm font-medium">Install App</p>
								<p className="text-xs text-muted-foreground">Add to your home screen</p>
							</div>
							<span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
								PWA
							</span>
						</button>
					)}
				</div>
			</div>

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
