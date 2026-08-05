import Link from "next/link";
import type { Shop } from "@/lib/types";
import { DoodleCat, DoodleCrown, DoodleRibbon } from "@/components/doodles/Doodles";
import type { ReactNode } from "react";

type RankCardCompactProps = {
  shop: Shop;
  doodle?: ReactNode;
  doodleClass?: string;
};

function starsForRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function RankCardCompact({ shop, doodle, doodleClass }: RankCardCompactProps) {
  return (
    <article className="rank-card-compact">
      {doodle && <div className={`rank-card-doodle ${doodleClass ?? ""}`}>{doodle}</div>}
      <div className="rank-card-compact-body">
        <div className="rank-card-top">
          {shop.rank ? <span className="rank-badge">#{shop.rank}</span> : <span className="rank-badge">Top</span>}
          <span className="rank-area">{shop.area}</span>
        </div>
        <h3 className="rank-name-compact">{shop.name}</h3>
        <div className="rank-rating rank-rating-compact">
          <span className="stars" aria-hidden="true">
            {starsForRating(shop.rating)}
          </span>
          <span className="rank-count">{shop.rating.toFixed(1)}</span>
        </div>
        <p className="rank-dish-compact">{shop.signatureDrink}</p>
        <Link href={`/map?cafe=${shop.slug}`} className="btn btn-primary btn-compact">
          View
        </Link>
      </div>
    </article>
  );
}

/** Crown on #1, ribbon centred on #2 — cat lives below the stack */
const CARD_DOODLES: { doodle: ReactNode; className: string }[] = [
  { doodle: <DoodleCrown />, className: "doodle-crown" },
  { doodle: <DoodleRibbon />, className: "doodle-ribbon" },
];

type TopRankedStackProps = {
  shops: Shop[];
};

export function TopRankedStack({ shops }: TopRankedStackProps) {
  return (
    <aside className="top-ranked-stack" aria-label="Top ranked matcha cafes">
      <p className="top-ranked-label">Top ranked</p>
      {shops.map((shop, i) => (
        <RankCardCompact
          key={shop.id}
          shop={shop}
          doodle={CARD_DOODLES[i]?.doodle}
          doodleClass={CARD_DOODLES[i]?.className}
        />
      ))}
      <div className="top-ranked-cat-doodle" aria-hidden="true">
        <DoodleCat />
      </div>
    </aside>
  );
}
