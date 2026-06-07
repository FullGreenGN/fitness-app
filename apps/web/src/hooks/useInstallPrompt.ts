import { useEffect, useState } from "react";

// The beforeinstallprompt event is not in the standard TS DOM types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Module-level capture so the event is never missed, even if it fires before
// the hook mounts (common on fast connections or repeat visits).
let _deferred: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferred = e as BeforeInstallPromptEvent;
  });
}

export function useInstallPrompt() {
  // Initialise from the module-level capture so the button is visible immediately
  // if the event already fired.
  const [canInstall, setCanInstall] = useState(() => !!_deferred);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      _deferred = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    }
    function onInstalled() {
      _deferred = null;
      setCanInstall(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!_deferred) return;
    await _deferred.prompt();
    const { outcome } = await _deferred.userChoice;
    if (outcome === "accepted") {
      _deferred = null;
      setCanInstall(false);
    }
  }

  return { canInstall, triggerInstall };
}
