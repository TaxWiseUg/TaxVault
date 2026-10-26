"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallContextValue {
  available: boolean;
  install: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    } catch (error) {
      console.error("Could not open the TaxWise install prompt:", error);
    }
  }, [promptEvent]);

  return (
    <PwaInstallContext.Provider value={{ available: Boolean(promptEvent) && !installed, install }}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function InstallAppButton({ className = "" }: { className?: string }) {
  const context = useContext(PwaInstallContext);
  if (!context?.available) return null;

  return (
    <button type="button" className={`tw-install-app-button ${className}`.trim()} onClick={() => void context.install()}>
      <Download size={15} aria-hidden="true" />
      <span>Install App</span>
    </button>
  );
}
