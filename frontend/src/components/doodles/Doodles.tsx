export function DoodleCrown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 38 L12 18 L22 28 L32 10 L42 28 L52 18 L58 38 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="2.5" fill="currentColor" />
      <circle cx="32" cy="8" r="2.5" fill="currentColor" />
      <circle cx="52" cy="16" r="2.5" fill="currentColor" />
      <path d="M8 38 H56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DoodleRibbon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="28" cy="22" r="14" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18 32 L10 58 L22 46 L28 52 L34 46 L46 58 L38 32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x="28" y="27" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor">
        2
      </text>
    </svg>
  );
}

export function DoodleCat({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 24 L8 8 L22 20 M60 24 L64 8 L50 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="36" cy="32" rx="22" ry="18" stroke="currentColor" strokeWidth="2" />
      <circle cx="28" cy="30" r="2" fill="currentColor" />
      <circle cx="44" cy="30" r="2" fill="currentColor" />
      <path d="M32 38 Q36 42 40 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M34 36 L36 37 L38 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M54 28 C58 24 64 26 66 30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DoodleStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2 L14 9 L21 9 L15.5 13.5 L17.5 21 L12 16.5 L6.5 21 L8.5 13.5 L3 9 L10 9 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
