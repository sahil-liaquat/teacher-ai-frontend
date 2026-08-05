export type PrimaryBuiltInHero = {
  id: string;
  name: string;
  src: string;
  aliases: string[];
};

const HERO_ROOT = "/assets/primary/heroes";

export const PRIMARY_BUILT_IN_HEROES: PrimaryBuiltInHero[] = [
  { id: "farm-animals", name: "Farm Animals", src: `${HERO_ROOT}/farm-animals.webp`, aliases: ["farm", "farmyard", "domestic animals"] },
  { id: "jungle-animals", name: "Jungle Animals", src: `${HERO_ROOT}/jungle-animals.webp`, aliases: ["jungle", "wild animals", "zoo animals"] },
  { id: "ocean-world", name: "Ocean World", src: `${HERO_ROOT}/ocean-world.webp`, aliases: ["ocean", "sea", "underwater", "marine life"] },
  { id: "birds", name: "Birds", src: `${HERO_ROOT}/birds.webp`, aliases: ["bird", "feathers", "flying animals"] },
  { id: "my-family", name: "My Family", src: `${HERO_ROOT}/my-family.webp`, aliases: ["family", "families", "home"] },
  { id: "my-school", name: "My School", src: `${HERO_ROOT}/my-school.webp`, aliases: ["school", "classroom", "campus"] },
  { id: "fruits-vegetables", name: "Fruits & Vegetables", src: `${HERO_ROOT}/fruits-vegetables.webp`, aliases: ["fruit", "vegetable", "food", "healthy eating"] },
  { id: "transport", name: "Transport", src: `${HERO_ROOT}/transport.webp`, aliases: ["transportation", "vehicles", "travel", "traffic"] },
  { id: "community-helpers", name: "Community Helpers", src: `${HERO_ROOT}/community-helpers.webp`, aliases: ["helpers", "occupations", "professions", "people who help us"] },
  { id: "plants-nature", name: "Plants & Nature", src: `${HERO_ROOT}/plants-nature.webp`, aliases: ["plants", "nature", "garden", "trees"] },
  { id: "seasons-weather", name: "Seasons & Weather", src: `${HERO_ROOT}/seasons-weather.webp`, aliases: ["season", "weather", "rain", "summer", "winter"] },
  { id: "festivals-celebrations", name: "Festivals & Celebrations", src: `${HERO_ROOT}/festivals-celebrations.webp`, aliases: ["festival", "celebration", "festivals"] },
];

export const DEFAULT_PRIMARY_HERO_URL = PRIMARY_BUILT_IN_HEROES[0].src;

function normalized(value: string) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export function builtInHeroForThemeName(themeName: string): PrimaryBuiltInHero {
  const query = normalized(themeName);
  if (!query) return PRIMARY_BUILT_IN_HEROES[0];

  return PRIMARY_BUILT_IN_HEROES.find((hero) =>
    [hero.name, ...hero.aliases].some((candidate) => {
      const value = normalized(candidate);
      return query === value || query.includes(value) || value.includes(query);
    })
  ) ?? PRIMARY_BUILT_IN_HEROES[0];
}

export function isBuiltInPrimaryHero(value?: string | null) {
  return PRIMARY_BUILT_IN_HEROES.some((hero) => hero.src === value);
}
