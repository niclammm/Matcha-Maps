import type { Shop } from "@/lib/types";
import Link from "next/link";
import { SaveCafeButton } from "@/components/save/SaveCafeButton";

type CafeCardProps = {
  shop: Shop;
  selected?: boolean;
  onSelect?: () => void;
  variant?: "default" | "grid";
};

function priceLabel(tier: Shop["priceTier"]) {
  return "$".repeat(tier);
}

export function CafeCard({ shop, selected = false, onSelect, variant = "default" }: CafeCardProps) {
  const isGrid = variant === "grid";

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
              {!isGrid && ` · ${shop.reviewCount} reviews`}
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
