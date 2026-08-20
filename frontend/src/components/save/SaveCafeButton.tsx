"use client";

import { useCallback, useState } from "react";
import { MatchaGlassIcon } from "@/components/icons/MatchaGlassIcon";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";

type SaveCafeButtonProps = {
  slug: string;
  cafeName?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function SaveCafeButton({
  slug,
  cafeName,
  showLabel = false,
  size = "md",
  className = "",
}: SaveCafeButtonProps) {
  const { isSaved, toggleSave } = useSavedCafes();
  const saved = isSaved(slug);
  const [cheers, setCheers] = useState(false);

  const label = cafeName
    ? saved
      ? `Remove ${cafeName} from My List`
      : `Save ${cafeName} to My List`
    : saved
      ? "Remove from My List"
      : "Save to My List";

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();

      if (!saved) {
        setCheers(true);
        window.setTimeout(() => setCheers(false), 450);
      }

      toggleSave(slug);
    },
    [saved, slug, toggleSave],
  );

  return (
    <button
      type="button"
      className={`save-cafe-btn save-cafe-btn--${size}${saved ? " save-cafe-btn--saved" : ""}${cheers ? " save-cafe-btn--cheers" : ""} ${className}`.trim()}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={label}
    >
      <MatchaGlassIcon saved={saved} className="matcha-glass-icon" />
      {showLabel && <span className="save-cafe-btn-label">{saved ? "Saved" : "Save to My List"}</span>}
    </button>
  );
}
