import { AppProviders } from "@/components/providers/AppProviders";
import { getAllCafes } from "@/lib/cafe-repo";

// This is a shared, live, two-person journal, not a static site -- every
// request should see the other person's latest edits, not a snapshot
// frozen at the last deploy.
export const dynamic = "force-dynamic";

// Deliberately scoped to this route group, not the root layout: /login sits
// outside it specifically so an unauthenticated visitor's request never
// triggers a fetch of the (private, shared) cafe catalog in the first
// place -- not just so it isn't rendered, but so it's never serialized into
// that page's response at all.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const initialCafes = await getAllCafes().catch((err) => {
    console.error("Failed to load cafes for initial render:", err);
    return [];
  });

  return <AppProviders initialCafes={initialCafes}>{children}</AppProviders>;
}
