type WishListMarkProps = {
  /** Rendered width in px; height follows the mark's fixed 1.5:1 aspect ratio. */
  size?: number;
  className?: string;
  /** Dims the mark to ~62% opacity for the "not on this list" empty state. */
  dim?: boolean;
  /** Runs the idle tail-wag/ear-nod loop. Off by default -- reserved for the
   * one place the motion carries real meaning (the active bucket tab), so a
   * rail full of cards doesn't turn into a wall of wagging tails. */
  animated?: boolean;
  /** Set when a visible text label sits right next to the mark, so screen
   * readers don't announce "Wish List" twice. */
  decorative?: boolean;
};

/** The Wish List brand mark: a dachshund, cut-paper style. Aspect ratio is
 * deliberately wide (vs. the tall TastedMark peanut) so the two stay
 * distinguishable even at badge size. */
export function WishListMark({ size = 26, className, dim = false, animated = false, decorative = false }: WishListMarkProps) {
  const height = size / 1.5;
  return (
    <svg
      className={`wishlist-mark${animated ? " wishlist-mark--animated" : ""}${className ? ` ${className}` : ""}`}
      width={size}
      height={height}
      style={{ opacity: dim ? 0.62 : 1 }}
      viewBox="0 0 96 64"
      fill="none"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Wish List" })}
    >
      <g className="wishlist-mark-tail" style={{ transformOrigin: "82px 26px" }}>
        <path
          d="M78 26 C 88 24 92 16 90 8"
          stroke="#c9b89a"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <rect x="60" y="36" width="11" height="20" rx="5.5" fill="#b8a58c" />
      <rect x="27" y="36" width="11" height="20" rx="5.5" fill="#b8a58c" />
      <rect x="18" y="21" width="64" height="23" rx="11.5" fill="#c9b89a" />
      <rect
        x="21.5"
        y="24.5"
        width="57"
        height="16"
        rx="8"
        fill="none"
        stroke="rgba(107,88,72,.42)"
        strokeWidth="1.2"
        strokeDasharray="3.5 4"
      />
      <rect x="33" y="20" width="6" height="24" rx="2" fill="#789b62" />
      <circle cx="36" cy="46" r="4" fill="#e8d9a8" stroke="rgba(107,88,72,.3)" strokeWidth="1" />
      <circle cx="24" cy="19" r="14" fill="#c9b89a" />
      <ellipse cx="10" cy="23" rx="8.5" ry="6.5" fill="#d9cbb4" />
      <circle cx="4.5" cy="22" r="2.8" fill="#5a4a3c" />
      <circle
        cx="24"
        cy="19"
        r="10.5"
        fill="none"
        stroke="rgba(107,88,72,.38)"
        strokeWidth="1.2"
        strokeDasharray="3.5 4"
      />
      <path
        className="wishlist-mark-ear"
        style={{ transformOrigin: "28px 10px" }}
        d="M28 8 C 17 8 12 18 15 28 C 17 34 26 35 30 28 C 33 23 32 13 28 8 Z"
        fill="#6b5848"
      />
      <circle cx="16" cy="16" r="2.3" fill="#3f342c" />
      <circle cx="15.2" cy="15.2" r=".8" fill="#faf9f4" />
    </svg>
  );
}
