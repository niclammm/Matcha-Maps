import type { Shop } from "@/lib/types";
import Link from "next/link";
import { SaveCafeButton } from "@/components/save/SaveCafeButton";
import { reviewCountOf } from "@/lib/cafe-helpers";

type CafeCardProps = {
  shop: Shop & { isCustom?: boolean };
  selected?: boolean;
  onSelect?: () => void;
  variant?: "default" | "grid" | "rail";
  /** Rail variant only: a pastel tile background class (e.g. "tile-sage"). */
  tileClass?: string;
};

function priceLabel(tier: Shop["priceTier"]) {
  return "$".repeat(tier);
}

function starsForRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function CafeCard({
  shop,
  selected = false,
  onSelect,
  variant = "default",
  tileClass,
}: CafeCardProps) {
  const isGrid = variant === "grid";
  const isRail = variant === "rail";

  if (isRail) {
    return (
      <article
        className={`cafe-card-rail${tileClass ? ` ${tileClass}` : ""}${selected ? " cafe-card-rail-selected" : ""}`}
      >
        <div className="cafe-card-rail-top">
          <span>{shop.rank ? `#${shop.rank}` : shop.isCustom ? "New" : "Top"}</span>
          <span>{shop.area}</span>
        </div>

        <button type="button" className="cafe-card-rail-main" onClick={onSelect}>
          <h3 className="cafe-card-rail-name">{shop.name}</h3>
          <div className="cafe-card-rail-rating">
            <span className="stars" aria-hidden="true">
              {starsForRating(shop.rating)}
            </span>
            <span>{shop.rating.toFixed(1)}</span>
          </div>
          <p className="cafe-card-rail-dish">{shop.signatureDrink}</p>
        </button>

        <div className="cafe-card-rail-footer">
          <button type="button" className="btn btn-primary cafe-card-rail-btn" onClick={onSelect}>
            View
          </button>
          <SaveCafeButton slug={shop.slug} cafeName={shop.name} size="sm" />
        </div>
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
          <span className="cafe-area">{shop.area}</span>
          <div className="cafe-card-top-end">
            <span className="cafe-price">{priceLabel(shop.priceTier)}</span>
            <SaveCafeButton slug={shop.slug} cafeName={shop.name} size="sm" className="cafe-card-save" />
          </div>
        </div>

        <button type="button" className="cafe-card-main" onClick={onSelect}>
          <h3 className="cafe-name">{shop.name}</h3>
          <p className="cafe-signature">{shop.signatureDrink}</p>
          <div className="cafe-rating">
            <span className="stars" aria-hidden="true">
              ★
            </span>
            <span>
              {shop.rating.toFixed(1)}
              {!isGrid && ` · ${reviewCountOf(shop)} reviews`}
            </span>
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
