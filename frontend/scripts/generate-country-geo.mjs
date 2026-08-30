#!/usr/bin/env node
/**
 * Generates public/<slug>-geo.json in the same shape ScrapbookMap.tsx
 * already expects: a FeatureCollection whose first feature is the target
 * country (matched by name in src/lib/countries.ts) and the rest are
 * neighbouring countries, drawn as pale context silhouettes.
 *
 * Source data is world-atlas's Natural-Earth-derived TopoJSON (50m
 * resolution) -- the same source public/singapore-geo.json was originally
 * generated from (world-atlas + topojson-client are already project
 * dependencies for exactly this reason).
 *
 * Usage:
 *   node scripts/generate-country-geo.mjs <slug> <name> <isoNumericId> [neighbourId:neighbourName ...]
 *
 * Example (already run for Japan):
 *   node scripts/generate-country-geo.mjs japan Japan 392 410:"South Korea" 158:Taiwan
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as topojson from "topojson-client";
import topology from "world-atlas/countries-50m.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

const [slug, name, id, ...neighbourArgs] = process.argv.slice(2);
if (!slug || !name || !id) {
  console.error("Usage: node scripts/generate-country-geo.mjs <slug> <name> <isoNumericId> [neighbourId:neighbourName ...]");
  process.exit(1);
}

const geometries = topology.objects.countries.geometries;

function featureFor(isoId, displayName) {
  const geometry = geometries.find((g) => g.id === String(isoId));
  if (!geometry) throw new Error(`No geometry found for ISO numeric id ${isoId}`);
  const feature = topojson.feature(topology, geometry);
  feature.properties = { name: displayName };
  return feature;
}

const neighbours = neighbourArgs.map((arg) => {
  const [neighbourId, ...nameParts] = arg.split(":");
  return featureFor(neighbourId, nameParts.join(":"));
});

const collection = {
  type: "FeatureCollection",
  features: [featureFor(id, name), ...neighbours],
};

const outPath = resolve(__dirname, "..", "public", `${slug}-geo.json`);
writeFileSync(outPath, JSON.stringify(collection));
console.log(`Wrote ${outPath} (${collection.features.length} features)`);
