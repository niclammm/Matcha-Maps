import { prisma } from "@/lib/prisma";
import { cafePatchToUpdateData, type CafePatch, newCafeInputToCreateData, rowToShop } from "@/lib/cafe-mapping";
import { uniqueSlug } from "@/lib/cafe-helpers";
import type { MergedShop, NewCafeInput } from "@/lib/types";

export async function getAllCafes(): Promise<MergedShop[]> {
  const rows = await prisma.cafe.findMany({ orderBy: { name: "asc" } });
  return rows.map(rowToShop);
}

export async function createCafe(input: NewCafeInput): Promise<MergedShop> {
  const existing = await prisma.cafe.findMany({ select: { slug: true } });
  const slug = uniqueSlug(input.name, existing.map((r) => r.slug));
  const row = await prisma.cafe.create({ data: newCafeInputToCreateData(input, slug) });
  return rowToShop(row);
}

export async function updateCafeBySlug(slug: string, patch: CafePatch): Promise<MergedShop | null> {
  try {
    const row = await prisma.cafe.update({ where: { slug }, data: cafePatchToUpdateData(patch) });
    return rowToShop(row);
  } catch {
    return null;
  }
}

export async function deleteCafeBySlug(slug: string): Promise<boolean> {
  try {
    await prisma.cafe.delete({ where: { slug } });
    return true;
  } catch {
    return false;
  }
}
