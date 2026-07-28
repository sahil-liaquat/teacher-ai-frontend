"use client";

import { Award, Download, Share2, X } from "lucide-react";
import type { StreakBadgeTier, StreakReward } from "@/lib/api";
import { cn } from "@/lib/utils";

const tierStyle: Record<StreakBadgeTier, { ring: string; fill: string; text: string; accent: string }> = {
  bronze: { ring: "ring-amber-200", fill: "from-amber-100 to-orange-200", text: "text-amber-900", accent: "#b66728" },
  silver: { ring: "ring-slate-200", fill: "from-slate-100 to-slate-300", text: "text-slate-800", accent: "#64748b" },
  gold: { ring: "ring-yellow-200", fill: "from-yellow-100 to-amber-300", text: "text-amber-950", accent: "#d49b00" },
  champion: { ring: "ring-violet-200", fill: "from-violet-100 via-fuchsia-100 to-amber-200", text: "text-violet-950", accent: "#7c3aed" },
};

const badgeArtwork: Partial<Record<StreakBadgeTier, string>> = {
  bronze: "/assets/streak/bronze-badge.webp",
  silver: "/assets/streak/silver-badge.webp",
  gold: "/assets/streak/gold-badge.webp",
};

const artworkSurface: Record<StreakBadgeTier, string> = {
  bronze: "border-[#f3d1ac] bg-[radial-gradient(circle_at_50%_45%,#fff9f0_0%,#fff3e2_58%,#f8e2c8_100%)]",
  silver: "border-[#d8e0ea] bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f3f6fa_58%,#dfe6ef_100%)]",
  gold: "border-[#f2d477] bg-[radial-gradient(circle_at_50%_45%,#fffdf3_0%,#fff4c8_58%,#f6dda0_100%)]",
  champion: "border-[#d8c7f7] bg-[linear-gradient(135deg,#071b49_0%,#123875_55%,#7a5514_140%)]",
};

export function TeachingBadge({ tier, label, compact = false }: { tier: StreakBadgeTier; label: string; compact?: boolean }) {
  const style = tierStyle[tier];
  const artwork = badgeArtwork[tier];
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full bg-gradient-to-br font-black shadow-sm ring-1", style.fill, style.ring, style.text, compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs")}>
      {artwork ? <img src={artwork} alt="" aria-hidden="true" className={cn("shrink-0 object-contain drop-shadow-sm", compact ? "h-5 w-5" : "h-6 w-6")} /> : <Award className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />}
      <span>{label}</span>
    </div>
  );
}

export function RewardArtwork({ tier, muted = false, className }: { tier: StreakBadgeTier; muted?: boolean; className?: string }) {
  const isChampion = tier === "champion";
  const src = isChampion ? "/assets/streak/champion-certificate.webp" : badgeArtwork[tier];
  return (
    <div className={cn("relative grid place-items-center overflow-hidden rounded-[15px] border shadow-inner", isChampion ? "aspect-[4/3]" : "h-28 min-[390px]:h-32", artworkSurface[tier], muted && "opacity-85 saturate-[.82]", className)}>
      <span aria-hidden="true" className="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-white/45 blur-2xl" />
      <span aria-hidden="true" className="absolute -bottom-12 -right-8 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
      {src && <img src={src} alt={isChampion ? "TeachPad Champion Teacher certificate artwork" : `${tier} Consistent Teacher badge`} className={cn("relative z-10 object-contain", isChampion ? "h-full w-full rounded-[10px] p-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.2)]" : "h-28 w-28 drop-shadow-[0_12px_14px_rgba(15,23,42,0.20)] min-[390px]:h-32 min-[390px]:w-32")} />}
      {isChampion && <span className="absolute bottom-2 right-2 z-20 rounded-full border border-amber-200/70 bg-[#071b49]/90 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-amber-200 shadow-md">30-day recognition</span>}
    </div>
  );
}

export function CertificateModal({ reward, teacherName, open, onClose }: { reward: StreakReward; teacherName: string; open: boolean; onClose: () => void }) {
  if (!open) return null;
  const achievementDate = formatAchievementDate(reward.unlocked_at);
  const svg = certificateSvg(teacherName, reward, achievementDate);
  const previewUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071b49]/55 p-2 backdrop-blur-sm min-[390px]:p-3" role="dialog" aria-modal="true" aria-labelledby="certificate-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-[20px] border border-white/70 bg-[linear-gradient(180deg,#f4f9ff_0%,#ffffff_180px)] p-3 shadow-[0_28px_80px_rgba(7,27,73,0.24)] min-[390px]:rounded-[24px] min-[390px]:p-4 sm:rounded-[28px] sm:p-6">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3 min-[390px]:mb-4 min-[390px]:gap-4">
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#f45f98] min-[390px]:text-[10px] min-[390px]:tracking-[0.18em]">TeachPad achievement</p><h2 id="certificate-title" className="mt-1 break-words text-base font-black leading-5 text-[#071b49] min-[390px]:text-xl min-[390px]:leading-7">{reward.reward_label}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close certificate" className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#6d6f78] shadow-sm ring-1 ring-white hover:bg-[#f7f8fb]"><X className="h-4 w-4" /></button>
        </div>
        <img src={previewUrl} alt={`Certificate for ${teacherName}`} className="w-full rounded-xl border border-slate-200 bg-slate-50 shadow-sm min-[390px]:rounded-2xl" />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => downloadSvg(svg, certificateFilename(teacherName, reward))} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:h-10 sm:w-auto"><Download className="h-4 w-4" /> Download certificate</button>
          <button type="button" onClick={() => void shareSvg(svg, certificateFilename(teacherName, reward), `${teacherName} earned the ${reward.reward_label} on TeachPad.`)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1677ff] to-[#0969e8] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(22,119,255,0.18)] hover:-translate-y-0.5 sm:h-10 sm:w-auto"><Share2 className="h-4 w-4" /> Share certificate</button>
        </div>
      </div>
    </div>
  );
}

export async function shareAchievementCard(teacherName: string, reward: StreakReward) {
  const svg = achievementCardSvg(teacherName, reward, formatAchievementDate(reward.unlocked_at));
  return shareSvg(svg, `teachpad-${reward.badge_tier}-achievement.svg`, `${teacherName} earned the ${reward.reward_label} on TeachPad.`);
}

function certificateSvg(teacherName: string, reward: StreakReward, achievementDate: string) {
  const name = escapeXml(teacherName || "TeachPad Teacher");
  const label = escapeXml(reward.reward_label);
  const accent = tierStyle[reward.badge_tier].accent;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fbff"/><stop offset="1" stop-color="#eef2ff"/></linearGradient><linearGradient id="seal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
    <rect width="1600" height="1100" rx="38" fill="url(#bg)"/><rect x="34" y="34" width="1532" height="1032" rx="30" fill="none" stroke="${accent}" stroke-width="5"/><rect x="56" y="56" width="1488" height="988" rx="24" fill="none" stroke="#cbd5e1" stroke-width="2"/>
    <text x="800" y="160" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" letter-spacing="9" fill="#2563eb">TEACHPAD</text>
    <text x="800" y="252" text-anchor="middle" font-family="Georgia,serif" font-size="70" font-weight="700" fill="#0f172a">Certificate of Recognition</text>
    <text x="800" y="342" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="#64748b">This certificate is proudly presented to</text>
    <text x="800" y="455" text-anchor="middle" font-family="Georgia,serif" font-size="76" font-style="italic" font-weight="700" fill="${accent}">${name}</text>
    <line x1="330" y1="490" x2="1270" y2="490" stroke="#cbd5e1" stroke-width="2"/>
    <text x="800" y="570" text-anchor="middle" font-family="Arial,sans-serif" font-size="29" fill="#334155">for completing a ${reward.milestone_days}-day teaching streak and earning</text>
    <text x="800" y="640" text-anchor="middle" font-family="Arial,sans-serif" font-size="39" font-weight="800" fill="#0f172a">${label}</text>
    <circle cx="800" cy="790" r="86" fill="url(#seal)"/><path d="M800 730l18 37 41 6-30 29 7 41-36-19-36 19 7-41-30-29 41-6z" fill="#fff"/>
    <text x="385" y="920" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" fill="#334155">${escapeXml(achievementDate)}</text><line x1="220" y1="940" x2="550" y2="940" stroke="#94a3b8"/><text x="385" y="977" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#64748b">Achievement date</text>
    <text x="1215" y="920" text-anchor="middle" font-family="Georgia,serif" font-size="32" font-style="italic" font-weight="700" fill="#2563eb">TeachPad</text><line x1="1050" y1="940" x2="1380" y2="940" stroke="#94a3b8"/><text x="1215" y="977" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#64748b">Teacher success team</text>
  </svg>`;
}

function achievementCardSvg(teacherName: string, reward: StreakReward, achievementDate: string) {
  const accent = tierStyle[reward.badge_tier].accent;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff6ff"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#fff7ed"/></linearGradient></defs><rect width="1200" height="630" rx="36" fill="url(#bg)"/><circle cx="1040" cy="120" r="180" fill="${accent}" opacity=".12"/><circle cx="110" cy="590" r="150" fill="#2563eb" opacity=".08"/><text x="76" y="92" font-family="Arial,sans-serif" font-size="26" font-weight="800" letter-spacing="6" fill="#2563eb">TEACHPAD</text><text x="76" y="190" font-family="Georgia,serif" font-size="56" font-weight="700" fill="#0f172a">Teaching consistency</text><text x="76" y="256" font-family="Georgia,serif" font-size="56" font-weight="700" fill="${accent}">achievement unlocked</text><text x="76" y="354" font-family="Arial,sans-serif" font-size="36" font-weight="800" fill="#0f172a">${escapeXml(teacherName || "TeachPad Teacher")}</text><text x="76" y="410" font-family="Arial,sans-serif" font-size="25" fill="#475569">${escapeXml(reward.reward_label)}</text><rect x="76" y="472" width="280" height="62" rx="31" fill="${accent}"/><text x="216" y="513" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="800" fill="#fff">${reward.milestone_days} teaching days</text><text x="1120" y="574" text-anchor="end" font-family="Arial,sans-serif" font-size="20" fill="#64748b">${escapeXml(achievementDate)}</text><circle cx="970" cy="300" r="116" fill="${accent}"/><path d="M970 214l27 55 61 9-44 43 10 61-54-29-54 29 10-61-44-43 61-9z" fill="#fff"/></svg>`;
}

function formatAchievementDate(value: string | null) {
  if (!value) return "Achievement date";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function certificateFilename(name: string, reward: StreakReward) {
  const safeName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "teacher";
  return `teachpad-${safeName}-${reward.milestone_days}-day-certificate.svg`;
}

function downloadSvg(svg: string, filename: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareSvg(svg: string, filename: string, text: string) {
  const file = new File([svg], filename, { type: "image/svg+xml" });
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try { await navigator.share({ title: "TeachPad teaching achievement", text, files: [file] }); return "shared" as const; }
    catch (error) { if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const; }
  }
  downloadSvg(svg, filename);
  return "downloaded" as const;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}
