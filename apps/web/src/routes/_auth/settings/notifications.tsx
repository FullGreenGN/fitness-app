import { Link, createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, ChevronLeft, Dumbbell, Timer, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/settings/notifications")({
	component: NotificationsPage,
});

// ─── Permission helpers ───────────────────────────────────────────────────────

type PermissionStatus = "granted" | "denied" | "default" | "unsupported";

function getPermission(): PermissionStatus {
	if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
	return Notification.permission;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function NotificationsPage() {
	const [permission, setPermission] = useState<PermissionStatus>(getPermission);

	useEffect(() => {
		setPermission(getPermission());
	}, []);

	async function requestPermission() {
		if (!("Notification" in window)) return;
		const result = await Notification.requestPermission();
		setPermission(result);
		if (result === "granted") toast.success("Notifications enabled!");
		else if (result === "denied") toast.error("Notifications blocked. Enable them in browser settings.");
	}

	function sendTestNotification() {
		if (Notification.permission !== "granted") return;
		new Notification("GymTracker", {
			body: "Notifications are working! Time to crush it.",
			icon: "/icon-192.png",
			badge: "/icon-192.png",
		});
	}

	const statusConfig = {
		granted: {
			label: "Enabled",
			description: "You'll receive notifications from GymTracker.",
			color: "text-green-400",
			bg: "bg-green-500/10",
			ring: "ring-green-500/20",
			icon: Bell,
		},
		denied: {
			label: "Blocked",
			description: "Notifications are blocked by your browser. Open browser settings to re-enable them.",
			color: "text-red-400",
			bg: "bg-red-500/10",
			ring: "ring-red-500/20",
			icon: BellOff,
		},
		default: {
			label: "Not set",
			description: "Tap below to enable notifications and receive workout reminders.",
			color: "text-muted-foreground",
			bg: "bg-muted/50",
			ring: "ring-border",
			icon: Bell,
		},
		unsupported: {
			label: "Not supported",
			description: "Your browser doesn't support notifications.",
			color: "text-muted-foreground",
			bg: "bg-muted/50",
			ring: "ring-border",
			icon: BellOff,
		},
	} as const;

	const status = statusConfig[permission];
	const StatusIcon = status.icon;

	return (
		<div className="min-h-full bg-background">
			{/* Header */}
			<div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
				<div className="flex items-center gap-3 px-4 py-3">
					<Link
						to="/settings"
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
					>
						<ChevronLeft className="h-4 w-4" />
					</Link>
					<div>
						<h1 className="text-base font-bold leading-tight">Notifications</h1>
						<p className="text-xs text-muted-foreground">Workout reminders & alerts</p>
					</div>
				</div>
			</div>

			<div className="space-y-6 p-4 pb-24">
				{/* Status card */}
				<div
					className={`flex items-center gap-4 rounded-2xl p-4 ring-1 ${status.bg} ${status.ring}`}
				>
					<div
						className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background/60 ${status.color}`}
					>
						<StatusIcon className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
						<p className="mt-0.5 text-xs text-muted-foreground">{status.description}</p>
					</div>
				</div>

				{/* Actions */}
				{permission === "default" && (
					<button
						type="button"
						onClick={() => void requestPermission()}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98]"
					>
						<Bell className="h-4 w-4" />
						Enable Notifications
					</button>
				)}

				{permission === "granted" && (
					<button
						type="button"
						onClick={sendTestNotification}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3.5 text-sm font-semibold transition-transform active:scale-[0.98]"
					>
						<Bell className="h-4 w-4" />
						Send Test Notification
					</button>
				)}

				{permission === "denied" && (
					<div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground space-y-1">
						<p className="font-semibold text-foreground">How to re-enable</p>
						<p>1. Open your browser settings</p>
						<p>2. Go to Site Settings → Notifications</p>
						<p>3. Find this site and change to "Allow"</p>
					</div>
				)}

				{/* What you'll get */}
				<div className="space-y-3">
					<h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
						What you'll get
					</h2>
					<div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card">
						{[
							{
								icon: Dumbbell,
								label: "Workout reminders",
								desc: "Daily reminders to stay consistent",
							},
							{
								icon: Timer,
								label: "Rest timer alerts",
								desc: "Know when your rest period is up",
							},
							{
								icon: Trophy,
								label: "Personal records",
								desc: "Celebrate when you hit a new PR",
							},
						].map(({ icon: Icon, label, desc }) => (
							<div key={label} className="flex items-center gap-3.5 px-4 py-3.5">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
									<Icon className="h-4 w-4 text-muted-foreground" />
								</div>
								<div>
									<p className="text-sm font-medium">{label}</p>
									<p className="text-xs text-muted-foreground">{desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
