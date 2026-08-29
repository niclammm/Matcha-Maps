"use client";

import { useId } from "react";

type LogoProps = {
  /** "mark" — small nav-lockup glyph, no arched type (unreadable below
   * ~60px). "full" — 120px with the arched type ring restored, for footers/
   * about/social images. "reversed" — the mark inverted for dark grounds
   * (favicon-scale). */
  size?: "mark" | "full" | "reversed";
  className?: string;
};

const FULL_ARC_TEXT = "MATCHA MAPS · SINGAPORE · TASTED & MAPPED ·";

/** The scrapbook postmark mark, shared with the hero's "Log a new journal
 * entry" button so the header and the hero read as one family. The steam
 * curl doubles as a map-pin silhouette -- the whole point of the mark. */
export function Logo({ size = "mark", className }: LogoProps) {
  const arcId = useId();

  if (size === "reversed") {
    return (
      <svg
        className={className}
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
      >
        {/* Near-white --off-white, not the beige --cream -- this needs to
            read clearly against the solid matcha-dark field below. */}
        <circle cx={60} cy={60} r={60} fill="var(--matcha-dark)" />
        <circle cx={60} cy={60} r={55} stroke="var(--off-white)" strokeWidth={5} />
        <path
          d="M40 48 H80 C80 68 71 79 60 79 C49 79 40 68 40 48 Z"
          fill="var(--off-white)"
        />
        <ellipse cx={60} cy={48} rx={20} ry={4.5} fill="var(--matcha-light)" />
        <path
          d="M60 40 C60 33 67 31 67 25 C67 21 64 19 60 19 C56 19 53 21 53 25 C53 31 60 33 60 40 Z"
          fill="var(--off-white)"
        />
      </svg>
    );
  }

  if (size === "full") {
    return (
      <svg
        className={`logo-full ${className ?? ""}`.trim()}
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
      >
        <circle cx={60} cy={60} r={57} stroke="var(--matcha-dark)" strokeWidth={2} />
        <circle cx={60} cy={60} r={42} stroke="var(--matcha-dark)" strokeWidth={1} strokeDasharray="3 4" />
        <g className="logo-full-type">
          <defs>
            <path id={arcId} d="M60 11 a49 49 0 1 1 -0.1 0" />
          </defs>
          <text fontSize={9.5} fontWeight={600} letterSpacing={3.1} fill="var(--matcha-dark)">
            <textPath href={`#${arcId}`} startOffset="0" textLength={306} lengthAdjust="spacing">
              {FULL_ARC_TEXT}
            </textPath>
          </text>
        </g>
        <path
          d="M42 50 H78 C78 68 70 78 60 78 C50 78 42 68 42 50 Z"
          fill="var(--matcha)"
        />
        <ellipse cx={60} cy={50} rx={18} ry={4} fill="var(--matcha-light)" />
        <path
          d="M60 42 C60 36 66 34 66 28 C66 24 63 22 60 22 C57 22 54 24 54 28 C54 34 60 36 60 42 Z"
          fill="var(--matcha-dark)"
        />
        {/* Knockout dot: deliberately the page background (--cream), not
            --off-white -- it's meant to punch through to whatever it's
            sitting on, not read as its own near-white highlight. */}
        <circle cx={60} cy={28} r={2.6} fill="var(--cream)" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx={60} cy={60} r={57} stroke="var(--matcha-dark)" strokeWidth={4} />
      <circle cx={60} cy={60} r={44} stroke="var(--matcha-dark)" strokeWidth={2} strokeDasharray="5 6" />
      <path d="M40 48 H80 C80 68 71 79 60 79 C49 79 40 68 40 48 Z" fill="var(--matcha)" />
      <ellipse cx={60} cy={48} rx={20} ry={4.5} fill="var(--matcha-light)" />
      <path
        d="M60 40 C60 33 67 31 67 25 C67 21 64 19 60 19 C56 19 53 21 53 25 C53 31 60 33 60 40 Z"
        fill="var(--matcha-dark)"
      />
    </svg>
  );
}
