"use client";

import type { ReactNode } from "react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { CafesProvider } from "@/components/providers/CafesProvider";
import { SavedCafesProvider } from "@/components/providers/SavedCafesProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CafesProvider>
      <SavedCafesProvider>
        {children}
        <FloatingNav />
      </SavedCafesProvider>
    </CafesProvider>
  );
}
