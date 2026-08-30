"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import type { CafeReview, MergedShop, NewCafeInput } from "@/lib/types";
import type { CafePatch } from "@/lib/cafe-mapping";
import { useCafes } from "@/components/providers/CafesProvider";
import { CafeStatusButton } from "@/components/status/CafeStatusButton";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";
import { extractPlaceInfoFromGoogleMapsUrl, resolveGoogleMapsLink, reviewCountOf } from "@/lib/cafe-helpers";
import { uploadPhoto } from "@/lib/upload-photo";
import { findMapCountry } from "@/lib/countries";

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
  country: string;
  address: string;
  lat: string;
  lng: string;
  googleMapsUrl: string;
  priceTier: 1 | 2 | 3;
  rating: string;
  signatureDrink: string;
  cuisine: string;
  notes: string;
  popularDishes: string[];
  photos: string[];
  reviews: CafeReview[];
  matchaOrigin: string;
  flavorTagsText: string;
};

const TILE_CLASSES = ["tile-tan", "tile-blue", "tile-sage", "tile-butter", "tile-honey"];

function starsForRating(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function emptyForm(): FormState {
  return {
    name: "",
    country: "Singapore",
    address: "",
    lat: "",
    lng: "",
    googleMapsUrl: "",
    priceTier: 2,
    rating: "",
    signatureDrink: "",
    cuisine: "",
    notes: "",
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
    country: shop.country,
    address: shop.location.address,
    lat: String(shop.location.lat),
    lng: String(shop.location.lng),
    googleMapsUrl: shop.googleMapsUrl ?? "",
    priceTier: shop.priceTier,
    rating: shop.rating != null ? String(shop.rating) : "",
    signatureDrink: shop.signatureDrink,
    cuisine: shop.cuisine ?? "",
    notes: shop.notes ?? "",
    popularDishes: shop.popularDishes ?? [],
    photos: shop.photos ?? [],
    reviews: shop.reviews ?? [],
    matchaOrigin: shop.matchaOrigin ?? "",
    flavorTagsText: (shop.flavorTags ?? []).join(", "),
  };
}

export function CafeDrawer({ mode, shop, onClose, onRequestEdit, onSaved, onRemoved }: CafeDrawerProps) {
  const { addCafe, updateCafe, removeCafe } = useCafes();
  const { isTried, getTriedNote, setTriedNote, hydrated: triedHydrated } = useTriedCafes();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dishInput, setDishInput] = useState("");
  const [newReview, setNewReview] = useState({ author: "", text: "", rating: "" });
  const [noteDraft, setNoteDraft] = useState<{ rating: string; comment: string; photos: string[] }>({
    rating: "",
    comment: "",
    photos: [],
  });
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingNotePhotos, setUploadingNotePhotos] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Tracks which fields still hold a Google-Maps-link auto-fill rather than
  // something the user typed themselves, so re-pasting a corrected link can
  // overwrite a previous (wrong) auto-fill without ever clobbering a value
  // the user deliberately entered by hand.
  const autoFilledFieldsRef = useRef<Set<"name" | "cuisine" | "address" | "lat" | "lng" | "country">>(new Set());
  // Bumped on every extraction attempt so a slow (short-link) resolution
  // that's since been superseded by a newer paste can detect it's stale and
  // no-op instead of overwriting more recent data.
  const extractRequestIdRef = useRef(0);

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
    autoFilledFieldsRef.current.clear();
    // "Singapore" is a pre-filled default, not something the user typed --
    // marking it auto-filled from the start lets a detected country (e.g.
    // pasting a Tokyo link) overwrite it, exactly like an empty field would.
    if (mode === "add") autoFilledFieldsRef.current.add("country");
    extractRequestIdRef.current += 1;
    if (mode === "view" && shop) {
      // Deliberately re-synced only when the drawer switches cafes/modes (or
      // tried-cafes finishes its one-time load from storage), not on every
      // tried-cafes change -- otherwise editing elsewhere while this note is
      // mid-edit would stomp on unsaved keystrokes. Without the `triedHydrated`
      // dependency, a hard refresh landing directly on /map?cafe=<slug> could
      // read the note before TriedCafesProvider finishes hydrating and seed
      // this draft blank, silently erasing a real note on the next blur.
      const note = getTriedNote(shop.slug);
      setNoteDraft({ rating: note.rating != null ? String(note.rating) : "", comment: note.comment, photos: note.photos });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, shop, triedHydrated]);

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
    e.target.value = "";
    setUploadingPhotos(true);
    const added: string[] = [];
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        added.push(await uploadPhoto(file));
      } catch {
        failed += 1;
      }
    }
    setForm((f) => ({ ...f, photos: [...f.photos, ...added] }));
    setUploadingPhotos(false);
    if (failed > 0) {
      setWarning(failed === 1 ? "One photo failed to upload." : `${failed} photos failed to upload.`);
    }
  }

  function commitTastedNote(photosOverride?: string[]) {
    if (!shop) return;
    const trimmed = noteDraft.rating.trim();
    const rating = trimmed === "" ? null : Math.min(5, Math.max(0, Number(trimmed) || 0));
    setTriedNote(shop.slug, { rating, comment: noteDraft.comment, photos: photosOverride ?? noteDraft.photos });
  }

  async function handleNotePhotosSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";
    setUploadingNotePhotos(true);
    const added: string[] = [];
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        added.push(await uploadPhoto(file));
      } catch {
        failed += 1;
      }
    }
    setUploadingNotePhotos(false);
    const nextPhotos = [...noteDraft.photos, ...added];
    setNoteDraft((d) => ({ ...d, photos: nextPhotos }));
    // No blur event fires for a file picker, so commit immediately.
    commitTastedNote(nextPhotos);

    if (failed > 0) {
      setWarning(failed === 1 ? "One photo failed to upload." : `${failed} photos failed to upload.`);
    }
  }

  function removeNotePhoto(index: number) {
    const nextPhotos = noteDraft.photos.filter((_, i) => i !== index);
    setNoteDraft((d) => ({ ...d, photos: nextPhotos }));
    commitTastedNote(nextPhotos);
  }

  /** Fills `field` from an extraction result unless the user has since typed
   * something of their own into it -- an empty field is always fair game,
   * and a still-auto-filled one gets overwritten too (so re-pasting a
   * corrected link can fix a wrong guess), but a value the user actually
   * edited is never touched. */
  function shouldAutoFill(
    field: "name" | "cuisine" | "address" | "lat" | "lng" | "country",
    currentValue: string,
  ): boolean {
    return currentValue.trim() === "" || autoFilledFieldsRef.current.has(field);
  }

  async function handleGoogleMapsBlur() {
    const url = form.googleMapsUrl.trim();
    if (!url) return;

    const requestId = ++extractRequestIdRef.current;
    setExtracting(true);
    setWarning(null);
    try {
      const resolvedUrl = await resolveGoogleMapsLink(url);
      // A newer paste/blur has started since this one kicked off -- let that
      // one win instead of clobbering it with this stale result.
      if (requestId !== extractRequestIdRef.current) return;

      const info = extractPlaceInfoFromGoogleMapsUrl(resolvedUrl);
      setForm((f) => {
        const next = { ...f, googleMapsUrl: resolvedUrl };
        if (info.name && shouldAutoFill("name", f.name)) {
          next.name = info.name;
          autoFilledFieldsRef.current.add("name");
        }
        if (info.cuisine && shouldAutoFill("cuisine", f.cuisine)) {
          next.cuisine = info.cuisine;
          autoFilledFieldsRef.current.add("cuisine");
        }
        if (info.address && shouldAutoFill("address", f.address)) {
          next.address = info.address;
          autoFilledFieldsRef.current.add("address");
        }
        if (info.lat != null && shouldAutoFill("lat", f.lat)) {
          next.lat = String(info.lat);
          autoFilledFieldsRef.current.add("lat");
        }
        if (info.lng != null && shouldAutoFill("lng", f.lng)) {
          next.lng = String(info.lng);
          autoFilledFieldsRef.current.add("lng");
        }
        if (info.country && shouldAutoFill("country", f.country)) {
          next.country = info.country;
          autoFilledFieldsRef.current.add("country");
        }
        return next;
      });
      if (info.lat == null || info.lng == null) {
        setWarning("Couldn't find coordinates in that link -- enter them manually below.");
      }
    } finally {
      if (requestId === extractRequestIdRef.current) setExtracting(false);
    }
  }

  /** Brings the (hidden-once-filled) coordinate row back in add mode, e.g.
   * when an extraction landed on the wrong branch of a chain restaurant. */
  function revealCoordinateFields() {
    autoFilledFieldsRef.current.delete("lat");
    autoFilledFieldsRef.current.delete("lng");
    setForm((f) => ({ ...f, lat: "", lng: "" }));
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
    const country = form.country.trim();
    const lat = Number(form.lat);
    const lng = Number(form.lng);

    if (!name || !country) {
      setWarning("Name and country are required.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setWarning("Latitude and longitude are required -- paste a Google Maps link above to auto-fill them.");
      return;
    }

    const ratingTrimmed = form.rating.trim();
    const rating = ratingTrimmed === "" ? undefined : Math.min(5, Math.max(0, Number(ratingTrimmed) || 0));
    const flavorTags = form.flavorTagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const input: NewCafeInput = {
      name,
      country,
      rating,
      signatureDrink: form.signatureDrink.trim(),
      cuisine: form.cuisine.trim() || undefined,
      notes: form.notes.trim() || undefined,
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
        setWarning("Couldn't save this restaurant -- try again.");
      }
      onSaved(created);
    } else if (mode === "edit" && shop) {
      // Edit sends `null` (not `undefined`) for a cleared optional field --
      // `input` above uses `undefined` for the add-restaurant form, where
      // that correctly means "omit"/"no value yet", but a PATCH request
      // JSON-serializes its body, and `JSON.stringify` silently drops
      // `undefined` keys entirely. Sent as `undefined`, "I cleared this
      // field" would arrive indistinguishable from "I didn't touch this
      // field" and the old value would silently stick around server-side.
      const patch: CafePatch = {
        ...input,
        rating: rating ?? null,
        cuisine: form.cuisine.trim() || null,
        notes: form.notes.trim() || null,
        googleMapsUrl: form.googleMapsUrl.trim() || null,
        matchaOrigin: form.matchaOrigin.trim() || null,
        popularDishes: form.popularDishes.length ? form.popularDishes : null,
        photos: form.photos.length ? form.photos : null,
        reviews: form.reviews.length ? form.reviews : null,
        flavorTags: flavorTags.length ? flavorTags : null,
      };
      const { persisted } = updateCafe(shop.slug, patch);
      if (!persisted) {
        setWarning("Couldn't save these changes -- try again.");
      }
      // onSaved only ever reads `.slug` at either call site (MapPageClient,
      // HeroAddButton) -- updateCafe already pushed the real change into
      // shared state above, so the original `shop` is enough here.
      onSaved(shop);
    }
  }

  const latNum = Number(form.lat);
  const lngNum = Number(form.lng);
  // Only checked for a country that actually has bounds data (Singapore,
  // Japan) -- any other free-text Country value has nothing to check
  // coordinates against, so it's silently skipped rather than guessed at.
  const formMapCountry = findMapCountry(form.country);
  const showOobWarning =
    !!formMapCountry &&
    form.lat !== "" &&
    form.lng !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    !(
      latNum >= formMapCountry.bounds.minLat &&
      latNum <= formMapCountry.bounds.maxLat &&
      lngNum >= formMapCountry.bounds.minLng &&
      lngNum <= formMapCountry.bounds.maxLng
    );

  return (
    <aside className="cafe-drawer" role="complementary" aria-label={mode === "add" ? "Add a restaurant" : (shop?.name ?? "Cafe details")}>
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
                {shop.cuisine ? `${shop.cuisine} · ` : ""}
                {shop.country} · {"$".repeat(shop.priceTier)}
              </p>
              <h2 className="cafe-drawer-name">{shop.name}</h2>
              <div className="cafe-rating">
                {shop.rating != null ? (
                  <>
                    <span className="stars" aria-hidden="true">
                      {starsForRating(shop.rating)}
                    </span>
                    <span>
                      {shop.rating.toFixed(1)} · {reviewCountOf(shop)} reviews
                    </span>
                  </>
                ) : (
                  <span className="cafe-rating-unrated">Not yet rated</span>
                )}
              </div>
            </div>
            <CafeStatusButton slug={shop.slug} cafeName={shop.name} />
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

          {isTried(shop.slug) && (
            <div className="cafe-drawer-section">
              <p className="cafe-drawer-section-title">Your tasting note</p>
              {warning && <p className="cafe-drawer-warning">{warning}</p>}
              <label className="cafe-drawer-field">
                <span>Your rating</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  placeholder="Not yet rated"
                  value={noteDraft.rating}
                  onChange={(e) => setNoteDraft((d) => ({ ...d, rating: e.target.value }))}
                  onBlur={() => commitTastedNote()}
                />
              </label>
              <textarea
                className="cafe-drawer-note-textarea"
                placeholder="What did you think?"
                value={noteDraft.comment}
                onChange={(e) => setNoteDraft((d) => ({ ...d, comment: e.target.value }))}
                onBlur={() => commitTastedNote()}
              />
              <div className="cafe-drawer-field">
                <span>Your photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNotePhotosSelected}
                  disabled={uploadingNotePhotos}
                />
                {uploadingNotePhotos && <span className="cafe-drawer-extracting">Uploading…</span>}
                {noteDraft.photos.length > 0 && (
                  <div className="cafe-drawer-photo-thumbs">
                    {noteDraft.photos.map((src, i) => (
                      <div key={i} className="cafe-drawer-photo-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" />
                        <button type="button" onClick={() => removeNotePhoto(i)} aria-label="Remove photo">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {shop.notes && (
            <div className="cafe-drawer-section">
              <p className="cafe-drawer-section-title">Notes</p>
              <p>{shop.notes}</p>
            </div>
          )}

          {shop.signatureDrink && (
            <div className="cafe-drawer-section">
              <p className="cafe-drawer-section-title">Signature</p>
              <p>{shop.signatureDrink}</p>
            </div>
          )}

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
            <button type="button" className="btn btn-primary" onClick={() => onRequestEdit(shop.slug)}>
              Edit
            </button>
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
          <h2 className="cafe-drawer-name">{mode === "add" ? "Add a restaurant" : `Edit ${shop?.name ?? "restaurant"}`}</h2>

          {warning && <p className="cafe-drawer-warning">{warning}</p>}

          <label className="cafe-drawer-field">
            <span>Google Maps link</span>
            <input
              value={form.googleMapsUrl}
              onChange={(e) => setForm((f) => ({ ...f, googleMapsUrl: e.target.value }))}
              onBlur={handleGoogleMapsBlur}
              placeholder="Paste a share link to fill in name, location & cuisine"
            />
            {extracting && <span className="cafe-drawer-extracting">Extracting details…</span>}
          </label>

          <label className="cafe-drawer-field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => {
                autoFilledFieldsRef.current.delete("name");
                setForm((f) => ({ ...f, name: e.target.value }));
              }}
              required
            />
          </label>

          <label className="cafe-drawer-field">
            <span>Country</span>
            <input
              value={form.country}
              onChange={(e) => {
                autoFilledFieldsRef.current.delete("country");
                setForm((f) => ({ ...f, country: e.target.value }));
              }}
              required
            />
          </label>

          {mode === "edit" && (
            <label className="cafe-drawer-field">
              <span>Address</span>
              <input
                value={form.address}
                onChange={(e) => {
                  autoFilledFieldsRef.current.delete("address");
                  setForm((f) => ({ ...f, address: e.target.value }));
                }}
              />
            </label>
          )}

          {mode === "add" && form.lat.trim() !== "" && form.lng.trim() !== "" && (
            <button type="button" className="cafe-drawer-reveal-coords" onClick={revealCoordinateFields}>
              Pin looks wrong? Enter coordinates manually
            </button>
          )}

          {(mode === "edit" || form.lat.trim() === "" || form.lng.trim() === "") && (
            <>
              <div className="cafe-drawer-field-row">
                <label className="cafe-drawer-field">
                  <span>Latitude</span>
                  <input
                    value={form.lat}
                    onChange={(e) => {
                      autoFilledFieldsRef.current.delete("lat");
                      setForm((f) => ({ ...f, lat: e.target.value }));
                    }}
                    inputMode="decimal"
                    required
                  />
                </label>
                <label className="cafe-drawer-field">
                  <span>Longitude</span>
                  <input
                    value={form.lng}
                    onChange={(e) => {
                      autoFilledFieldsRef.current.delete("lng");
                      setForm((f) => ({ ...f, lng: e.target.value }));
                    }}
                    inputMode="decimal"
                    required
                  />
                </label>
              </div>
              {showOobWarning && (
                <p className="cafe-drawer-warning">
                  These coordinates look like they are outside {form.country.trim()} -- double check the pin lands where you expect.
                </p>
              )}
            </>
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
              <span>Cuisine (optional)</span>
              <input
                placeholder="e.g. Italian"
                value={form.cuisine}
                onChange={(e) => {
                  autoFilledFieldsRef.current.delete("cuisine");
                  setForm((f) => ({ ...f, cuisine: e.target.value }));
                }}
              />
            </label>
          </div>

          <label className="cafe-drawer-field">
            <span>Note (optional)</span>
            <textarea
              placeholder="Why you want to try it, who recommended it, etc."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>

          {mode === "edit" && (
            <>
              <label className="cafe-drawer-field">
                <span>Rating (optional)</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="Not yet rated"
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                />
              </label>

              <label className="cafe-drawer-field">
                <span>Signature dish or drink</span>
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
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotosSelected}
                  disabled={uploadingPhotos}
                />
                {uploadingPhotos && <span className="cafe-drawer-extracting">Uploading…</span>}
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
            </>
          )}

          <div className="cafe-drawer-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={extracting || uploadingPhotos}>
              {extracting ? "Extracting…" : uploadingPhotos ? "Uploading…" : mode === "add" ? "Add restaurant" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
