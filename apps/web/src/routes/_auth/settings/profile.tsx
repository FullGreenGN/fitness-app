import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/settings/profile")({
	component: ProfilePage,
});

// ─── Shared field styles ──────────────────────────────────────────────────────

const INPUT_CLS =
	"w-full rounded-xl border border-border bg-input/60 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 disabled:opacity-50";

function FieldLabel({ children }: { children: React.ReactNode }) {
	return (
		<label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
			{children}
		</label>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="space-y-4">
			<h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
				{title}
			</h2>
			<div className="space-y-4 rounded-2xl border border-border bg-card p-4">{children}</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProfilePage() {
	const { data: session } = authClient.useSession();

	const userName = session?.user.name ?? "";
	const userEmail = session?.user.email ?? "";
	const initials = (userName || "A")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	// ── Display name ─────────────────────────────────────────────────────────
	const [name, setName] = useState(userName);
	const [savingName, setSavingName] = useState(false);

	useEffect(() => {
		if (userName) setName(userName);
	}, [userName]);

	async function handleSaveName() {
		const trimmed = name.trim();
		if (!trimmed || trimmed === userName) return;
		setSavingName(true);
		try {
			const { error } = await (authClient as any).updateUser({ name: trimmed });
			if (error) toast.error(error.message ?? "Failed to update name");
			else toast.success("Name updated!");
		} finally {
			setSavingName(false);
		}
	}

	// ── Change password ──────────────────────────────────────────────────────
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [savingPassword, setSavingPassword] = useState(false);

	async function handleChangePassword() {
		if (newPassword !== confirmPassword) {
			toast.error("New passwords don't match");
			return;
		}
		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}
		setSavingPassword(true);
		try {
			const { error } = await (authClient as any).changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (error) toast.error(error.message ?? "Incorrect current password");
			else {
				toast.success("Password changed!");
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			}
		} finally {
			setSavingPassword(false);
		}
	}

	const nameDirty = name.trim() && name.trim() !== userName;

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
						<h1 className="text-base font-bold leading-tight">Profile</h1>
						<p className="text-xs text-muted-foreground">Name & password</p>
					</div>
				</div>
			</div>

			<div className="space-y-6 p-4 pb-24">
				{/* Avatar */}
				<div className="flex flex-col items-center gap-3 py-4">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground/10 text-2xl font-bold text-foreground ring-2 ring-border">
						{initials}
					</div>
					<div className="text-center">
						<p className="font-semibold">{userName || "Athlete"}</p>
						<p className="text-xs text-muted-foreground">{userEmail}</p>
					</div>
				</div>

				{/* Display name */}
				<Section title="Display Name">
					<div>
						<FieldLabel>Name</FieldLabel>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className={INPUT_CLS}
						/>
					</div>
					<button
						type="button"
						onClick={handleSaveName}
						disabled={savingName || !nameDirty}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98] disabled:opacity-50"
					>
						{savingName ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Saving…
							</>
						) : (
							"Save Name"
						)}
					</button>
				</Section>

				{/* Change password */}
				<Section title="Change Password">
					<div>
						<FieldLabel>Current Password</FieldLabel>
						<input
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							placeholder="••••••••"
							autoComplete="current-password"
							className={INPUT_CLS}
						/>
					</div>
					<div>
						<FieldLabel>New Password</FieldLabel>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Min. 8 characters"
							autoComplete="new-password"
							className={INPUT_CLS}
						/>
					</div>
					<div>
						<FieldLabel>Confirm New Password</FieldLabel>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="••••••••"
							autoComplete="new-password"
							className={INPUT_CLS}
						/>
						{confirmPassword && newPassword !== confirmPassword && (
							<p className="mt-1 text-xs text-red-400">Passwords don't match</p>
						)}
					</div>
					<button
						type="button"
						onClick={handleChangePassword}
						disabled={
							savingPassword ||
							!currentPassword ||
							!newPassword ||
							!confirmPassword ||
							newPassword !== confirmPassword
						}
						className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-bold text-background transition-transform active:scale-[0.98] disabled:opacity-50"
					>
						{savingPassword ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Changing…
							</>
						) : (
							"Change Password"
						)}
					</button>
				</Section>
			</div>
		</div>
	);
}
