"use client";

import { useCallback, useState } from "react";
import { WishListMark } from "@/components/brand/WishListMark";
import { TastedMark } from "@/components/brand/TastedMark";
import { useCafes } from "@/components/providers/CafesProvider";

type CafeStatusButtonProps = {
  slug: string;
  cafeName?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
  /** Fires after a Wish List -> Tasted move, so a card (which has no drawer
   * of its own) can open one for photos/rating/comment. Never fires for the
   * Tasted -> Wish List direction, which doesn't need that capture step. */
  onMarkedTasted?: () => void;
};

/** A cafe lives in exactly one list at a time. This single button reflects
 * and drives that: neither -> Wish List -> Tasted -> back to Wish List.
 * Reads/writes the shared `status` field directly (one `updateCafe` call
 * per click) rather than composing two independent toggles -- with Wish
 * List and Tasted now backed by one field instead of two localStorage
 * stores, two separate toggle calls in the same click would race against
 * each other's stale closures. */
export function CafeStatusButton({
  slug,
  cafeName,
  showLabel = false,
  size = "md",
  className = "",
  onMarkedTasted,
}: CafeStatusButtonProps) {
  const { getBySlug, updateCafe } = useCafes();
  const status = getBySlug(slug)?.status ?? null;
  const wishlisted = status === "wishlist";
  const tasted = status === "tasted";
  const [cheers, setCheers] = useState(false);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      setCheers(true);
      window.setTimeout(() => setCheers(false), 450);

      if (tasted) {
        updateCafe(slug, { status: "wishlist" });
      } else if (wishlisted) {
        updateCafe(slug, { status: "tasted" });
        onMarkedTasted?.();
      } else {
        updateCafe(slug, { status: "wishlist" });
      }
    },
    [tasted, wishlisted, slug, updateCafe, onMarkedTasted],
  );

  const statusClass = tasted ? " cafe-status-btn--tasted" : wishlisted ? " cafe-status-btn--wishlisted" : "";
  const label = tasted
    ? `Move ${cafeName ?? "this"} back to Wish List`
    : wishlisted
      ? `Mark ${cafeName ?? "this"} as tasted`
      : `Add ${cafeName ?? "this"} to Wish List`;
  const buttonText = tasted ? "Move to Wish List" : wishlisted ? "Mark as tasted" : "Add to Wish List";
  const markSize = size === "sm" ? { wishlist: 26, tasted: 15 } : { wishlist: 34, tasted: 20 };

  return (
    <button
      type="button"
      className={`cafe-status-btn cafe-status-btn--${size}${statusClass}${cheers ? " cafe-status-btn--cheers" : ""} ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
    >
      {tasted ? (
        <TastedMark size={markSize.tasted} className="cafe-status-mark" decorative />
      ) : (
        <WishListMark size={markSize.wishlist} className="cafe-status-mark" dim={!wishlisted} decorative />
      )}
      {showLabel && <span className="cafe-status-btn-label">{buttonText}</span>}
    </button>
  );
}
