"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import type { CafeReview, MergedShop, NewCafeInput } from "@/lib/types";
import { useCafes } from "@/components/providers/CafesProvider";
import { SaveCafeButton } from "@/components/save/SaveCafeButton";
import {
  dataUrlBytes,
  fileToDataUrl,
  parseLatLngFromGoogleMapsUrl,
  reviewCountOf,
} from "@/lib/cafe-helpers";
import { isWithinSingapore } from "@/lib/geo";

type DrawerMode = "view" | "add" | "edit";

type CafeDrawerProps = {
  mode: DrawerMode;
  shop: MergedShop | null;
  onClose: () => void;
  onRequestEdit: (slug: string) => void;
  onSaved: (shop: MergedShop) => void;
  onRemoved: () => void;
};

type FormState = {
  name: string;
  area: string;
  address: string;
  lat: string;
  lng: string;
  googleMapsUrl: string;
  priceTier: 1 | 2 | 3;
  rating: string;
  signatureDrink: string;
  popularDishes: string[];
  photos: string[];
  reviews: CafeReview[];
  matchaOrigin: string;
  flavorTagsText: string;
};

const TILE_CLASSES = ["tile-tan", "tile-blue", "tile-sage", "tile-butter", "tile-honey"];
const MAX_PHOTO_BYTES_WARN = 3_000_000;

function starsForRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function emptyForm(): FormState {
  return {
    name: "",
    area: "",
    address: "",
    lat: "",
    lng: "",
    googleMapsUrl: "",
    priceTier: 2,
    rating: "4.5",
    signatureDrink: "",
    popularDishes: [],
    photos: [],
    reviews: [],
    matchaOrigin: "",
    flavorTagsText: "",
  };
}

function shopToForm(shop: MergedShop): FormState {
  return {
    name: shop.name,
    area: shop.area,
    address: shop.location.address,
    lat: String(shop.location.lat),
    lng: String(shop.location.lng),
    googleMapsUrl: shop.googleMapsUrl ?? "",
    priceTier: shop.priceTier,
    rating: String(shop.rating),
    signatureDrink: shop.signatureDrink,
    popularDishes: shop.popularDishes ?? [],
    photos: shop.photos ?? [],
    reviews: shop.reviews ?? [],
    matchaOrigin: shop.matchaOrigin ?? "",
    flavorTagsText: (shop.flavorTags ?? []).join(", "),
  };
}

export function CafeDrawer({ mode, shop, onClose, onRequestEdit, onSaved, onRemoved }: CafeDrawerProps) {
  const { addCafe, updateCafe, removeCafe } = useCafes();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dishInput, setDishInput] = useState("");
  const [newReview, setNewReview] = useState({ author: "", text: "", rating: "" });
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // This is a non-modal panel (the map stays interactive behind it), so it
  // doesn't get a focus trap -- just move focus in when it appears, since
  // it's a fresh mount each time the parent opens it.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mode === "edit" && shop) setForm(shopToForm(shop));
    else if (mode === "add") setForm(emptyForm());
    setConfirmingRemove(false);
    setWarning(null);
    setDishInput("");
    setNewReview({ author: "", text: "", rating: "" });
  }, [mode, shop]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function addDish() {
    const trimmed = dishInput.trim();
    if (!trimmed) return;
    setForm((f) => ({ ...f, popularDishes: [...f.popularDishes, trimmed] }));
    setDishInput("");
  }

  function removeDish(index: number) {
    setForm((f) => ({ ...f, popularDishes: f.popularDishes.filter((_, i) => i !== index) }));
  }

  function addReview() {
    if (!newReview.author.trim() || !newReview.text.trim()) return;
    const review: CafeReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: newReview.author.trim(),
      text: newReview.text.trim(),
      rating: newReview.rating ? Number(newReview.rating) : undefined,
      date: new Date().toISOString().slice(0, 10),
    };
    setForm((f) => ({ ...f, reviews: [...f.reviews, review] }));
    setNewReview({ author: "", text: "", rating: "" });
  }

  function removeReview(id: string) {
    setForm((f) => ({ ...f, reviews: f.reviews.filter((r) => r.id !== id) }));
  }

  function removePhoto(index: number) {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  }

  async function handlePhotosSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added: string[] = [];
    for (const file of Array.from(files)) {
      try {
        added.push(await fileToDataUrl(file));
      } catch {
        // skip files that fail to decode, keep the rest
      }
    }
    setForm((f) => ({ ...f, photos: [...f.photos, ...added] }));
    e.target.value = "";

    const totalBytes = [...form.photos, ...added].reduce((sum, p) => sum + dataUrlBytes(p), 0);
    if (totalBytes > MAX_PHOTO_BYTES_WARN) {
      setWarning("These photos are getting large -- if saving fails, remove one and try again.");
    }
  }

  function handleGoogleMapsBlur() {
    const parsed = parseLatLngFromGoogleMapsUrl(form.googleMapsUrl);
    if (parsed) {
      setForm((f) => ({ ...f, lat: String(parsed.lat), lng: String(parsed.lng) }));
    }
  }

  function handleDishKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addDish();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setWarning(null);

    const name = form.name.trim();
    const area = form.area.trim();
    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (!name || !area) {
      setWarning("Name and area are required.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setWarning("Latitude and longitude are required -- paste a Google Maps link above to auto-fill them.");
      return;
    }

    const rating = Math.min(5, Math.max(0, Number(form.rating) || 0));
    const flavorTags = form.flavorTagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const input: NewCafeInput = {
      name,
      area,
      rating,
      signatureDrink: form.signatureDrink.trim() || "Matcha",
      priceTier: form.priceTier,
      location: { lat, lng, address: form.address.trim() },
      googleMapsUrl: form.googleMapsUrl.trim() || undefined,
      popularDishes: form.popularDishes.length ? form.popularDishes : undefined,
      photos: form.photos.length ? form.photos : undefined,
      reviews: form.reviews.length ? form.reviews : undefined,
      matchaOrigin: form.matchaOrigin.trim() || undefined,
      flavorTags: flavorTags.length ? flavorTags : undefined,
      reviewCount: form.reviews.length,
    };

    if (mode === "add") {
      const { shop: created, persisted } = addCafe(input);
      if (!persisted) {
        setWarning("Added for this session, but your browser storage is full -- remove a photo so it survives a reload.");
      }
      onSaved(created);
    } else if (mode === "edit" && shop) {
      const { persisted } = updateCafe(shop.slug, input);
      if (!persisted) {
        setWarning("Saved for this session, but your browser storage is full -- remove a photo so it survives a reload.");
      }
      onSaved({ ...shop, ...input, isCustom: true });
    }
  }

  const latNum = Number(form.lat);
  const lngNum = Number(form.lng);
  const showOobWarning =
    form.lat !== "" &&
    form.lng !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    !isWithinSingapore(latNum, lngNum);

  return (
    <aside className="cafe-drawer" role="complementary" aria-label={mode === "add" ? "Add a cafe" : (shop?.name ?? "Cafe details")}>
      <button
        type="button"
        ref={closeButtonRef}
        className="cafe-drawer-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {mode === "view" && shop ? (
        <div className="cafe-drawer-content">
          <div className="cafe-drawer-header">
            <div>
              <p className="cafe-drawer-eyebrow">
                {shop.area} · {"$".repeat(shop.priceTier)}
              </p>
              <h2 className="cafe-drawer-name">{shop.name}</h2>
              <div className="cafe-rating">
                <span className="stars" aria-hidden="true">
                  {starsForRating(shop.rating)}
                </span>
                <span>
                  {shop.rating.toFixed(1)} · {reviewCountOf(shop)} reviews
                </span>
              </div>
            </div>
            <SaveCafeButton slug={shop.slug} cafeName={shop.name} />
          </div>

          {shop.photos && shop.photos.length > 0 && (
            <div className="cafe-drawer-photos">
              {shop.photos.map((src, i) => (
                <div key={i} className={`photo-tile ${TILE_CLASSES[i % TILE_CLASSES.length]}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          )}

          {shop.googleMapsUrl && (
            <a
              href={shop.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary cafe-drawer-gmaps-btn"
            >
              View on Google Maps
            </a>
          )}

          <div className="cafe-drawer-section">
            <p className="cafe-drawer-section-title">Signature</p>
            <p>{shop.signatureDrink}</p>
          </div>

          {shop.popularDishes && shop.popularDishes.length > 0 && (
            <div className="cafe-drawer-section">
              <p className="cafe-drawer-section-title">Popular dishes</p>
              <div className="flavor-tags">
                {shop.popularDishes.map((dish) => (
                  <span key={dish} className="flavor-tag">
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="cafe-drawer-section">
            <p className="cafe-drawer-section-title">Reviews</p>
            {shop.reviews && shop.reviews.length > 0 ? (
              <ul className="cafe-drawer-reviews">
                {shop.reviews.map((r) => (
                  <li key={r.id} className="cafe-drawer-review">
                    <div className="cafe-drawer-review-head">
                      <strong>{r.author}</strong>
                      {r.rating != null && (
                        <span className="stars" aria-hidden="true">
                          {starsForRating(r.rating)}
                        </span>
                      )}
                      {r.date && <span className="cafe-drawer-review-date">{r.date}</span>}
                    </div>
                    <p>{r.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cafe-drawer-empty">No reviews yet.</p>
            )}
          </div>

          <div className="cafe-drawer-actions">
            {shop.isCustom && (
              <button type="button" className="btn btn-primary" onClick={() => onRequestEdit(shop.slug)}>
                Edit
              </button>
            )}
            {!confirmingRemove ? (
              <button type="button" className="cafe-drawer-remove-btn" onClick={() => setConfirmingRemove(true)}>
                Remove from map
              </button>
            ) : (
              <div className="cafe-drawer-confirm">
                <span>Remove this cafe?</span>
                <button type="button" onClick={() => setConfirmingRemove(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="cafe-drawer-remove-confirm"
                  onClick={() => {
                    removeCafe(shop.slug);
                    onRemoved();
                  }}
                >
                  Confirm remove
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form className="cafe-drawer-content cafe-drawer-form" onSubmit={handleSubmit}>
          <h2 className="cafe-drawer-name">{mode === "add" ? "Add a cafe" : `Edit ${shop?.name ?? "cafe"}`}</h2>

          {warning && <p className="cafe-drawer-warning">{warning}</p>}

          <label className="cafe-drawer-field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>

          <label className="cafe-drawer-field">
            <span>Area</span>
            <input value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} required />
          </label>

          <label className="cafe-drawer-field">
            <span>Address</span>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </label>

          <label className="cafe-drawer-field">
            <span>Google Maps link</span>
            <input
              value={form.googleMapsUrl}
              onChange={(e) => setForm((f) => ({ ...f, googleMapsUrl: e.target.value }))}
              onBlur={handleGoogleMapsBlur}
              placeholder="Paste a share link to auto-fill lat/lng"
            />
          </label>

          <div className="cafe-drawer-field-row">
            <label className="cafe-drawer-field">
              <span>Latitude</span>
              <input
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                inputMode="decimal"
                required
              />
            </label>
            <label className="cafe-drawer-field">
              <span>Longitude</span>
              <input
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                inputMode="decimal"
                required
              />
            </label>
          </div>
          {showOobWarning && (
            <p className="cafe-drawer-warning">
              These coordinates look like they are outside Singapore -- double check the pin lands where you expect.
            </p>
          )}

          <div className="cafe-drawer-field-row">
            <label className="cafe-drawer-field">
              <span>Price</span>
              <select
                value={form.priceTier}
                onChange={(e) => setForm((f) => ({ ...f, priceTier: Number(e.target.value) as 1 | 2 | 3 }))}
              >
                <option value={1}>$</option>
                <option value={2}>$$</option>
                <option value={3}>$$$</option>
              </select>
            </label>
            <label className="cafe-drawer-field">
              <span>Rating</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
              />
            </label>
          </div>

          <label className="cafe-drawer-field">
            <span>Signature drink</span>
            <input
              value={form.signatureDrink}
              onChange={(e) => setForm((f) => ({ ...f, signatureDrink: e.target.value }))}
            />
          </label>

          <div className="cafe-drawer-field">
            <span>Popular dishes</span>
            <div className="cafe-drawer-tag-input">
              <input
                value={dishInput}
                onChange={(e) => setDishInput(e.target.value)}
                onKeyDown={handleDishKeyDown}
                placeholder="e.g. Matcha tiramisu"
              />
              <button type="button" onClick={addDish}>
                Add
              </button>
            </div>
            {form.popularDishes.length > 0 && (
              <div className="flavor-tags">
                {form.popularDishes.map((dish, i) => (
                  <span key={`${dish}-${i}`} className="flavor-tag cafe-drawer-removable-tag">
                    {dish}
                    <button type="button" onClick={() => removeDish(i)} aria-label={`Remove ${dish}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="cafe-drawer-field">
            <span>Photos</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotosSelected} />
            {form.photos.length > 0 && (
              <div className="cafe-drawer-photo-thumbs">
                {form.photos.map((src, i) => (
                  <div key={i} className="cafe-drawer-photo-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                    <button type="button" onClick={() => removePhoto(i)} aria-label="Remove photo">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cafe-drawer-field">
            <span>Reviews</span>
            {form.reviews.map((r) => (
              <div key={r.id} className="cafe-drawer-review-row">
                <strong>{r.author}</strong>
                <p>{r.text}</p>
                <button type="button" onClick={() => removeReview(r.id)}>
                  Remove
                </button>
              </div>
            ))}
            <div className="cafe-drawer-review-form">
              <input
                placeholder="Author"
                value={newReview.author}
                onChange={(e) => setNewReview((r) => ({ ...r, author: e.target.value }))}
              />
              <input
                placeholder="Rating (optional)"
                type="number"
                min={0}
                max={5}
                step={0.5}
                value={newReview.rating}
                onChange={(e) => setNewReview((r) => ({ ...r, rating: e.target.value }))}
              />
              <textarea
                placeholder="Notes"
                value={newReview.text}
                onChange={(e) => setNewReview((r) => ({ ...r, text: e.target.value }))}
              />
              <button type="button" onClick={addReview}>
                Add review
              </button>
            </div>
          </div>

          <details className="cafe-drawer-advanced">
            <summary>Advanced</summary>
            <label className="cafe-drawer-field">
              <span>Matcha origin</span>
              <input
                value={form.matchaOrigin}
                onChange={(e) => setForm((f) => ({ ...f, matchaOrigin: e.target.value }))}
              />
            </label>
            <label className="cafe-drawer-field">
              <span>Flavor tags (comma separated)</span>
              <input
                value={form.flavorTagsText}
                onChange={(e) => setForm((f) => ({ ...f, flavorTagsText: e.target.value }))}
              />
            </label>
          </details>

          <div className="cafe-drawer-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === "add" ? "Add cafe" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
