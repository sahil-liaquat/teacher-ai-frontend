"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Lock, BookOpen, Gift, Palette, Check, Copy, Share2, MessageCircle, Save, Phone, Mail, GraduationCap, KeyRound, Settings, Ticket, Link2, ArrowLeft, ChevronRight, ShieldCheck, Heart, Sparkles, School, CreditCard } from "lucide-react";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTeacherProfile, saveTeacherProfile, TeacherProfile } from "@/lib/profile";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, requestPasswordReset, submitOnboarding, type ApiUser, type Board, type InfluencerReferralCode } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useBilling, BILLING_QUERY_KEY } from "@/lib/use-billing";
import { normalizeIndianMobile } from "@/lib/phone";
import { BoyAvatar } from "@/components/profile-avatar";
import { PROFILE_AVATARS, normalizeProfileAvatarKey, type ProfileAvatarKey } from "@/lib/profile-avatars";
import { ProfileTeachingBadges } from "@/components/streak/profile-badges";

const usageLimit = 100;

function benefitLine(code: { kind: string; duration_days?: number | null }) {
  const duration = code.duration_days === 30 ? 14 : (code.duration_days || 14);
  if (code.kind === "trial") {
    return `Teachers who sign up with your code get a ${duration}-day free trial.`;
  }
  if (code.kind === "comp") {
    return `Teachers who sign up with your code get ${duration} days of free access.`;
  }
  return "Share your code with teachers to earn commission on their subscriptions.";
}

function buildShareLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://teachpad.in";
  return `${origin}/signup?ref=${encodeURIComponent(code)}`;
}

function buildWhatsappHref(code: string): string {
  const link = buildShareLink(code);
  const message = `Try TeachPad — AI lesson plans, worksheets and presentations for teachers. Sign up with my code ${code}: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: billing } = useBilling();
  const [profile, setProfile] = useState<TeacherProfile>({ name: "", school: "", subjects: "" });
  const [roleInSchool, setRoleInSchool] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarKey, setAvatarKey] = useState<ProfileAvatarKey>("giraffe");
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [sidebarLayout, setSidebarLayout] = useState<"floating" | "expanded">("expanded");
  const [dashboardLayout, setDashboardLayout] = useState<"search-first" | "original">("search-first");
  const [defaultBoardId, setDefaultBoardId] = useState("");
  const [currentScreen, setCurrentScreen] = useState<"menu" | "account" | "security" | "preferences" | "referral" | "appearance">("menu");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("teacher_ai_access_token") : null;

  const boardsQuery = useQuery({
    queryKey: ["settings-boards"],
    queryFn: () => backendApi.boards(0, 100).then(res => res.items.filter((board) => board.is_active !== false)),
    staleTime: Infinity,
  });

  const currentUser = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    retry: false,
    staleTime: Infinity
  });

  const isInfluencer = currentUser.data?.role === "influencer";

  const referralCodesQuery = useQuery({
    queryKey: ["settings-referral-codes"],
    queryFn: () => backendApi.influencerReferralCodes(),
    enabled: isInfluencer,
    retry: false
  });

  const influencerDashboardQuery = useQuery({
    queryKey: ["settings-influencer-dashboard"],
    queryFn: () => backendApi.influencerDashboard(),
    enabled: isInfluencer,
    retry: false
  });

  useEffect(() => {
    const stored = localStorage.getItem("teachpad_sidebar_layout");
    if (stored === "floating") {
      setSidebarLayout("floating");
    }
    const storedDash = localStorage.getItem("teachpad_dashboard_layout");
    if (storedDash === "original") {
      setDashboardLayout("original");
    }
    const storedBoard = localStorage.getItem("teachpad_default_board_id");
    if (storedBoard) {
      setDefaultBoardId(storedBoard);
    }
  }, []);

  useEffect(() => {
    if (!currentUser.data?.id) return;
    const savedProfile = getTeacherProfile(currentUser.data.id);
    setProfile({
      ...savedProfile,
      name: currentUser.data.full_name || currentUser.data.name || ""
    });
    setRoleInSchool(currentUser.data.role_in_school || "");
    setSchoolName(currentUser.data.pending_school_name || "");
    setAvatarKey(normalizeProfileAvatarKey(currentUser.data.avatar_key));

    if (boardsQuery.data) {
      const storedBoard = localStorage.getItem("teachpad_default_board_id");
      if (storedBoard) {
        setDefaultBoardId(storedBoard);
      } else if (currentUser.data.board_preference) {
        const pref = currentUser.data.board_preference.toLowerCase();
        const matched = (boardsQuery.data || []).find(b => 
          b.code?.toLowerCase().includes(pref)
        );
        if (matched) {
          setDefaultBoardId(matched.id);
          localStorage.setItem("teachpad_default_board_id", matched.id);
        }
      }
    }
  }, [currentUser.data, boardsQuery.data]);

  useEffect(() => {
    setPhone((billing?.billing_phone ?? "").replace(/^\+91/, ""));
  }, [billing?.billing_phone]);

  const displayName = profile.name || currentUser.data?.full_name || currentUser.data?.name || "Teacher";
  const email = currentUser.data?.email || "No email available";

  const jkboseBoard = (boardsQuery.data || []).find(b => b.code?.toLowerCase().includes("jkbose"));
  const cbseBoard = (boardsQuery.data || []).find(b => b.code?.toLowerCase().includes("cbse"));

  const primaryCode = referralCodesQuery.data?.[0];
  const shareLink = primaryCode ? buildShareLink(primaryCode.code) : "";

  function changeSidebarLayout(layout: "floating" | "expanded") {
    if (localStorage.getItem("teachpad_sidebar_layout") === layout) return;
    setSidebarLayout(layout);
    localStorage.setItem("teachpad_sidebar_layout", layout);
    window.dispatchEvent(new Event("teachpad_sidebar_layout_changed"));
    toast({
      title: "Sidebar layout updated",
      description: `Sidebar changed to ${layout === "expanded" ? "expanded" : "floating icon"} view.`,
      variant: "success"
    });
  }

  function changeDashboardLayout(layout: "search-first" | "original") {
    if (localStorage.getItem("teachpad_dashboard_layout") === layout) return;
    setDashboardLayout(layout);
    localStorage.setItem("teachpad_dashboard_layout", layout);
    window.dispatchEvent(new Event("teachpad_dashboard_layout_changed"));
    toast({
      title: "Dashboard layout updated",
      description: `Dashboard changed to ${layout === "search-first" ? "Search-first" : "Original"} layout view.`,
      variant: "success"
    });
  }

  async function changeDefaultBoard(value: string) {
    setDefaultBoardId(value);
    if (value) {
      localStorage.setItem("teachpad_default_board_id", value);
    } else {
      localStorage.removeItem("teachpad_default_board_id");
    }

    try {
      const selectedBoard = (boardsQuery.data || []).find(b => b.id === value);
      let preferenceCode = "other";
      if (selectedBoard) {
        const codeLower = selectedBoard.code?.toLowerCase() || "";
        if (codeLower.includes("cbse")) {
          preferenceCode = "cbse";
        } else if (codeLower.includes("jkbose")) {
          preferenceCode = "jkbose";
        }
      }
      const updated = await submitOnboarding({
        board_preference: value ? preferenceCode : "other"
      });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);
    } catch (e) {
      console.error("Failed to update board preference on backend", e);
    }

    toast({
      title: "Default Board updated",
      description: "Prefill board curriculum preference has been updated.",
      variant: "success"
    });
  }

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

  async function sendPasswordReset() {
    const accountEmail = currentUser.data?.email;
    if (!accountEmail) {
      toast({ title: "Email unavailable", description: "Please sign in again before requesting a reset link." });
      return;
    }

    setSendingReset(true);
    try {
      const response = await requestPasswordReset(accountEmail);
      setResetSent(true);
      toast({ title: "Reset link sent", description: response.message || `Check ${accountEmail} for the reset link.`, variant: "success" });
    } catch (error) {
      toast({ title: "Could not send reset link", description: getErrorMessage(error, "Please try again."), variant: "error" });
    } finally {
      setSendingReset(false);
    }
  }

  function updateProfile(field: keyof TeacherProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: profile.name.trim(),
      school: profile.school.trim(),
      subjects: ""
    };
    if (!next.name) {
      toast({ title: "Name is required", description: "Please enter the name for this account." });
      return;
    }
    const currentUserId = currentUser.data?.id;
    if (!currentUserId) {
      toast({ title: "Could not save profile", description: "Please sign in again before updating your profile." });
      return;
    }

    const trimmedPhone = phone.trim();
    const normalizedPhone = trimmedPhone ? normalizeIndianMobile(trimmedPhone) : null;
    if (trimmedPhone && !normalizedPhone) {
      toast({ title: "Invalid mobile number", description: "Enter a 10-digit Indian mobile number, or leave it blank." });
      return;
    }

    setSaving(true);
    try {
      await backendApi.updateUser(currentUserId, {
        full_name: next.name,
        avatar_key: avatarKey,
      });
      
      // Update onboarding role and school name preferences in backend database
      await submitOnboarding({
        role_in_school: roleInSchool || undefined,
        pending_school_name: schoolName.trim() || undefined
      });

      const savedUser = await getCurrentUser({ redirectOnUnauthorized: false });
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, savedUser);

      const savedProfile = {
        ...next,
        school: schoolName.trim(),
        name: savedUser.full_name || next.name
      };
      saveTeacherProfile(savedProfile, savedUser.id || currentUserId);
      setProfile(savedProfile);

      if (normalizedPhone && normalizedPhone !== (billing?.billing_phone ?? "")) {
        const updatedBilling = await backendApi.billingUpdatePhone(normalizedPhone);
        queryClient.setQueryData(BILLING_QUERY_KEY, updatedBilling);
      }

      toast({ title: "Profile saved", description: "Your profile details are up to date.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not save profile", description: getErrorMessage(error, "Please try again."), variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      {/* Premium Header Banner */}
      <DashboardBannerHeader
        titleTop="Manage your"
        titleHighlight="settings"
        imageSrc="/assets/illustrations/profile-settings-header.png"
      />

      {currentScreen !== "menu" && (
        <button
          type="button"
          onClick={() => setCurrentScreen("menu")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Settings
        </button>
      )}

      {currentScreen === "menu" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:gap-4">
          {/* Account Card */}
          <button
            type="button"
            onClick={() => setCurrentScreen("account")}
            className="group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br from-[#eff6ff] via-[#eff6ff] to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left focus:outline-none"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#bfdbfe]/30 blur-2xl" />
            <div className="shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 bg-[#eef6ff] text-[#3b82f6] ring-blue-100 shadow-[0_14px_30px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105">
              <User className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">Account</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">Profile photo, name, email &amp; mobile</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
          </button>

          {/* Security Card */}
          <button
            type="button"
            onClick={() => setCurrentScreen("security")}
            className="group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br from-[#f0fdff] via-cyan-50/70 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left focus:outline-none"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-cyan-200/30 blur-2xl" />
            <div className="shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb] shadow-[0_14px_30px_rgba(22,169,182,0.18),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105">
              <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">Security</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">Password credentials &amp; reset links</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
          </button>

          {/* Teaching Preferences Card */}
          <button
            type="button"
            onClick={() => setCurrentScreen("preferences")}
            className="group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br from-white via-pink-50/70 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left focus:outline-none"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl" />
            <div className="shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 bg-[#fff1f7] text-[#f45f98] ring-pink-100 shadow-[0_14px_30px_rgba(244,95,152,0.24),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105">
              <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">Teaching Preferences</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">Default curriculum &amp; board preferences</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
          </button>

          {/* Referral Program Card */}
          <button
            type="button"
            onClick={() => setCurrentScreen("referral")}
            className="group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br from-white via-emerald-50/70 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left focus:outline-none"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
            <div className="shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 bg-[#ecfff6] text-[#24b77a] ring-emerald-100 shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105">
              <Heart className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">Referral Program</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">Invite teachers &amp; earn rewards</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
          </button>

          {/* Appearance Card */}
          <button
            type="button"
            onClick={() => setCurrentScreen("appearance")}
            className="group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br from-[#fffaf0] via-amber-50/80 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left focus:outline-none"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />
            <div className="shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 bg-[#fff6df] text-[#f0a22f] ring-amber-100 shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">Appearance</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">Sidebar &amp; dashboard layout config</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
          </button>

          {/* Billing Card */}
          <Link
            href="/dashboard/billing"
            className="group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br from-[#fef3f2] via-red-50/70 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left focus:outline-none"
          >
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-red-200/30 blur-2xl" />
            <div className="shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 bg-[#fff5f3] text-[#dc2626] ring-red-100 shadow-[0_14px_30px_rgba(220,38,38,0.24),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105">
              <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">Billing</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">Manage subscription &amp; cancel anytime</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

      {currentScreen === "account" && (
        <section className="rounded-[18px] border border-white/70 bg-white/80 p-4 sm:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 rounded-[14px] flex items-center justify-center ring-1 bg-[#eef6ff] text-[#3b82f6] ring-blue-100 shadow-[0_10px_24px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]">
              <User className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Account</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Manage your profile information and contact details.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6 pt-2 border-t border-slate-100">
            {!isInfluencer && <ProfileTeachingBadges />}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-4 ring-blue-100">
                  <BoyAvatar avatarKey={avatarKey} alt={`${displayName}'s ${avatarKey} profile picture`} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Choose your profile animal</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">Your selected avatar appears beside notifications and across TeachPad.</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {PROFILE_AVATARS.map((avatar) => {
                  const selected = avatar.key === avatarKey;
                  return (
                    <button
                      key={avatar.key}
                      type="button"
                      aria-label={`Choose ${avatar.label} profile picture`}
                      aria-pressed={selected}
                      onClick={() => setAvatarKey(avatar.key)}
                      className={cn(
                        "group relative rounded-2xl border bg-white p-2 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B73FF] focus-visible:ring-offset-2",
                        selected ? "border-[#0B73FF] ring-2 ring-blue-100" : "border-slate-200"
                      )}
                    >
                      <span className="block aspect-square overflow-hidden rounded-full bg-slate-100">
                        <BoyAvatar avatarKey={avatar.key} alt="" />
                      </span>
                      <span className={cn("mt-2 block text-[11px] font-bold", selected ? "text-[#0B73FF]" : "text-slate-600")}>
                        {avatar.label}
                      </span>
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#0B73FF] text-white shadow-sm">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] font-medium text-slate-400">Click Save Profile below to keep your selection.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) => updateProfile("name", e.target.value)}
                  placeholder="Enter full name"
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#0B73FF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                </label>
                <Input
                  value={email}
                  disabled
                  placeholder="email@example.com"
                  className="rounded-xl border-slate-200 bg-slate-50 cursor-not-allowed font-medium text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Mobile Number
                </label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#0B73FF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> Your Role
                </label>
                <Select
                  value={roleInSchool}
                  onChange={(e) => setRoleInSchool(e.target.value)}
                >
                  <option value="">Select your role</option>
                  <option value="school_teacher">School teacher</option>
                  <option value="tuition_teacher">Tuition teacher</option>
                  <option value="school_coordinator">School coordinator</option>
                  <option value="principal">Principal</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <School className="h-3.5 w-3.5 text-slate-400" /> School Name
                </label>
                <Input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter your school name"
                  className="rounded-xl border-slate-200 bg-white focus-visible:ring-[#0B73FF]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={saving || currentUser.isLoading}
                className="rounded-xl px-5 py-2.5 font-bold text-xs bg-[#0B73FF] hover:bg-[#005cd6] text-white shadow-sm transition-all duration-200"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </section>
      )}

      {currentScreen === "security" && (
        <section className="rounded-[18px] border border-white/70 bg-white/80 p-4 sm:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 rounded-[14px] flex items-center justify-center ring-1 bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb] shadow-[0_10px_24px_rgba(22,169,182,0.14),inset_0_1px_0_rgba(255,255,255,0.92)]">
              <ShieldCheck className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Security</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Manage password credentials and active session resets.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-5 border-t border-slate-100">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0B73FF] shadow-sm">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Password</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[500px]">
                  {resetSent ? `Reset link sent to ${email}.` : "Send a secure password reset link to your registered email address."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-10 px-4 font-bold text-xs shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200"
              disabled={sendingReset || currentUser.isLoading || !currentUser.data?.email}
              onClick={sendPasswordReset}
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              {sendingReset ? "Sending..." : resetSent ? "Send again" : "Send Password Reset Link"}
            </Button>
          </div>
        </section>
      )}

      {currentScreen === "preferences" && (
        <section className="rounded-[18px] border border-white/70 bg-white/80 p-4 sm:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 rounded-[14px] flex items-center justify-center ring-1 bg-[#fff1f7] text-[#f45f98] ring-pink-100 shadow-[0_10px_24px_rgba(244,95,152,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]">
              <GraduationCap className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Teaching Preferences</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Prefill board configurations to automate curriculum loading.</p>
            </div>
          </div>

          <div className="space-y-4 pt-5 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 leading-relaxed mb-1">
              Select your default board or curriculum to load lesson plans, worksheets, presentations, and companion builders automatically.
            </p>

            {boardsQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-20 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse" />
                <div className="h-20 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* JKBOSE Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (jkboseBoard) {
                      const isSelected = defaultBoardId === jkboseBoard.id;
                      changeDefaultBoard(isSelected ? "" : jkboseBoard.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 relative",
                    jkboseBoard && defaultBoardId === jkboseBoard.id
                      ? "border-[#0B73FF] bg-[#0B73FF]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white p-1 border border-slate-100 shadow-xs">
                    <img src="/landing/board-logos/jkbose-logo.png" alt="JKBOSE" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <span className="font-bold text-slate-800 text-sm block">JKBOSE</span>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">Jammu & Kashmir Board</span>
                  </div>
                  {jkboseBoard && defaultBoardId === jkboseBoard.id && (
                    <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-[#0B73FF] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>

                {/* CBSE Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (cbseBoard) {
                      const isSelected = defaultBoardId === cbseBoard.id;
                      changeDefaultBoard(isSelected ? "" : cbseBoard.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 relative",
                    cbseBoard && defaultBoardId === cbseBoard.id
                      ? "border-[#0B73FF] bg-[#0B73FF]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white p-1 border border-slate-100 shadow-xs">
                    <img src="/landing/board-logos/cbse-logo.png" alt="CBSE" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <span className="font-bold text-slate-800 text-sm block">CBSE</span>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">Central Board of Secondary Education</span>
                  </div>
                  {cbseBoard && defaultBoardId === cbseBoard.id && (
                    <span className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-[#0B73FF] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {currentScreen === "referral" && (
        <section className="rounded-[18px] border border-white/70 bg-white/80 p-4 sm:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 rounded-[14px] flex items-center justify-center ring-1 bg-[#ecfff6] text-[#24b77a] ring-emerald-100 shadow-[0_10px_24px_rgba(36,183,122,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]">
              <Heart className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Referral Program</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Invite fellow teachers and earn subscription rewards.</p>
            </div>
          </div>

          <div className="space-y-6 pt-5 border-t border-slate-100">
            {referralCodesQuery.isLoading ? (
              <div className="h-32 animate-pulse rounded-xl border border-slate-100 bg-slate-50" aria-label="Loading referral code" />
            ) : primaryCode ? (
              <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-[#fff8f9] to-white p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-white px-2.5 py-1 text-[10px] font-bold text-red-500 shadow-xs">
                    <Ticket className="h-3.5 w-3.5" />
                    Referral Code
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-rose-200/40 bg-white px-3 py-1 font-mono text-xl font-black tracking-wider text-slate-800 shadow-xs">
                      {primaryCode.code}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-200 h-9 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-bold"
                      onClick={() => copyValue(primaryCode.code, "code")}
                    >
                      {copied === "code" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      {copied === "code" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-slate-500 pt-1">
                    {benefitLine(primaryCode)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 md:self-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-200 h-9 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-bold"
                    onClick={() => copyValue(shareLink, "link")}
                  >
                    {copied === "link" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5 mr-1" />}
                    Copy Link
                  </Button>
                  <a href={buildWhatsappHref(primaryCode.code)} target="_blank" rel="noopener noreferrer">
                    <Button type="button" size="sm" className="h-9 px-3 rounded-lg bg-[#25d366] hover:bg-[#20ba59] text-white font-bold gap-1">
                      <MessageCircle className="h-4 w-4" /> Share on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <h4 className="text-sm font-black text-amber-950">Your referral code is being set up</h4>
                    <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
                      Copy and sharing options will appear here after TeachPad assigns a code to your account.
                    </p>
                    {referralCodesQuery.isError ? <p className="mt-2 text-[11px] font-bold text-red-600">We could not check your code right now. Please try again later.</p> : null}
                  </div>
                </div>
              </div>
            )}

            {/* Performance summary cards */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Referral Metrics</h4>
              <div className="grid gap-4 grid-cols-3">
                {/* Total Referrals */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
                  <span className="text-lg font-black text-slate-800 block">
                    {influencerDashboardQuery.data?.total_referred_signups ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Total Referrals</span>
                </div>

                {/* Active Teachers */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
                  <span className="text-lg font-black text-slate-800 block">
                    {influencerDashboardQuery.data?.total_active_subscribers ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Active Teachers</span>
                </div>

                {/* Rewards Earned */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
                  <span className="text-lg font-black text-slate-800 block">
                    ₹{influencerDashboardQuery.data?.total_earned_commission_inr ?? 0}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">Rewards Earned</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {currentScreen === "appearance" && (
        <section className="rounded-[18px] border border-white/70 bg-white/80 p-4 sm:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 h-10 w-10 rounded-[14px] flex items-center justify-center ring-1 bg-[#fff6df] text-[#f0a22f] ring-amber-100 shadow-[0_10px_24px_rgba(240,162,47,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]">
              <Sparkles className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Appearance</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Configure layout densities and theme alignments.</p>
            </div>
          </div>

          <div className="space-y-6 pt-5 border-t border-slate-100">
            {/* Sidebar Style */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sidebar Style</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                
                {/* Floating Sidebar Option */}
                <button
                  type="button"
                  onClick={() => changeSidebarLayout("floating")}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                    sidebarLayout === "floating"
                      ? "border-[#0B73FF] bg-[#0B73FF]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  {/* Realistic UI Preview */}
                  <div className="relative h-24 w-full rounded-xl bg-slate-50 border border-slate-200/60 p-2 flex gap-2 overflow-hidden select-none pointer-events-none">
                    <div className="w-5 h-full rounded-lg bg-white border border-slate-200/80 flex flex-col items-center gap-1.5 p-1 shadow-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0B73FF]" />
                      <div className="w-2.5 h-1 rounded bg-slate-200" />
                      <div className="w-2.5 h-1 rounded bg-slate-200" />
                      <div className="w-2.5 h-1 rounded bg-slate-200" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 pt-1">
                      <div className="h-2 w-1/3 rounded bg-slate-300" />
                      <div className="h-10 w-full rounded-lg bg-white border border-slate-200/80 shadow-xs p-1.5 flex flex-col gap-1">
                        <div className="h-1.5 w-1/2 rounded bg-slate-200" />
                        <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-800 text-sm">Floating Sidebar</span>
                    {sidebarLayout === "floating" && <span className="h-2 w-2 rounded-full bg-[#0B73FF]" />}
                  </div>
                </button>

                {/* Expanded Sidebar Option */}
                <button
                  type="button"
                  onClick={() => changeSidebarLayout("expanded")}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                    sidebarLayout === "expanded"
                      ? "border-[#0B73FF] bg-[#0B73FF]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  {/* Realistic UI Preview */}
                  <div className="relative h-24 w-full rounded-xl bg-slate-50 border border-slate-200/60 p-2 flex gap-2 overflow-hidden select-none pointer-events-none">
                    <div className="w-14 h-full rounded-lg bg-white border border-slate-200/80 flex flex-col gap-1.5 p-1 shadow-xs">
                      <div className="w-full h-3.5 rounded bg-blue-50 flex items-center px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0B73FF]" />
                      </div>
                      <div className="w-full h-1 rounded bg-slate-200" />
                      <div className="w-full h-1 rounded bg-slate-200" />
                      <div className="w-full h-1 rounded bg-slate-200" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 pt-1">
                      <div className="h-2 w-1/3 rounded bg-slate-300" />
                      <div className="h-10 w-full rounded-lg bg-white border border-slate-200/80 shadow-xs p-1.5 flex flex-col gap-1">
                        <div className="h-1.5 w-1/2 rounded bg-slate-200" />
                        <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-800 text-sm">Expanded Sidebar</span>
                    {sidebarLayout === "expanded" && <span className="h-2 w-2 rounded-full bg-[#0B73FF]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Dashboard Layout */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dashboard Layout</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                
                {/* Search-First Dashboard */}
                <button
                  type="button"
                  onClick={() => changeDashboardLayout("search-first")}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                    dashboardLayout === "search-first"
                      ? "border-[#0B73FF] bg-[#0B73FF]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  {/* Miniature Dashboard Preview */}
                  <div className="relative h-24 w-full rounded-xl bg-slate-50 border border-slate-200/60 p-2 flex flex-col justify-between overflow-hidden select-none pointer-events-none">
                    <div className="flex items-center justify-between w-full">
                      <div className="h-2 w-6 rounded bg-slate-300" />
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="w-full h-5 rounded-lg border border-blue-200 bg-white flex items-center px-1.5 gap-1 shadow-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0B73FF]" />
                      <div className="h-1 w-10 rounded bg-slate-100" />
                    </div>
                    <div className="flex justify-center gap-1 w-full pb-1">
                      <div className="h-1 w-4 rounded bg-slate-200" />
                      <div className="h-1 w-4 rounded bg-slate-200" />
                      <div className="h-1 w-4 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-800 text-sm">Search-First Dashboard</span>
                    {dashboardLayout === "search-first" && <span className="h-2 w-2 rounded-full bg-[#0B73FF]" />}
                  </div>
                </button>

                {/* Classic Dashboard */}
                <button
                  type="button"
                  onClick={() => changeDashboardLayout("original")}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                    dashboardLayout === "original"
                      ? "border-[#0B73FF] bg-[#0B73FF]/5 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  {/* Miniature Dashboard Preview */}
                  <div className="relative h-24 w-full rounded-xl bg-slate-50 border border-slate-200/60 p-2 flex flex-col justify-between overflow-hidden select-none pointer-events-none">
                    <div className="flex items-center justify-between w-full">
                      <div className="h-2 w-6 rounded bg-slate-300" />
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 w-full">
                      <div className="h-6 rounded bg-white border border-slate-200 flex flex-col justify-center px-1 shadow-xs">
                        <div className="h-0.5 w-1 rounded bg-slate-300" />
                        <div className="h-1 w-2 rounded bg-[#0B73FF] mt-0.5" />
                      </div>
                      <div className="h-6 rounded bg-white border border-slate-200 flex flex-col justify-center px-1 shadow-xs">
                        <div className="h-0.5 w-1 rounded bg-slate-300" />
                        <div className="h-1 w-2 rounded bg-slate-400 mt-0.5" />
                      </div>
                      <div className="h-6 rounded bg-white border border-slate-200 flex flex-col justify-center px-1 shadow-xs">
                        <div className="h-0.5 w-1 rounded bg-slate-300" />
                        <div className="h-1 w-2 rounded bg-slate-400 mt-0.5" />
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded bg-white border border-slate-200" />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-800 text-sm">Classic Dashboard</span>
                    {dashboardLayout === "original" && <span className="h-2 w-2 rounded-full bg-[#0B73FF]" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
