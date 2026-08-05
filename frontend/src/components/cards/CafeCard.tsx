import type { Shop } from "@/lib/types";
import Link from "next/link";

type CafeCardProps = {
  shop: Shop;
  selected?: boolean;
  onSelect?: () => void;
};

function priceLabel(tier: Shop["priceTier"]) {
  return "$".repeat(tier);
}

export function CafeCard({ shop, selected = false, onSelect }: CafeCardProps) {
  return (
    <article className={`cafe-card${selected ? " cafe-card-selected" : ""}`}>
      <button type="button" className="cafe-card-main" onClick={onSelect}>
        <div className="cafe-card-top">
          <span className="cafe-area">{shop.area}</span>
          <span className="cafe-price">{priceLabel(shop.priceTier)}</span>
        </div>
        <h3 className="cafe-name">{shop.name}</h3>
        <p className="cafe-signature">{shop.signatureDrink}</p>
        <div className="cafe-rating">
          <span className="stars" aria-hidden="true">
            ★
          </span>
          <span>
            {shop.rating.toFixed(1)} · {shop.reviewCount} reviews
          </span>
        </div>
        {shop.flavorTags && shop.flavorTags.length > 0 && (
          <div className="flavor-tags">
            {shop.flavorTags.map((tag) => (
              <span key={tag} className="flavor-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </button>
      <Link href={`/map?cafe=${shop.slug}`} className="btn btn-primary cafe-card-btn">
        View
      </Link>
    </article>
  );
}
