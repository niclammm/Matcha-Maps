"use client";

import type { ReactNode } from "react";
import { FloatingNav } from "@/components/layout/FloatingNav";
import { CafesProvider } from "@/components/providers/CafesProvider";
import { SavedCafesProvider } from "@/components/providers/SavedCafesProvider";
import { TriedCafesProvider } from "@/components/providers/TriedCafesProvider";
import { SyncErrorBanner } from "@/components/providers/SyncErrorBanner";
import type { MergedShop } from "@/lib/types";

export function AppProviders({ children, initialCafes }: { children: ReactNode; initialCafes: MergedShop[] }) {
  return (
    <CafesProvider initialCafes={initialCafes}>
      <SavedCafesProvider>
        <TriedCafesProvider>
          {children}
          <FloatingNav />
          <SyncErrorBanner />
        </TriedCafesProvider>
      </SavedCafesProvider>
    </CafesProvider>
  );
}
