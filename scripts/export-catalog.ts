import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PRIMARY_RESOURCES } from "../lib/primary-resource-catalog.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportCatalog() {
  const outputPath = path.resolve(__dirname, "../../primary_resources.json");
  console.log(`Exporting ${PRIMARY_RESOURCES.length} resources to ${outputPath}...`);
  await fs.writeFile(outputPath, JSON.stringify(PRIMARY_RESOURCES, null, 2), "utf8");
  console.log("Export complete!");
}

exportCatalog().catch((err) => {
  console.error("Failed to export catalog:", err);
  process.exit(1);
});
