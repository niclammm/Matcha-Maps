import Link from "next/link";
import type { Shop } from "@/lib/types";

type RankCardProps = {
  shop: Shop;
  floating?: boolean;
};

function starsForRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function RankCard({ shop, floating = true }: RankCardProps) {
  return (
    <article className={`rank-card${floating ? "" : " rank-card-static"}`}>
      <div className="rank-card-top">
        {shop.rank ? <span className="rank-badge">#{shop.rank} Ranked</span> : <span className="rank-badge">Featured</span>}
        <span className="rank-area">{shop.area}</span>
      </div>
      <h3 className="rank-name">{shop.name}</h3>
      <div className="rank-rating">
        <span className="stars" aria-hidden="true">
          {starsForRating(shop.rating)}
        </span>
        <span className="rank-count">
          {shop.rating.toFixed(1)} · {shop.reviewCount} reviews
        </span>
      </div>
      <div className="rank-footer">
        <div>
          <div className="rank-label">Signature</div>
          <div className="rank-dish">{shop.signatureDrink}</div>
        </div>
        <Link href={`/map?cafe=${shop.slug}`} className="btn btn-primary">
          View
        </Link>
      </div>
    </article>
  );
}
