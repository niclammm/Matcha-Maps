"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import type { MergedShop } from "@/lib/types";

/** Sits at the centre of the hero photo ring -- a big plus button that opens
 * the add-restaurant flow directly from the homepage, in place of the old
 * decorative whisk-illustration placeholder. */
export function HeroAddButton() {
  const router = useRouter();
  const { isSaved, toggleSave } = useSavedCafes();
  const [addOpen, setAddOpen] = useState(false);

  function handleAdded(shop: MergedShop) {
    if (!isSaved(shop.slug)) toggleSave(shop.slug);
    setAddOpen(false);
    router.push(`/map?cafe=${shop.slug}`);
  }

  return (
    <>
      <div className="hero-add-btn">
        <button
          type="button"
          className="hero-add-btn-inner"
          onClick={() => setAddOpen(true)}
          aria-label="Log a new journal entry"
        >
          <svg className="hero-add-btn-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M24 10 V38 M10 24 H38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="hero-add-btn-label">New journal entry</p>
        </button>
      </div>

      {addOpen &&
        typeof document !== "undefined" &&
        createPortal(
          // Portalled straight to <body> -- this button lives deep inside
          // .hero-stage, which sets pointer-events: none so its decorative
          // photo ring never blocks clicks. That's an inherited property, so
          // rendering the drawer as a plain DOM descendant here left it
          // inheriting pointer-events: none too (invisible to clicks despite
          // its own z-index). Portalling to <body> escapes that ancestor's
          // inheritance chain entirely, and also matches how /map and /list
          // already render this same drawer as a page-top-level sibling.
          <CafeDrawer
            mode="add"
            shop={null}
            onClose={() => setAddOpen(false)}
            onRequestEdit={() => {}}
            onSaved={handleAdded}
            onRemoved={() => setAddOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}
