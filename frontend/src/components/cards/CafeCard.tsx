import type { MergedShop, Shop } from "@/lib/types";
import Link from "next/link";
import { CafeStatusButton } from "@/components/status/CafeStatusButton";
import { reviewCountOf } from "@/lib/cafe-helpers";

type CafeCardProps = {
  shop: MergedShop;
  selected?: boolean;
  onSelect?: () => void;
  variant?: "default" | "grid" | "rail";
  /** Fires after this card's status button moves the cafe from Wish List to
   * Tasted, so the page can open a drawer/note editor for photos & comments. */
  onMarkedTasted?: () => void;
};

function priceLabel(tier: Shop["priceTier"]) {
  return "$".repeat(tier);
}

function starsForRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function RatingDisplay({ rating }: { rating?: number }) {
  if (rating == null) {
    return <span className="cafe-rating-unrated">Not yet rated</span>;
  }
  return (
    <>
      <span className="stars" aria-hidden="true">
        {starsForRating(rating)}
      </span>
      <span>{rating.toFixed(1)}</span>
    </>
  );
}

export function CafeCard({ shop, selected = false, onSelect, variant = "default", onMarkedTasted }: CafeCardProps) {
  const isGrid = variant === "grid";
  const isRail = variant === "rail";

  if (isRail) {
    return (
      <article
        className={`cafe-card-rail${selected ? " cafe-card-rail-selected" : ""}`}
        data-rank={shop.rank ?? undefined}
      >
        <button type="button" className="cafe-card-rail-click" onClick={onSelect}>
          <div className="cafe-card-rail-photo">
            {shop.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.coverImage} alt="" />
            )}
          </div>
          <div className="cafe-card-rail-body">
            <div className="cafe-card-rail-top">
              <span className="rank-badge">{shop.rank ? `#${shop.rank}` : "On the list"}</span>
              <span className="rank-area">
                {shop.cuisine ? `${shop.cuisine} · ` : ""}
                {shop.country}
              </span>
            </div>
            <h3 className="cafe-card-rail-name">{shop.name}</h3>
            <div className="cafe-card-rail-rating">
              <RatingDisplay rating={shop.rating} />
            </div>
            {shop.signatureDrink && <p className="cafe-card-rail-dish">{shop.signatureDrink}</p>}
          </div>
        </button>
        <CafeStatusButton
          slug={shop.slug}
          cafeName={shop.name}
          size="sm"
          className="cafe-card-rail-save"
          onMarkedTasted={onMarkedTasted}
        />
      </article>
    );
  }

  return (
    <article className={`cafe-card${selected ? " cafe-card-selected" : ""}${isGrid ? " cafe-card-grid" : ""}`}>
      {isGrid && shop.coverImage && (
        <Link href={`/map?cafe=${shop.slug}`} className="cafe-card-image-link">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shop.coverImage} alt="" className="cafe-card-image" />
        </Link>
      )}

      <div className="cafe-card-header">
        <div className="cafe-card-top">
          <span className="cafe-area">
            {shop.cuisine ? `${shop.cuisine} · ` : ""}
            {shop.country}
          </span>
          <div className="cafe-card-top-end">
            <span className="cafe-price">{priceLabel(shop.priceTier)}</span>
            <CafeStatusButton
              slug={shop.slug}
              cafeName={shop.name}
              size="sm"
              className="cafe-card-save"
              onMarkedTasted={onMarkedTasted}
            />
          </div>
        </div>

        <button type="button" className="cafe-card-main" onClick={onSelect}>
          <h3 className="cafe-name">{shop.name}</h3>
          {shop.signatureDrink && <p className="cafe-signature">{shop.signatureDrink}</p>}
          <div className="cafe-rating">
            <RatingDisplay rating={shop.rating} />
            {shop.rating != null && !isGrid && <span> · {reviewCountOf(shop)} reviews</span>}
          </div>
          {shop.flavorTags && shop.flavorTags.length > 0 && !isGrid && (
            <div className="flavor-tags">
              {shop.flavorTags.map((tag) => (
                <span key={tag} className="flavor-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </button>
      </div>

      <Link href={`/map?cafe=${shop.slug}`} className="btn btn-primary cafe-card-btn">
        View
      </Link>
    </article>
  );
}
