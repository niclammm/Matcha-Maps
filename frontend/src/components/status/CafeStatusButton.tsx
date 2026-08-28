"use client";

import { useCallback, useState } from "react";
import { MatchaGlassIcon } from "@/components/icons/MatchaGlassIcon";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";

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
 * and drives that: neither -> Wish List -> Tasted -> back to Wish List. */
export function CafeStatusButton({
  slug,
  cafeName,
  showLabel = false,
  size = "md",
  className = "",
  onMarkedTasted,
}: CafeStatusButtonProps) {
  const { isSaved, toggleSave } = useSavedCafes();
  const { isTried, toggleTried } = useTriedCafes();
  const wishlisted = isSaved(slug);
  const tasted = isTried(slug);
  const [cheers, setCheers] = useState(false);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      setCheers(true);
      window.setTimeout(() => setCheers(false), 450);

      if (tasted) {
        toggleTried(slug);
        if (!wishlisted) toggleSave(slug);
      } else if (wishlisted) {
        toggleSave(slug);
        if (!tasted) toggleTried(slug);
        onMarkedTasted?.();
      } else {
        toggleSave(slug);
      }
    },
    [tasted, wishlisted, slug, toggleSave, toggleTried, onMarkedTasted],
  );

  const statusClass = tasted ? " cafe-status-btn--tasted" : wishlisted ? " cafe-status-btn--wishlisted" : "";
  const label = tasted
    ? `Move ${cafeName ?? "this"} back to Wish List`
    : wishlisted
      ? `Mark ${cafeName ?? "this"} as tasted`
      : `Add ${cafeName ?? "this"} to Wish List`;
  const buttonText = tasted ? "Move to Wish List" : wishlisted ? "Mark as tasted" : "Add to Wish List";

  return (
    <button
      type="button"
      className={`cafe-status-btn cafe-status-btn--${size}${statusClass}${cheers ? " cafe-status-btn--cheers" : ""} ${className}`.trim()}
      onClick={handleClick}
      aria-label={label}
    >
      <MatchaGlassIcon saved={wishlisted || tasted} className="matcha-glass-icon" />
      {showLabel && <span className="cafe-status-btn-label">{buttonText}</span>}
    </button>
  );
}
