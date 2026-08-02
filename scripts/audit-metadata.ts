import { PRIMARY_RESOURCES } from "../lib/primary-resource-catalog.ts";

// Curated themes from primary-theme-content
const THEMES_BY_SUBJECT: Record<string, string[]> = {
  English: ["My Family", "My School", "Animals", "Fruits & Vegetables", "Colours", "Shapes", "My Body", "Seasons & Weather"],
  Hindi: ["मेरा परिवार", "मेरा विद्यालय", "पशु", "फल", "रंग", "ऋतुएँ"],
  Maths: ["Numbers 1-10", "Numbers 11-20", "Shapes", "Patterns", "Counting", "Measurement", "Money", "Time"],
  EVS: ["My Family", "My School", "Plants", "Animals", "My Body", "Seasons & Weather", "Food", "Transport", "Community Helpers", "Water"],
  "General Knowledge": ["Myself", "My Neighbourhood", "Festivals of India", "National Symbols", "Community Helpers", "Transport"],
  "Art & Craft": ["Colours", "Shapes", "Paper Craft", "Drawing & Painting", "Festivals & Celebrations"],
  "Music & Movement": ["Rhymes & Poems", "Action Songs", "Dance & Movement", "Yoga & Mindfulness"],
  "Physical Education": ["Sports & Games", "Gross Motor Skills", "Team Games", "Yoga & Mindfulness"],
};

function audit() {
  console.log("=== METADATA AUDIT REPORT ===\n");

  // 1. Subjects in curated themes
  const curatedSubjects = Object.keys(THEMES_BY_SUBJECT);
  console.log("Subjects in Curated Themes:");
  console.log(curatedSubjects.join(", "));
  console.log();

  // 2. Subjects used in resource catalogue
  const catalogSubjects = new Set<string>();
  const resourcesWithNoSubject: string[] = [];
  const resourcesWithNoLevel: string[] = [];
  const resourcesWithNoTheme: string[] = [];

  for (const r of PRIMARY_RESOURCES) {
    if (!r.subjects || r.subjects.length === 0) {
      resourcesWithNoSubject.push(r.id);
    } else {
      r.subjects.forEach((s) => catalogSubjects.add(s));
    }

    if (!r.levels || r.levels.length === 0) {
      resourcesWithNoLevel.push(r.id);
    }

    if (!r.themes || r.themes.length === 0) {
      resourcesWithNoTheme.push(r.id);
    }
  }

  console.log("Subjects in Resource Catalogue:");
  console.log(Array.from(catalogSubjects).join(", "));
  console.log();

  // 3. Subject aliases/mismatches
  const mismatches: string[] = [];
  for (const s of catalogSubjects) {
    if (!curatedSubjects.includes(s)) {
      mismatches.push(`Catalogue subject "${s}" is not in curated subjects.`);
    }
  }
  for (const s of curatedSubjects) {
    if (!catalogSubjects.has(s)) {
      mismatches.push(`Curated subject "${s}" has no entries in the catalogue.`);
    }
  }
  console.log("Subject Mismatches:");
  if (mismatches.length > 0) {
    mismatches.forEach((m) => console.log(`  - ${m}`));
  } else {
    console.log("None");
  }
  console.log();

  // 4. Empty/missing fields in resources
  console.log(`Resources with no subject: ${resourcesWithNoSubject.length}`);
  if (resourcesWithNoSubject.length > 0) {
    console.log(`  - Sample IDs: ${resourcesWithNoSubject.slice(0, 5).join(", ")}`);
  }
  console.log(`Resources with no level: ${resourcesWithNoLevel.length}`);
  if (resourcesWithNoLevel.length > 0) {
    console.log(`  - Sample IDs: ${resourcesWithNoLevel.slice(0, 5).join(", ")}`);
  }
  console.log(`Resources with no theme: ${resourcesWithNoTheme.length}`);
  if (resourcesWithNoTheme.length > 0) {
    console.log(`  - Sample IDs: ${resourcesWithNoTheme.slice(0, 5).join(", ")}`);
  }
  console.log();

  // 5. Casing and spacing checks for themes
  const allCatalogueThemes = new Set<string>();
  const catalogThemeCasingCount = new Map<string, string[]>(); // Normalized -> actuals
  const themesWithExtraSpaces: string[] = [];

  for (const r of PRIMARY_RESOURCES) {
    if (r.themes) {
      for (const t of r.themes) {
        allCatalogueThemes.add(t);
        const trimmed = t.trim();
        if (t !== trimmed || /\s{2,}/.test(t)) {
          if (!themesWithExtraSpaces.includes(t)) {
            themesWithExtraSpaces.push(t);
          }
        }
        const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");
        const list = catalogThemeCasingCount.get(normalized) ?? [];
        if (!list.includes(t)) {
          list.push(t);
        }
        catalogThemeCasingCount.set(normalized, list);
      }
    }
  }

  const themesWithInconsistentCasing: string[][] = [];
  for (const [norm, list] of catalogThemeCasingCount.entries()) {
    if (list.length > 1) {
      themesWithInconsistentCasing.push(list);
    }
  }

  console.log("Theme Casing & Spacing Anomalies:");
  console.log(`Themes with inconsistent casing: ${themesWithInconsistentCasing.length}`);
  if (themesWithInconsistentCasing.length > 0) {
    themesWithInconsistentCasing.forEach((list) => console.log(`  - ${JSON.stringify(list)}`));
  }
  console.log(`Themes with extra, leading or trailing spaces: ${themesWithExtraSpaces.length}`);
  if (themesWithExtraSpaces.length > 0) {
    themesWithExtraSpaces.forEach((t) => console.log(`  - "${t}"`));
  }
  console.log();

  // 6. Curated themes missing from catalogue metadata (by subject)
  console.log("Curated Themes Missing from Catalogue Metadata:");
  let totalMissing = 0;
  for (const [subject, themes] of Object.entries(THEMES_BY_SUBJECT)) {
    const catalogThemesForSubject = new Set<string>();
    PRIMARY_RESOURCES.forEach((r) => {
      if (r.subjects.includes(subject) && r.themes) {
        r.themes.forEach((t) => catalogThemesForSubject.add(t.trim().toLowerCase().replace(/\s+/g, " ")));
      }
    });

    const missingInSubject: string[] = [];
    for (const ct of themes) {
      const normalizedCt = ct.trim().toLowerCase().replace(/\s+/g, " ");
      if (!catalogThemesForSubject.has(normalizedCt)) {
        missingInSubject.push(ct);
        totalMissing++;
      }
    }
    if (missingInSubject.length > 0) {
      console.log(`  Subject "${subject}": ${missingInSubject.join(", ")}`);
    }
  }
  console.log(`Total missing curated themes: ${totalMissing}\n`);

  // 7. Curated and catalogue themes with ZERO compatible resources
  // A theme is compatible if at least one resource has the subject, level, and that theme
  console.log("Curated Themes with ZERO compatible resources (by level & subject):");
  const levels = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];
  let zeroCompatibleCount = 0;

  for (const [subject, themes] of Object.entries(THEMES_BY_SUBJECT)) {
    for (const theme of themes) {
      const normalizedTheme = theme.trim().toLowerCase().replace(/\s+/g, " ");
      // Check if there is ANY level for which this theme has resources
      let hasAnyResource = false;
      for (const level of levels) {
        const matches = PRIMARY_RESOURCES.some((r) => {
          return r.subjects.includes(subject) &&
            r.levels.includes(level) &&
            r.themes.some((t) => t.trim().toLowerCase().replace(/\s+/g, " ") === normalizedTheme);
        });
        if (matches) {
          hasAnyResource = true;
          break;
        }
      }
      if (!hasAnyResource) {
        console.log(`  - Curated Theme "${theme}" in Subject "${subject}" has 0 resources in catalog across all levels`);
        zeroCompatibleCount++;
      }
    }
  }
  console.log(`Total curated themes with zero resources: ${zeroCompatibleCount}`);
}

audit();
