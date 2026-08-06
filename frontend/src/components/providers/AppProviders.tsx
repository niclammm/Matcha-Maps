"use client";

import type { ReactNode } from "react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { SavedCafesProvider } from "@/components/providers/SavedCafesProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SavedCafesProvider>
      {children}
      <FloatingNav />
    </SavedCafesProvider>
  );
}
