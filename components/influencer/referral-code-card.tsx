"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Link2, MessageCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { backendApi, type InfluencerReferralCode } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export const INFLUENCER_REFERRAL_CODES_QUERY_KEY = ["influencer-referral-codes"];

function benefitLine(code: InfluencerReferralCode): string {
  if (code.kind === "trial" && code.duration_days) {
    return `Teachers who sign up with your code get a ${code.duration_days}-day free trial.`;
  }
  if (code.kind === "comp" && code.duration_days) {
    return `Teachers who sign up with your code get ${code.duration_days} days of free access.`;
  }
  return "Share your code with teachers to earn commission on their subscriptions.";
}

function buildShareLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://teachpad.in";
  return `${origin}/signup?ref=${encodeURIComponent(code)}`;
}

function buildWhatsappHref(code: InfluencerReferralCode): string {
  const message = `Try TeachPad — AI lesson plans, worksheets and presentations for teachers. Sign up with my code ${code.code}: ${buildShareLink(code.code)}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function ReferralCodeCard({ variant }: { variant: "hero" | "compact" }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: INFLUENCER_REFERRAL_CODES_QUERY_KEY,
    queryFn: () => backendApi.influencerReferralCodes()
  });

  const isHero = variant === "hero";
  const primary = data?.[0];
  const extras = (data || []).slice(1);

  async function copyValue(value: string, which: "code" | "link") {
    await navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(which);
    window.setTimeout(() => setCopied(null), 2000);
    toast({
      title: which === "code" ? "Referral code copied" : "Share link copied",
      description: which === "code" ? "Paste it anywhere you share TeachPad." : "Send this link to teachers.",
      variant: "success"
    });
  }

  if (isLoading) {
    return (
      <div className={cn("animate-pulse rounded-[18px] border border-[#ffd9de] bg-white/70", isHero ? "h-[148px]" : "h-[120px]")} />
    );
  }

  if (isError) {
    if (!isHero) return null;
    return (
      <section className="rounded-[18px] border border-[#ffd9de] bg-white/86 p-4 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm sm:p-5">
        <p className="text-sm font-semibold text-teachpad-muted">
          {getErrorMessage(error, "Couldn't load your referral code — please refresh to try again.")}
        </p>
      </section>
    );
  }

  if (!primary) {
    return (
      <section
        className={cn(
          "rounded-[18px] border border-dashed border-[#ffd9de] bg-white/70 backdrop-blur-sm",
          isHero ? "p-4 sm:p-5" : "p-4"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-50 text-red-500">
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-teachpad-ink">Your referral code is being set up</p>
            <p className="mt-1 text-sm font-medium text-teachpad-muted">It will appear here soon.</p>
          </div>
        </div>
      </section>
    );
  }

  const link = buildShareLink(primary.code);

  if (!isHero) {
    return (
      <div className="rounded-2xl border border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] to-white p-4">
        <p className="text-xs font-black uppercase tracking-wider text-red-500">Your referral code</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-[#ffd9de] bg-white px-3 py-1.5 font-mono text-lg font-black tracking-widest text-teachpad-ink">
            {primary.code}
          </span>
          <Button type="button" size="sm" variant="outline" className="border-[#ffd9de] text-red-500" onClick={() => copyValue(primary.code, "code")}>
            {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
          </Button>
        </div>
        <p className="mt-2 text-sm font-medium leading-6 text-teachpad-muted">{benefitLine(primary)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => copyValue(link, "link")}>
            {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Copy share link
          </Button>
          <a href={buildWhatsappHref(primary)} target="_blank" rel="noopener noreferrer">
            <Button type="button" size="sm" className="bg-gradient-to-r from-[#25d366] to-[#128c7e]">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#ffd9de] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 bg-gradient-to-br from-[#fff7f8] via-white to-[#fff1f7] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd9de] bg-white/80 px-3 py-1.5 text-xs font-black text-red-500 shadow-sm backdrop-blur-sm">
            <Ticket className="h-4 w-4" />
            Your referral code
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-[#ffd9de] bg-white px-4 py-2 font-mono text-2xl font-black tracking-widest text-teachpad-ink shadow-sm sm:text-3xl">
              {primary.code}
            </span>
            <Button type="button" variant="outline" className="border-[#ffd9de] text-red-500" onClick={() => copyValue(primary.code, "code")}>
              {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy code
            </Button>
          </div>
          <p className="mt-3 max-w-[560px] text-sm font-medium leading-6 text-teachpad-muted">{benefitLine(primary)}</p>
          {extras.length ? (
            <p className="mt-2 text-xs font-semibold text-teachpad-muted">
              Also active:{" "}
              {extras.map((extra, index) => (
                <button
                  key={extra.code}
                  type="button"
                  className="font-mono font-black text-red-500 underline-offset-2 hover:underline"
                  onClick={() => copyValue(extra.code, "code")}
                >
                  {extra.code}
                  {index < extras.length - 1 ? ", " : ""}
                </button>
              ))}{" "}
              (tap to copy)
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Button type="button" variant="outline" onClick={() => copyValue(link, "link")}>
            {copied === "link" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} Copy share link
          </Button>
          <a href={buildWhatsappHref(primary)} target="_blank" rel="noopener noreferrer">
            <Button type="button" className="w-full bg-gradient-to-r from-[#25d366] to-[#128c7e]">
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
