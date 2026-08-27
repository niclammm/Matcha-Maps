"use client";

import { useCallback, useState } from "react";
import { MatchaGlassIcon } from "@/components/icons/MatchaGlassIcon";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";

type MarkTriedButtonProps = {
  slug: string;
  cafeName?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function MarkTriedButton({
  slug,
  cafeName,
  showLabel = false,
  size = "md",
  className = "",
}: MarkTriedButtonProps) {
  const { isTried, toggleTried } = useTriedCafes();
  const tried = isTried(slug);
  const [cheers, setCheers] = useState(false);

  const label = cafeName
    ? tried
      ? `Mark ${cafeName} as not tasted`
      : `Mark ${cafeName} as tasted`
    : tried
      ? "Remove from Tasted"
      : "Mark as tasted";

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      if (!tried) {
        setCheers(true);
        window.setTimeout(() => setCheers(false), 450);
      }

      toggleTried(slug);
    },
    [tried, slug, toggleTried],
  );

  return (
    <button
      type="button"
      className={`tried-cafe-btn tried-cafe-btn--${size}${tried ? " tried-cafe-btn--tried" : ""}${cheers ? " tried-cafe-btn--cheers" : ""} ${className}`.trim()}
      onClick={handleClick}
      aria-pressed={tried}
      aria-label={label}
    >
      <MatchaGlassIcon saved={tried} className="matcha-glass-icon" />
      {showLabel && <span className="tried-cafe-btn-label">{tried ? "Tasted" : "Mark as tasted"}</span>}
    </button>
  );
}
