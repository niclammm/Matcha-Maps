"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import type { MergedShop } from "@/lib/types";

const ARC_TEXT = "NEW JOURNAL ENTRY · MATCHA MAPS SG ·";

/** Sits at the centre of the hero photo ring -- a postmark/cancellation-stamp
 * button that opens the add-restaurant flow directly from the homepage.
 * Idle, it breathes and the type ring turns slowly; on hover/focus the ring
 * solidifies, the type spins up, washi tape slides in, and the bowl's plus
 * turns into... a bowl. */
export function HeroAddButton() {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const arcId = useId();

  function handleAdded(shop: MergedShop) {
    // Wishlisting happens inside CafeDrawer itself (addCafe(input,
    // "wishlist")) -- see CafesProvider.addCafe.
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
          <span className="hero-add-btn-ring" aria-hidden="true" />
          <span className="hero-add-btn-perf" aria-hidden="true" />

          <svg className="hero-add-btn-type" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <defs>
              <path id={arcId} d="M100 26 a74 74 0 1 1 -0.1 0" />
            </defs>
            <text fontSize={10.5} fontWeight={600} letterSpacing={3.4} fill="currentColor">
              <textPath href={`#${arcId}`} startOffset="0" textLength={462} lengthAdjust="spacing">
                {ARC_TEXT}
              </textPath>
            </text>
          </svg>

          <span className="hero-add-btn-tape hero-add-btn-tape--tl" aria-hidden="true" />
          <span className="hero-add-btn-tape hero-add-btn-tape--br" aria-hidden="true" />

          <span className="hero-add-btn-core">
            <svg className="hero-add-btn-bowl" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <path d="M9 30 H43 C43 42 36 48 26 48 C16 48 9 42 9 30 Z" fill="var(--matcha)" />
              <ellipse cx={26} cy={30} rx={17} ry={3.6} fill="var(--matcha-light)" />
              <path
                className="hero-add-btn-plus"
                d="M26 8 V22 M19 15 H33"
                stroke="var(--matcha-dark)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </svg>
            <p className="hero-add-btn-label">LOG A CUP</p>
          </span>
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
