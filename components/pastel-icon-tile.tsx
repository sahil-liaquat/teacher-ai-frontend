import { cn } from "@/lib/utils";

const TILE_BASE = "/assets/teachpad-theme/teachpad_ai_tools_assets/pastel-icon-tiles";

export const pastelIconTiles = {
  arrowRight: `${TILE_BASE}/arrow-right-tile.svg`,
  bell: `${TILE_BASE}/bell-tile.svg`,
  bookOpen: `${TILE_BASE}/book-open-tile.svg`,
  calendarDays: `${TILE_BASE}/calendar-days-tile.svg`,
  checkCircle: `${TILE_BASE}/check-circle2-tile.svg`,
  chevronDown: `${TILE_BASE}/chevron-down-tile.svg`,
  clipboardList: `${TILE_BASE}/clipboard-list-tile.svg`,
  fileText: `${TILE_BASE}/file-text-tile.svg`,
  folderOpen: `${TILE_BASE}/folder-open-tile.svg`,
  graduationCap: `${TILE_BASE}/graduation-cap-tile.svg`,
  image: `${TILE_BASE}/image-icon-tile.svg`,
  layers: `${TILE_BASE}/layers3-tile.svg`,
  dashboard: `${TILE_BASE}/layout-dashboard-tile.svg`,
  menu: `${TILE_BASE}/menu-tile.svg`,
  message: `${TILE_BASE}/message-circle-tile.svg`,
  mic: `${TILE_BASE}/mic-tile.svg`,
  notebookPen: `${TILE_BASE}/notebook-pen-tile.svg`,
  penLine: `${TILE_BASE}/pen-line-tile.svg`,
  play: `${TILE_BASE}/play-tile.svg`,
  presentation: `${TILE_BASE}/presentation-tile.svg`,
  search: `${TILE_BASE}/search-tile.svg`,
  settings: `${TILE_BASE}/settings-tile.svg`,
  shieldCheck: `${TILE_BASE}/shield-check-tile.svg`,
  sparkles: `${TILE_BASE}/sparkles-tile.svg`,
  target: `${TILE_BASE}/target-tile.svg`,
  wandSparkles: `${TILE_BASE}/wand-sparkles-tile.svg`
} as const;

export type PastelIconTileName = keyof typeof pastelIconTiles;

export function PastelIconTile({
  name,
  alt = "",
  className
}: {
  name: PastelIconTileName;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={pastelIconTiles[name]}
      alt={alt}
      className={cn("h-11 w-11 shrink-0 rounded-2xl object-contain", className)}
      aria-hidden={alt ? undefined : true}
    />
  );
}
