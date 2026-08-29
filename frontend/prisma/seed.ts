import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cafes } from "../src/data/cafes";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const cafe of cafes) {
    await prisma.cafe.upsert({
      where: { slug: cafe.slug },
      update: {},
      create: {
        slug: cafe.slug,
        name: cafe.name,
        country: cafe.country,
        publicRating: cafe.rating ?? null,
        reviewCount: cafe.reviewCount,
        signatureDrink: cafe.signatureDrink,
        cuisine: cafe.cuisine ?? null,
        notes: cafe.notes ?? null,
        priceTier: cafe.priceTier,
        lat: cafe.location.lat,
        lng: cafe.location.lng,
        address: cafe.location.address,
        matchaOrigin: cafe.matchaOrigin ?? null,
        matchaGrade: cafe.matchaGrade ?? null,
        flavorTags: cafe.flavorTags ?? [],
        flavorScores: cafe.flavorScores ?? undefined,
        prepStyles: cafe.prepStyles ?? [],
        editorsPick: cafe.editorsPick ?? false,
        rank: cafe.rank ?? null,
        coverImage: cafe.coverImage ?? null,
        photos: cafe.photos ?? [],
        googleMapsUrl: cafe.googleMapsUrl ?? null,
        popularDishes: cafe.popularDishes ?? [],
        reviews: cafe.reviews ?? [],
        status: null,
      },
    });
  }
  console.log(`Seeded ${cafes.length} cafes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
