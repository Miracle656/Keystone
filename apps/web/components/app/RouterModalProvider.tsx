"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { RouterModal, type RouterMode, type Destination } from "@/components/router/RouterModal";

const RouterModalContext = createContext<{ open: (mode: RouterMode, destination?: Destination) => void } | null>(null);

/** Shared across every (app) screen — each screen owns its own nav/theme (dark Trade terminal,
 * light Earn savings page, etc. per their own mockups), but the deposit/withdraw modal is the
 * same floating dark overlay everywhere, so its open/close state lives once at this level. */
export function RouterModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<RouterMode>(null);
  const [initialDestination, setInitialDestination] = useState<Destination>("TRADING");

  function open(mode: RouterMode, destination: Destination = "TRADING") {
    setInitialDestination(destination);
    setMode(mode);
  }

  return (
    <RouterModalContext.Provider value={{ open }}>
      {children}
      <RouterModal mode={mode} initialDestination={initialDestination} onClose={() => setMode(null)} />
    </RouterModalContext.Provider>
  );
}

export function useRouterModal() {
  const ctx = useContext(RouterModalContext);
  if (!ctx) throw new Error("useRouterModal must be used within RouterModalProvider");
  return ctx;
}
