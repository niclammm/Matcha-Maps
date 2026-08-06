export type MatchaGrade = "ceremonial" | "premium" | "culinary" | "unknown";

export type FlavorScores = {
  umami: number;
  floral: number;
  nutty: number;
  bitter: number;
  sweet: number;
};

export type Shop = {
  id: string;
  slug: string;
  name: string;
  area: string;
  rating: number;
  reviewCount: number;
  signatureDrink: string;
  priceTier: 1 | 2 | 3;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  matchaOrigin?: string;
  matchaGrade?: MatchaGrade;
  flavorTags?: string[];
  flavorScores?: FlavorScores;
  prepStyles?: string[];
  editorsPick?: boolean;
  rank?: number;
  coverImage?: string;
};
