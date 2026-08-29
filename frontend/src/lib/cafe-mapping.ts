import type { Cafe as CafeRow } from "@/generated/prisma/client";
import type { CafeReview, FlavorScores, MatchaGrade, MergedShop, NewCafeInput } from "@/lib/types";

/** The PATCH body shape for /api/cafes/[slug]: any subset of the
 * add/edit-restaurant fields, plus the two things that aren't part of that
 * form -- bucket status and the personal tasted note.
 *
 * A key that's simply absent means "don't touch this field" (see
 * `cafePatchToUpdateData`'s `!== undefined` checks); an optional field
 * that's present but explicitly `null` means "clear it". This is why the
 * nullable fields below widen their type past `Partial<NewCafeInput>`
 * (which only allows `T | undefined`, i.e. omitted) to also allow `T |
 * null` -- callers that want to clear a field over PATCH (unlike the
 * add-restaurant form, which only ever omits) must be able to say so, since
 * `JSON.stringify` silently drops `undefined` keys entirely. */
export type CafePatch = Omit<
  Partial<NewCafeInput>,
  "rating" | "cuisine" | "notes" | "googleMapsUrl" | "matchaOrigin" | "popularDishes" | "photos" | "reviews" | "flavorTags"
> & {
  rating?: number | null;
  cuisine?: string | null;
  notes?: string | null;
  googleMapsUrl?: string | null;
  matchaOrigin?: string | null;
  popularDishes?: string[] | null;
  photos?: string[] | null;
  reviews?: NewCafeInput["reviews"] | null;
  flavorTags?: string[] | null;
  status?: "wishlist" | "tasted" | null;
  tastedRating?: number | null;
  tastedComment?: string;
  tastedPhotos?: string[];
};

export function rowToShop(row: CafeRow): MergedShop {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    rating: row.publicRating ?? undefined,
    reviewCount: row.reviewCount,
    signatureDrink: row.signatureDrink,
    cuisine: row.cuisine ?? undefined,
    notes: row.notes ?? undefined,
    priceTier: row.priceTier as 1 | 2 | 3,
    location: { lat: row.lat, lng: row.lng, address: row.address },
    matchaOrigin: row.matchaOrigin ?? undefined,
    matchaGrade: (row.matchaGrade as MatchaGrade | null) ?? undefined,
    flavorTags: row.flavorTags.length ? row.flavorTags : undefined,
    flavorScores: (row.flavorScores as unknown as FlavorScores | null) ?? undefined,
    prepStyles: row.prepStyles.length ? row.prepStyles : undefined,
    editorsPick: row.editorsPick,
    rank: row.rank ?? undefined,
    coverImage: row.coverImage ?? undefined,
    photos: row.photos.length ? row.photos : undefined,
    googleMapsUrl: row.googleMapsUrl ?? undefined,
    popularDishes: row.popularDishes.length ? row.popularDishes : undefined,
    reviews: (row.reviews as unknown as CafeReview[]) ?? [],
    status: (row.status as "wishlist" | "tasted" | null) ?? null,
    tastedRating: row.tastedRating ?? null,
    tastedComment: row.tastedComment ?? "",
    tastedPhotos: row.tastedPhotos ?? [],
  };
}

export function newCafeInputToCreateData(input: NewCafeInput, slug: string) {
  return {
    slug,
    name: input.name,
    country: input.country,
    publicRating: input.rating ?? null,
    reviewCount: input.reviewCount ?? input.reviews?.length ?? 0,
    signatureDrink: input.signatureDrink,
    cuisine: input.cuisine ?? null,
    notes: input.notes ?? null,
    priceTier: input.priceTier,
    lat: input.location.lat,
    lng: input.location.lng,
    address: input.location.address,
    matchaOrigin: input.matchaOrigin ?? null,
    matchaGrade: input.matchaGrade ?? null,
    flavorTags: input.flavorTags ?? [],
    flavorScores: input.flavorScores ?? undefined,
    prepStyles: input.prepStyles ?? [],
    editorsPick: input.editorsPick ?? false,
    rank: input.rank ?? null,
    coverImage: input.coverImage ?? null,
    photos: input.photos ?? [],
    googleMapsUrl: input.googleMapsUrl ?? null,
    popularDishes: input.popularDishes ?? [],
    reviews: input.reviews ?? [],
    status: null,
  };
}

/** Builds a Prisma `data` object containing only the keys actually present
 * in `patch`, so a partial PATCH (e.g. just `{ status: "tasted" }`) never
 * clobbers fields it wasn't sent for. */
export function cafePatchToUpdateData(patch: CafePatch): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (patch.name !== undefined) data.name = patch.name;
  if (patch.country !== undefined) data.country = patch.country;
  if (patch.rating !== undefined) data.publicRating = patch.rating ?? null;
  if (patch.reviewCount !== undefined) data.reviewCount = patch.reviewCount;
  if (patch.signatureDrink !== undefined) data.signatureDrink = patch.signatureDrink;
  if (patch.cuisine !== undefined) data.cuisine = patch.cuisine ?? null;
  if (patch.notes !== undefined) data.notes = patch.notes ?? null;
  if (patch.priceTier !== undefined) data.priceTier = patch.priceTier;
  if (patch.location !== undefined) {
    data.lat = patch.location.lat;
    data.lng = patch.location.lng;
    data.address = patch.location.address;
  }
  if (patch.matchaOrigin !== undefined) data.matchaOrigin = patch.matchaOrigin ?? null;
  if (patch.matchaGrade !== undefined) data.matchaGrade = patch.matchaGrade ?? null;
  if (patch.flavorTags !== undefined) data.flavorTags = patch.flavorTags ?? [];
  if (patch.flavorScores !== undefined) data.flavorScores = patch.flavorScores ?? null;
  if (patch.prepStyles !== undefined) data.prepStyles = patch.prepStyles ?? [];
  if (patch.editorsPick !== undefined) data.editorsPick = patch.editorsPick;
  if (patch.rank !== undefined) data.rank = patch.rank ?? null;
  if (patch.coverImage !== undefined) data.coverImage = patch.coverImage ?? null;
  if (patch.photos !== undefined) data.photos = patch.photos ?? [];
  if (patch.googleMapsUrl !== undefined) data.googleMapsUrl = patch.googleMapsUrl ?? null;
  if (patch.popularDishes !== undefined) data.popularDishes = patch.popularDishes ?? [];
  if (patch.reviews !== undefined) data.reviews = patch.reviews ?? [];

  if (patch.status !== undefined) {
    data.status = patch.status;
    data.tastedAt = patch.status === "tasted" ? new Date() : null;
  }
  if (patch.tastedRating !== undefined) data.tastedRating = patch.tastedRating;
  if (patch.tastedComment !== undefined) data.tastedComment = patch.tastedComment;
  if (patch.tastedPhotos !== undefined) data.tastedPhotos = patch.tastedPhotos;

  return data;
}
