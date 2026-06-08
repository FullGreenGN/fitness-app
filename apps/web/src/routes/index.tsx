import { Button } from "@fitness-app/ui/components/button";
import { Card, CardContent } from "@fitness-app/ui/components/card";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  Dumbbell,
  Layers,
  ScanLine,
  WifiOff,
  Zap,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) throw redirect({ to: "/dashboard" });
  },
  component: LandingPage,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SocialProofSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-400">
            <Dumbbell className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">GymTracker</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-zinc-400 hover:text-zinc-50"
            >
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="sm"
              className="rounded-lg bg-orange-500 text-white hover:bg-orange-400"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-14">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-amber-500/8 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-orange-600/6 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Eyebrow badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5">
          <Zap className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-xs font-semibold tracking-wide text-orange-300">
            Offline-First · PWA · Free
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Your Ultimate{" "}
          <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            Offline-First
          </span>{" "}
          Gym &amp; Nutrition Tracker.
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-400">
          Track workouts, scan food, and visualize progress — all in one app.
          Built for the gym floor.{" "}
          <span className="text-zinc-300">Works without Wi-Fi.</span>
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link to="/login">
            <Button
              size="lg"
              className="group h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-8 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/40 hover:brightness-110"
            >
              Start Tracking Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <a href="#features">
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-white/10 bg-white/5 px-8 text-sm font-semibold text-zinc-300 backdrop-blur hover:bg-white/10 hover:text-zinc-50"
            >
              See Features
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>

        {/* Trust bullets */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {["No credit card", "Works offline", "Open-source DB"].map((item) => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Check className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.5} />
              {item}
            </div>
          ))}
        </div>

        {/* Mock dashboard card */}
        <div className="relative mt-16 w-full max-w-sm">
          {/* Glow behind the card */}
          <div className="absolute inset-0 rounded-3xl bg-orange-500/10 blur-2xl" />
          <MockDashboardCard />
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-zinc-600">
        <ChevronDown className="h-5 w-5" />
      </div>
    </section>
  );
}

// ─── Mock dashboard card ──────────────────────────────────────────────────────

function MockDashboardCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-zinc-900 p-5 shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Push Day A
          </p>
          <p className="mt-0.5 text-base font-bold">Morning Workout</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15">
          <Zap className="h-5 w-5 text-orange-400" strokeWidth={2.5} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 space-y-1.5">
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>Progress</span>
          <span>4 / 6 sets</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-[67%] rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
        </div>
      </div>

      {/* Exercise rows */}
      <div className="space-y-2">
        {[
          { name: "Barbell Bench Press", sets: "4×8", done: true },
          { name: "Incline Dumbbell Press", sets: "3×10", done: false },
          { name: "Cable Fly", sets: "3×12", done: false },
        ].map((ex) => (
          <div
            key={ex.name}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
              ex.done ? "bg-white/5" : "bg-zinc-800/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  ex.done
                    ? "border-orange-500 bg-orange-500"
                    : "border-zinc-600"
                }`}
              >
                {ex.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
              <span
                className={`text-xs font-semibold ${
                  ex.done ? "text-zinc-500 line-through" : "text-zinc-200"
                }`}
              >
                {ex.name}
              </span>
            </div>
            <span className="text-[10px] font-bold tabular-nums text-zinc-500">
              {ex.sets}
            </span>
          </div>
        ))}
      </div>

      {/* Rest timer pill */}
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 py-2">
        <Zap className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-xs font-bold tabular-nums text-orange-300">Rest: 01:12</span>
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: WifiOff,
    title: "Offline First",
    description:
      "No more loading spinners at the gym. All your data syncs silently in the background — you keep training.",
    gradient: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  {
    icon: Layers,
    title: "3D Muscle Maps",
    description:
      "See exactly which muscles you trained today. Interactive body maps highlight every group you've hit.",
    gradient: "from-orange-500/20 to-amber-500/10",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
  },
  {
    icon: ScanLine,
    title: "Barcode Scanning",
    description:
      "Log meals in seconds. Scan any food barcode and the full nutrition info fills in automatically.",
    gradient: "from-emerald-500/20 to-green-500/10",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
] as const;

function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-500">
            Built Different
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              reach your goals
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Three features that make GymTracker the only fitness app that works
            as hard as you do.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, gradient, iconColor, iconBg }) => (
            <Card
              key={title}
              className={`group relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br ${gradient} bg-zinc-900 transition-transform duration-300 hover:-translate-y-1`}
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-base font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* More features list */}
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Activity, label: "Performance Tracking" },
            { icon: Dumbbell, label: "2,000+ Exercises" },
            { icon: Zap, label: "Smart Rest Timers" },
            { icon: ScanLine, label: "Open Food Facts DB" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <Icon className="h-4 w-4 text-orange-400" strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-zinc-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social proof ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "2,000+", label: "Exercises in library" },
  { value: "100%", label: "Offline capable" },
  { value: "5 tabs", label: "All in one place" },
  { value: "Free", label: "Forever, no paywall" },
] as const;

function SocialProofSection() {
  return (
    <section className="border-y border-white/5 bg-white/[0.015] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-3xl font-extrabold tabular-nums text-transparent sm:text-4xl">
                {value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTASection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 px-8 py-14 text-center">
          {/* Orb */}
          <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/30">
              <Dumbbell className="h-7 w-7 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to start training smarter?
            </h2>
            <p className="mt-4 text-zinc-400">
              Create your free account in seconds. No credit card required.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className="group h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-10 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:brightness-110"
                >
                  Start Tracking Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 rounded-xl text-zinc-400 hover:text-zinc-50"
                >
                  Sign in to existing account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-400">
            <Dumbbell className="h-3 w-3 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-zinc-500">GymTracker</span>
        </div>
        <p className="text-xs text-zinc-600">
          Built offline-first. Train anywhere.
        </p>
      </div>
    </footer>
  );
}
