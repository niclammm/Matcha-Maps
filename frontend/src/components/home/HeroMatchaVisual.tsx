/**
 * Hero centre illustration — replace placeholder when your art is ready.
 *
 * Static (PNG/SVG):  public/illustrations/whisk.svg
 * Animated (GIF):    same folder — plays automatically in <img>
 * Lottie:            public/illustrations/whisk.json + lottie-react
 *
 * One file is enough; multiple frames only if you want sprite-sheet control.
 */
export function HeroMatchaVisual() {
  return (
    <div
      className="matcha-hero-placeholder"
      role="img"
      aria-label="Matcha whisk illustration placeholder"
    >
      <div className="matcha-hero-placeholder-inner">
        <svg
          className="matcha-hero-placeholder-icon"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <ellipse cx="24" cy="30" rx="16" ry="8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M24 8 L24 22 M20 14 L24 8 L28 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="matcha-hero-placeholder-label">
          whisk illustration
          <br />
          <span>coming soon</span>
        </p>
      </div>
    </div>
  );
}
