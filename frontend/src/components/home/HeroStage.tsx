import { HeroMatchaVisual } from "@/components/home/HeroMatchaVisual";
import { DoodleStar } from "@/components/doodles/Doodles";

/** Sizes are % of .hero-stage — scales on laptop and monitor alike */
const RING = [
  { src: "/matcha-pictures/web/matcha_2.png", tile: "tile-cream", rot: "-6deg", size: "17%" },
  { src: "/matcha-pictures/web/matcha_20.png", tile: "tile-sage", rot: "5deg", size: "15%" },
  { src: "/matcha-pictures/web/matcha_10.png", tile: "tile-butter", rot: "4deg", size: "16%" },
  { src: "/matcha-pictures/web/matcha_16.png", tile: "tile-blue", rot: "-4deg", size: "15.5%" },
  { src: "/matcha-pictures/web/matcha_8.png", tile: "tile-tan", rot: "6deg", size: "16.5%" },
  { src: "/matcha-pictures/web/matcha_4.png", tile: "tile-blue", rot: "-5deg", size: "14.5%" },
  { src: "/matcha-pictures/web/matcha_13.png", tile: "tile-sage", rot: "3deg", size: "15.5%" },
  { src: "/matcha-pictures/web/matcha_19.png", tile: "tile-honey", rot: "-3deg", size: "15%" },
] as const;

const RING_RADIUS_PERCENT = 40;

function ringOffset(index: number, total: number, radiusPercent: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    dx: `${(Math.cos(angle) * radiusPercent).toFixed(2)}%`,
    dy: `${(Math.sin(angle) * radiusPercent).toFixed(2)}%`,
  };
}

export function HeroStage() {
  return (
    <div className="hero-stage">
      <div className="hero-stage-photos" aria-hidden="true">
        {RING.map((tile, i) => {
          const { dx, dy } = ringOffset(i, RING.length, RING_RADIUS_PERCENT);
          return (
            <div
              key={tile.src}
              className={`photo-tile stage-photo ${tile.tile}`}
              style={{
                ["--rot" as string]: tile.rot,
                ["--dx" as string]: dx,
                ["--dy" as string]: dy,
                ["--tile-size" as string]: tile.size,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tile.src} alt="" />
            </div>
          );
        })}
      </div>

      <DoodleStar className="hero-doodle hero-doodle-star hero-doodle-star-left" />
      <DoodleStar className="hero-doodle hero-doodle-star hero-doodle-star-right" />
      <HeroMatchaVisual />
    </div>
  );
}
