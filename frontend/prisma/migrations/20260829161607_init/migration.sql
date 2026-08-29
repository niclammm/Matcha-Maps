-- CreateTable
CREATE TABLE "Cafe" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "publicRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "signatureDrink" TEXT NOT NULL,
    "cuisine" TEXT,
    "notes" TEXT,
    "priceTier" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "matchaOrigin" TEXT,
    "matchaGrade" TEXT,
    "flavorTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flavorScores" JSONB,
    "prepStyles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "editorsPick" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "coverImage" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "googleMapsUrl" TEXT,
    "popularDishes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviews" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT,
    "tastedRating" DOUBLE PRECISION,
    "tastedComment" TEXT,
    "tastedPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tastedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cafe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cafe_slug_key" ON "Cafe"("slug");
