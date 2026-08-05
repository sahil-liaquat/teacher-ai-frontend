import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Since we are running under ESM and Node's strip-types, we can import the catalog.
import { PRIMARY_RESOURCES } from "../lib/primary-resource-catalog.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, "../public");
const RESOURCES_DIR = path.resolve(PUBLIC_DIR, "primary-resources");

async function getFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = [];
  async function scan(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        // Get relative path from public directory starting with /primary-resources
        const relative = path.relative(PUBLIC_DIR, fullPath);
        // Normalize slashes for URL matching
        files.push("/" + relative.replace(/\\/g, "/"));
      }
    }
  }
  await scan(dir);
  return files;
}

async function validate() {
  console.log("=== Primary Resources Catalog Validation ===");
  
  // 1. Catalogue count
  const catalogCount = PRIMARY_RESOURCES.length;
  console.log(`Catalogue record count: ${catalogCount}`);

  // 2. Physical file count
  let physicalFiles: string[] = [];
  try {
    physicalFiles = await getFilesRecursively(RESOURCES_DIR);
  } catch (err: any) {
    console.error("Error reading primary resources folder:", err.message);
  }
  console.log(`Physical file count under public/primary-resources: ${physicalFiles.length}`);

  // 3. Duplicate IDs
  const idCounts = new Map<string, number>();
  for (const r of PRIMARY_RESOURCES) {
    idCounts.set(r.id, (idCounts.get(r.id) ?? 0) + 1);
  }
  const duplicateIds = Array.from(idCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([id]) => id);
  console.log(`Duplicate resource IDs: ${duplicateIds.length ? duplicateIds.join(", ") : "None"}`);

  // 4. Duplicate file URLs
  const urlCounts = new Map<string, number>();
  for (const r of PRIMARY_RESOURCES) {
    if (r.fileUrl) {
      urlCounts.set(r.fileUrl, (urlCounts.get(r.fileUrl) ?? 0) + 1);
    }
  }
  const duplicateUrls = Array.from(urlCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([url]) => url);
  console.log(`Duplicate file URLs: ${duplicateUrls.length ? duplicateUrls.join(", ") : "None"}`);

  // 5. Missing files (referenced in catalogue but not found physically)
  const missingFiles: string[] = [];
  const catalogUrls = new Set<string>();
  const catalogThumbnailUrls = new Set<string>();

  for (const r of PRIMARY_RESOURCES) {
    if (r.fileUrl) {
      const decodedUrl = decodeURIComponent(r.fileUrl);
      catalogUrls.add(decodedUrl);
      if (!physicalFiles.includes(decodedUrl)) {
        missingFiles.push(`Resource ID "${r.id}" has missing fileUrl: ${decodedUrl} (catalog raw: ${r.fileUrl})`);
      }
    }
    if (r.thumbnailUrl) {
      const decodedThumb = decodeURIComponent(r.thumbnailUrl);
      catalogThumbnailUrls.add(decodedThumb);
      if (!physicalFiles.includes(decodedThumb)) {
        missingFiles.push(`Resource ID "${r.id}" has missing thumbnailUrl: ${decodedThumb} (catalog raw: ${r.thumbnailUrl})`);
      }
    }
  }
  console.log(`Catalogue entries with missing files: ${missingFiles.length}`);
  if (missingFiles.length > 0) {
    missingFiles.forEach(m => console.log(`  - ${m}`));
  }

  // 6. Unreferenced files (files present physically but not referenced by any catalogue entries)
  const unreferencedFiles = physicalFiles.filter(
    (file) => !catalogUrls.has(file) && !catalogThumbnailUrls.has(file)
  );
  console.log(`Physical files not referenced by the catalogue: ${unreferencedFiles.length}`);
  if (unreferencedFiles.length > 0) {
    unreferencedFiles.slice(0, 10).forEach(u => console.log(`  - ${u}`));
    if (unreferencedFiles.length > 10) {
      console.log(`  ... and ${unreferencedFiles.length - 10} more`);
    }
  }

  // 7. Explaining the 861 vs 862 discrepancy
  console.log("\n=== Discrepancy analysis (861 vs 862) ===");
  console.log(`Catalog contains: ${catalogCount} entries.`);
  
  // Let's filter catalog entries that have actual file URLs
  const entriesWithFile = PRIMARY_RESOURCES.filter(r => r.fileUrl);
  console.log(`Catalog entries with fileUrl: ${entriesWithFile.length}`);
  
  const entriesWithoutFile = PRIMARY_RESOURCES.filter(r => !r.fileUrl);
  console.log(`Catalog entries without fileUrl: ${entriesWithoutFile.length}`);
  if (entriesWithoutFile.length > 0) {
    console.log("Entries without fileUrl:");
    entriesWithoutFile.forEach(e => console.log(`  - ID: ${e.id}, Title: ${e.title}`));
  }
  
  // Unique file URLs count
  console.log(`Unique fileUrl references in catalog (decoded): ${catalogUrls.size}`);
}

validate().catch(err => console.error(err));
