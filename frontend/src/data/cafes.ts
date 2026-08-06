import type { Shop } from "@/lib/types";

export const cafes: Shop[] = [
  {
    id: "1",
    slug: "enishi-matcha-house",
    name: "Enishi Matcha House",
    area: "Tiong Bahru",
    rating: 4.9,
    reviewCount: 340,
    signatureDrink: "Ceremonial Koicha",
    priceTier: 3,
    location: {
      lat: 1.2855,
      lng: 103.8322,
      address: "40 Eng Watt St, Singapore 160040",
    },
    matchaOrigin: "Uji, Kyoto",
    matchaGrade: "ceremonial",
    flavorTags: ["umami", "floral", "nutty"],
    flavorScores: { umami: 4.5, floral: 4, nutty: 3.5, bitter: 2, sweet: 2.5 },
    prepStyles: ["koicha", "usucha"],
    editorsPick: true,
    rank: 1,
    coverImage: "/matcha-pictures/web/matcha_2.png",
  },
  {
    id: "2",
    slug: "matchaya",
    name: "Matchaya",
    area: "Bugis",
    rating: 4.6,
    reviewCount: 520,
    signatureDrink: "Matcha Latte",
    priceTier: 2,
    location: {
      lat: 1.3006,
      lng: 103.8558,
      address: "9 Raffles Ave, Singapore 039596",
    },
    matchaOrigin: "Nishio, Aichi",
    matchaGrade: "premium",
    flavorTags: ["sweet", "creamy"],
    prepStyles: ["latte", "soft-serve"],
    editorsPick: false,
    rank: 3,
    coverImage: "/matcha-pictures/web/matcha_10.png",
  },
  {
    id: "3",
    slug: "hvala",
    name: "Hvala",
    area: "Orchard",
    rating: 4.4,
    reviewCount: 890,
    signatureDrink: "Matcha Frappe",
    priceTier: 2,
    location: {
      lat: 1.3048,
      lng: 103.8318,
      address: "583 Orchard Rd, Singapore 238884",
    },
    flavorTags: ["sweet", "grassy"],
    prepStyles: ["latte", "frappe"],
    coverImage: "/matcha-pictures/web/matcha_16.png",
  },
  {
    id: "4",
    slug: "nana-thai-green-tea",
    name: "Nana's Green Tea",
    area: "Jurong East",
    rating: 4.3,
    reviewCount: 210,
    signatureDrink: "Matcha Shiratama Float",
    priceTier: 2,
    location: {
      lat: 1.333,
      lng: 103.7436,
      address: "3 Gateway Dr, Singapore 608532",
    },
    matchaOrigin: "Kagoshima",
    flavorTags: ["grassy", "bitter"],
    prepStyles: ["latte", "dessert"],
    coverImage: "/matcha-pictures/web/matcha_8.png",
  },
  {
    id: "5",
    slug: "the-matcha-project",
    name: "The Matcha Project",
    area: "Chinatown",
    rating: 4.7,
    reviewCount: 156,
    signatureDrink: "Single-Origin Usucha",
    priceTier: 3,
    location: {
      lat: 1.2835,
      lng: 103.8445,
      address: "48 Pagoda St, Singapore 059207",
    },
    matchaOrigin: "Wazuka, Kyoto",
    matchaGrade: "ceremonial",
    flavorTags: ["umami", "marine", "floral"],
    flavorScores: { umami: 4.8, floral: 3.5, nutty: 2, bitter: 3, sweet: 1.5 },
    prepStyles: ["usucha", "koicha"],
    editorsPick: true,
    rank: 2,
    coverImage: "/matcha-pictures/web/matcha_19.png",
  },
];

export function getTopRanked(limit = 3): Shop[] {
  return [...cafes]
    .filter((c) => c.rank != null)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, limit);
}

export function getCafeBySlug(slug: string): Shop | undefined {
  return cafes.find((cafe) => cafe.slug === slug);
}

export function getCafesBySlugs(slugs: string[]): Shop[] {
  return slugs
    .map((slug) => getCafeBySlug(slug))
    .filter((cafe): cafe is Shop => cafe != null);
}
