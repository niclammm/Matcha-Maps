type MatchaGlassIconProps = {
  saved?: boolean;
  className?: string;
};

export function MatchaGlassIcon({ saved = false, className }: MatchaGlassIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 6 H22 C24 6 25 7 25 9 V28 C25 32 22 35 16 35 C10 35 7 32 7 28 V9 C7 7 8 6 10 6 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {saved && (
        <>
          <path
            d="M9 22 C9 28 12 32 16 32 C20 32 23 28 23 22 V14 H9 V22 Z"
            fill="currentColor"
            className="matcha-glass-fill"
          />
          <ellipse cx="16" cy="14" rx="6" ry="1.5" fill="currentColor" opacity="0.35" />
          {/* Steam */}
          <path
            d="M12 3 C10 1 14 0 12 0"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M16 4 C14 2 18 1 16 0"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M20 3 C18 1 22 0 20 0"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle className="matcha-glass-sparkle" cx="22" cy="10" r="1" fill="currentColor" opacity="0.7" />
        </>
      )}
      <path
        d="M12 4 H20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity={saved ? 1 : 0.6}
      />
    </svg>
  );
}
