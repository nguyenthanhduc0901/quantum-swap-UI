"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Settings = {
  slippageTolerance: number; // percent
  deadlineMinutes: number;
  setSlippageTolerance: (v: number) => void;
  setDeadlineMinutes: (v: number) => void;
};

const SettingsContext = createContext<Settings | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [slippageTolerance, setSlippageToleranceState] = useState<number>(0.5);
  const [deadlineMinutes, setDeadlineMinutesState] = useState<number>(30);

  useEffect(() => {
    try {
      const s = localStorage.getItem("qs_slippage");
      const d = localStorage.getItem("qs_deadline");
      if (s) setSlippageToleranceState(Number(s));
      if (d) setDeadlineMinutesState(Number(d));
    } catch {}
  }, []);

  const setSlippageTolerance = (v: number) => {
    setSlippageToleranceState(v);
    try { localStorage.setItem("qs_slippage", String(v)); } catch {}
  };
  const setDeadlineMinutes = (v: number) => {
    setDeadlineMinutesState(v);
    try { localStorage.setItem("qs_deadline", String(v)); } catch {}
  };

  const value = useMemo<Settings>(() => ({ slippageTolerance, deadlineMinutes, setSlippageTolerance, setDeadlineMinutes }), [slippageTolerance, deadlineMinutes]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}


