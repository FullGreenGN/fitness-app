import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft, Database, Loader2, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/settings/privacy")({
	component: PrivacyPage,
});

// ─── Shared field style ───────────────────────────────────────────────────────

const INPUT_CLS =
	"w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50";

// ─── Page ─────────────────────────────────────────────────────────────────────

function PrivacyPage() {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();

	const createdAt = session?.user.createdAt
		? new Date(session.user.createdAt).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: "—";

	// ── Delete account flow ───────────────────────────────────────────────────
	const [showDelete, setShowDelete] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteConfirmText, setDeleteConfirmText] = useState("");
	const [deleting, setDeleting] = useState(false);

	async function handleDeleteAccount() {
		if (deleteConfirmText !== "DELETE") return;
		setDeleting(true);
		try {
			const { error } = await (authClient as any).deleteUser({ password: deletePassword });
			if (error) {
				toast.error(error.message ?? "Failed to delete account");
			} else {
				toast.success("Account deleted");
				navigate({ to: "/login" });
			}
		} finally {
			setDeleting(false);
		}
	}

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
						<h1 className="text-base font-bold leading-tight">Privacy</h1>
						<p className="text-xs text-muted-foreground">Data & security</p>
					</div>
				</div>
			</div>

			<div className="space-y-6 p-4 pb-24">
				{/* Account info */}
				<div className="space-y-3">
					<h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
						Your Account
					</h2>
					<div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card">
						{[
							{
								icon: Lock,
								label: "Email",
								value: session?.user.email ?? "—",
							},
							{
								icon: Shield,
								label: "Member since",
								value: createdAt,
							},
						].map(({ icon: Icon, label, value }) => (
							<div key={label} className="flex items-center gap-3.5 px-4 py-3.5">
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
									<Icon className="h-4 w-4 text-muted-foreground" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs text-muted-foreground">{label}</p>
									<p className="truncate text-sm font-medium">{value}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Data section */}
				<div className="space-y-3">
					<h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
						Your Data
					</h2>
					<div className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border bg-card">
						<div className="flex items-center gap-3.5 px-4 py-3.5">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
								<Database className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium">What we store</p>
								<p className="text-xs text-muted-foreground">
									Workouts, sets, nutrition logs, body measurements
								</p>
							</div>
						</div>

						<div className="space-y-1 px-4 py-3">
							<p className="text-xs text-muted-foreground">
								Your data is stored securely and never sold to third parties. All workout
								and nutrition data is private to your account.
							</p>
						</div>
					</div>
				</div>

				{/* Danger zone */}
				<div className="space-y-3">
					<h2 className="px-1 text-[11px] font-semibold uppercase tracking-widest text-red-400/70">
						Danger Zone
					</h2>

					{!showDelete ? (
						<button
							type="button"
							onClick={() => setShowDelete(true)}
							className="flex w-full items-center gap-3.5 overflow-hidden rounded-2xl border border-destructive/25 bg-card px-4 py-3.5 text-left transition-colors hover:bg-destructive/5 active:bg-destructive/10"
						>
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
								<AlertTriangle className="h-4 w-4 text-destructive" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-destructive">Delete Account</p>
								<p className="text-xs text-muted-foreground">
									Permanently remove your account and all data
								</p>
							</div>
						</button>
					) : (
						<div className="space-y-4 overflow-hidden rounded-2xl border border-destructive/30 bg-card p-4">
							<div className="flex items-start gap-3">
								<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
								<div className="space-y-1">
									<p className="text-sm font-bold text-destructive">
										This cannot be undone
									</p>
									<p className="text-xs text-muted-foreground">
										All your workouts, sets, nutrition logs, and measurements will be
										permanently deleted. This action is irreversible.
									</p>
								</div>
							</div>

							<div className="space-y-3">
								<div>
									<label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
										Your password
									</label>
									<input
										type="password"
										value={deletePassword}
										onChange={(e) => setDeletePassword(e.target.value)}
										placeholder="Enter your password to confirm"
										className={INPUT_CLS}
									/>
								</div>
								<div>
									<label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
										Type <span className="text-destructive">DELETE</span> to confirm
									</label>
									<input
										type="text"
										value={deleteConfirmText}
										onChange={(e) => setDeleteConfirmText(e.target.value)}
										placeholder="DELETE"
										className={INPUT_CLS}
									/>
								</div>
							</div>

							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => {
										setShowDelete(false);
										setDeletePassword("");
										setDeleteConfirmText("");
									}}
									className="flex flex-1 items-center justify-center rounded-xl bg-muted py-2.5 text-sm font-semibold transition-transform active:scale-[0.98]"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => void handleDeleteAccount()}
									disabled={
										deleting ||
										deleteConfirmText !== "DELETE" ||
										!deletePassword
									}
									className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
								>
									{deleting ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Deleting…
										</>
									) : (
										"Delete Account"
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
