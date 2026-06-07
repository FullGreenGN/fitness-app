import { Button } from "@fitness-app/ui/components/button";
import { Input } from "@fitness-app/ui/components/input";
import { Label } from "@fitness-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

// Redirect away if already authenticated
export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (data) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

// ─── Page shell ───────────────────────────────────────────────────────────────

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-12">
      {/* Wordmark */}
      <div className="mb-8 flex items-center gap-3 select-none">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
          <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-black tracking-tight">GymTracker</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-6">
        {/* Mode toggle */}
        <div className="flex rounded-xl bg-muted p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Conditionally render form sections — each has its own useForm hook */}
        {mode === "signin" ? (
          <SignInSection />
        ) : (
          <SignUpSection onSuccess={() => setMode("signin")} />
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground/50">
        Your data stays yours.
      </p>
    </div>
  );
}

// ─── Shared field error component ────────────────────────────────────────────

function FieldError({ errors }: { errors: unknown[] }) {
  const msg = errors
    .map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
      return null;
    })
    .find(Boolean);
  if (!msg) return null;
  return <p className="text-[11px] text-destructive">{msg}</p>;
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

function SignInSection() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email"),
        password: z.string().min(8, "At least 8 characters"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => navigate({ to: "/" }),
          onError: (err) => {
            toast.error(err.error.message ?? "Sign in failed");
          },
        },
      );
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-medium">
              Email
            </Label>
            <Input
              id={field.name}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-xl border-0 bg-input/60 text-sm"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-medium">
              Password
            </Label>
            <Input
              id={field.name}
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="••••••••"
              className="h-10 rounded-xl border-0 bg-input/60 text-sm"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button
            type="submit"
            className="mt-1 w-full rounded-xl font-semibold"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

function SignUpSection({ onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "At least 2 characters"),
        email: z.email("Enter a valid email"),
        password: z.string().min(8, "At least 8 characters"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        { name: value.name, email: value.email, password: value.password },
        {
          onSuccess: () => {
            toast.success("Account created — welcome!");
            navigate({ to: "/" });
          },
          onError: (err) => {
            toast.error(err.error.message ?? "Sign up failed");
          },
        },
      );
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-medium">
              Name
            </Label>
            <Input
              id={field.name}
              autoComplete="name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Alex"
              className="h-10 rounded-xl border-0 bg-input/60 text-sm"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-medium">
              Email
            </Label>
            <Input
              id={field.name}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-xl border-0 bg-input/60 text-sm"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name} className="text-xs font-medium">
              Password
            </Label>
            <Input
              id={field.name}
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="min. 8 characters"
              className="h-10 rounded-xl border-0 bg-input/60 text-sm"
            />
            <FieldError errors={field.state.meta.errors} />
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Button
            type="submit"
            className="mt-1 w-full rounded-xl font-semibold"
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create Account"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
