type TastedMarkProps = {
  /** Rendered width in px; height follows the mark's fixed 0.89:1 aspect ratio. */
  size?: number;
  className?: string;
  /** Dims the mark to ~62% opacity for an empty/inactive state. */
  dim?: boolean;
  /** Runs the idle rock loop. Off by default -- see WishListMark for why. */
  animated?: boolean;
  /** Set when a visible text label sits right next to the mark, so screen
   * readers don't announce "Tasted" twice. */
  decorative?: boolean;
};

/** The Tasted brand mark: a peanut, cut-paper style. Aspect ratio is
 * deliberately tall (vs. the wide WishListMark dachshund) so the two stay
 * distinguishable even at badge size. */
export function TastedMark({ size = 15, className, dim = false, animated = false, decorative = false }: TastedMarkProps) {
  const height = size / (64 / 72);
  return (
    <svg
      className={`tasted-mark${animated ? " tasted-mark--animated" : ""}${className ? ` ${className}` : ""}`}
      width={size}
      height={height}
      style={{ opacity: dim ? 0.62 : 1 }}
      viewBox="0 0 64 72"
      fill="none"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Tasted" })}
    >
      <g className="tasted-mark-body" style={{ transformOrigin: "32px 60px" }}>
        <path
          d="M32 5 C 45 5 52 13 52 22 C 52 28 47 31 47 35 C 47 39 52 42 52 49 C 52 60 44 68 32 68 C 20 68 12 60 12 49 C 12 42 17 39 17 35 C 17 31 12 28 12 22 C 12 13 19 5 32 5 Z"
          fill="#e8d9a8"
        />
        <path
          d="M18 20 C 26 24 38 24 46 20"
          stroke="rgba(107,88,72,.22)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M17 47 C 25 51 39 51 47 47"
          stroke="rgba(107,88,72,.22)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M14 33 C 22 37 42 37 50 33"
          stroke="rgba(107,88,72,.16)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M32 9 C 42 9 48 15 48 22.5 C 48 28 43.5 31 43.5 35 C 43.5 39 48 42 48 48.5 C 48 57.5 41 64 32 64 C 23 64 16 57.5 16 48.5 C 16 42 20.5 39 20.5 35 C 20.5 31 16 28 16 22.5 C 16 15 22 9 32 9 Z"
          fill="none"
          stroke="rgba(107,88,72,.4)"
          strokeWidth="1.2"
          strokeDasharray="3.5 4"
        />
        <circle cx="25" cy="21" r="2.6" fill="#3f342c" />
        <circle cx="24.1" cy="20.1" r=".9" fill="#faf9f4" />
        <circle cx="39" cy="21" r="2.6" fill="#3f342c" />
        <circle cx="38.1" cy="20.1" r=".9" fill="#faf9f4" />
        <path
          d="M28 27 C 30.5 30 33.5 30 36 27"
          stroke="#3f342c"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="18.5" cy="26" rx="3.4" ry="2.2" fill="rgba(200,120,90,.22)" />
        <ellipse cx="45.5" cy="26" rx="3.4" ry="2.2" fill="rgba(200,120,90,.22)" />
        <path
          d="M27 52 C 32 56 37 54 39 50"
          stroke="rgba(107,88,72,.3)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
