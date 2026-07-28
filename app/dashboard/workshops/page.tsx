"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, ChevronRight, Clock, Laptop, MapPin, MessageCircle, User, Video } from "lucide-react";
import Link from "next/link";
import { backendApi, resolveUploadUrl, type Workshop } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { WorkshopImage } from "@/components/workshop-image";

export default function DashboardWorkshopsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Fetch workshops available inside the App (which internally includes publishing_destination = 'teachpad_app' or 'both')
  const workshopsQuery = useQuery({
    queryKey: ["app-workshops"],
    queryFn: () => backendApi.workshops({ destination: "teachpad_app", status: "published" })
  });

  // 2. Fetch current user registrations
  const registrationsQuery = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => backendApi.myRegistrations()
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (workshopId: string) => backendApi.registerWorkshop(workshopId),
    onSuccess: (reg) => {
      toast({
        title: "Registration successful",
        description: "You have successfully registered for this workshop.",
        variant: "success"
      });
      // Invalidate queries to refresh registered status & count
      queryClient.invalidateQueries({ queryKey: ["app-workshops"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (e) => {
      toast({
        title: "Registration failed",
        description: getErrorMessage(e, "Check deadline/capacity and try again."),
        variant: "error"
      });
    }
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: (workshopId: string) => backendApi.cancelWorkshopRegistration(workshopId),
    onSuccess: () => {
      toast({
        title: "Registration cancelled",
        description: "Your seat has been released for another teacher.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["app-workshops"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (e) => {
      toast({
        title: "Could not cancel registration",
        description: getErrorMessage(e, "Please try again later."),
        variant: "error"
      });
    }
  });

  const allWorkshops = workshopsQuery.data?.items || [];
  const registeredList = registrationsQuery.data || [];

  const registeredWorkshopIds = new Set(registeredList.map((registration) => registration.workshop_id));
  const listedWorkshopIds = new Set(allWorkshops.map((workshop) => workshop.id));
  const workshops = [
    ...allWorkshops,
    ...registeredList
      .map((registration) => registration.workshop)
      .filter((workshop): workshop is Workshop => Boolean(workshop) && !listedWorkshopIds.has(workshop.id))
  ];

  const isLoading = workshopsQuery.isLoading || registrationsQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Teacher"
        titleHighlight="Growth Hub"
        imageSrc="/assets/illustrations/classroom-tools-header.png"
        imageClassName="scale-110"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[260px] animate-pulse rounded-[18px] border border-white/70 bg-white/80 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
            />
          ))}
        </div>
      ) : null}

      {!isLoading ? (
        workshops.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {workshops.map((workshop) => {
              const registered = registeredWorkshopIds.has(workshop.id) || workshop.is_registered;

              return (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  registered={registered}
                  onRegister={() => registerMutation.mutate(workshop.id)}
                  onCancel={() => cancelRegistrationMutation.mutate(workshop.id)}
                  isRegistering={registerMutation.isPending && registerMutation.variables === workshop.id}
                  isCancelling={cancelRegistrationMutation.isPending && cancelRegistrationMutation.variables === workshop.id}
                />
              );
            })}
          </div>
        ) : (
          <EmptyWorkshopState
            icon={<Calendar className="h-7 w-7" />}
            tone="blue"
            title="No sessions scheduled right now"
            description="We are currently preparing new live sessions and webinars for the Teacher Growth Hub. Check back soon for the next cohort announcement!"
          />
        )
      ) : null}
    </div>
  );
}

function EmptyWorkshopState({
  icon,
  tone,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  tone: "blue" | "amber";
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[18px] border-white/70 bg-gradient-to-br from-white via-[#f8fbff] to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
      <CardContent className="p-8 text-center">
        <div className={cn(
          "mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[22px] ring-1 shadow-[0_14px_30px_rgba(15,23,42,0.08)]",
          tone === "blue"
            ? "bg-[#eef6ff] text-[#3b82f6] ring-blue-100"
            : "bg-[#fff8e8] text-amber-600 ring-amber-100"
        )}>
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
        {action}
      </CardContent>
    </Card>
  );
}

function WorkshopCard({
  workshop,
  onRegister,
  onCancel,
  isRegistering,
  isCancelling,
  registered = false
}: {
  workshop: Workshop;
  onRegister?: () => void;
  onCancel?: () => void;
  isRegistering?: boolean;
  isCancelling?: boolean;
  registered?: boolean;
}) {
  const isOnline = workshop.mode === "online" || workshop.mode === "hybrid";
  const formattedDate = new Date(workshop.scheduled_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const formattedTime = new Date(workshop.scheduled_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const seatsRemaining = workshop.max_capacity
    ? Math.max(0, workshop.max_capacity - workshop.registered_users_count)
    : null;
  const modeLabel = workshop.mode === "online" ? "Online" : workshop.mode === "offline" ? "Offline" : "Hybrid";
  const modeIcon = workshop.mode === "offline" ? <MapPin className="h-3.5 w-3.5" /> : workshop.mode === "hybrid" ? <Video className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />;
  const meetingLink = workshop.meeting_link?.trim() || null;
  const whatsappGroupLink = "https://chat.whatsapp.com/CSZrJFz6sMpJuSmAB87tq7?s=sw&p=i&ilr=1&amv=0";
  const primaryHost = workshop.hosts[0];

  return (
    <Card className="group/card relative flex h-full overflow-hidden rounded-[18px] border-white/70 bg-gradient-to-br from-white via-[#f8fbff] to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-blue-200/25 blur-2xl" />
      <div className="relative flex min-h-full w-full flex-col">
        <div className="relative m-3 mb-0 h-36 overflow-hidden rounded-[16px] bg-gradient-to-br from-[#eff6ff] via-cyan-50/80 to-white sm:h-44">
          <WorkshopImage
            bannerUrl={workshop.banner_url}
            alt={workshop.title}
            className="h-full w-full object-cover object-center"
            fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-white/75 text-teachpad-blue shadow-[0_14px_30px_rgba(59,130,246,0.18)] ring-1 ring-blue-100">
                <Calendar className="h-10 w-10" />
              </div>
            </div>
            }
          />
        </div>

        <CardContent className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-2.5">
            <div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge className={cn("border-blue-100 bg-blue-50 font-bold", isOnline ? "text-blue-600" : "border-emerald-100 bg-emerald-50 text-emerald-600")}>
                  {modeIcon} {modeLabel}
                </Badge>
                {registered && (
                  <Badge className="border-emerald-200 bg-emerald-50 font-bold text-emerald-700">
                    Registered
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  {formattedDate} · {formattedTime}
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                  {workshop.duration_minutes ? `${workshop.duration_minutes} mins` : "Live session"}
                </span>
              </div>
              <h3 className="mt-2 text-[16px] font-extrabold leading-snug text-slate-950 transition-colors group-hover/card:text-blue-600 sm:text-[18px]">
                {workshop.title}
              </h3>
            </div>

            <p className="line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm">
              {workshop.description || "Learn pedagogical strategies and classroom activity orchestration in this syllabus-grounded workshop."}
            </p>

            {primaryHost ? (
              <div className="flex items-center gap-2 rounded-[13px] border border-slate-100 bg-white/80 px-2.5 py-2 shadow-sm">
                {primaryHost.profile_photo ? (
                  <img
                    src={resolveUploadUrl(primaryHost.profile_photo)}
                    alt={primaryHost.full_name}
                    className="h-8 w-8 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef6ff] text-blue-600 ring-2 ring-white">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-500">Speaker / Host</p>
                  <p className="truncate text-xs font-extrabold leading-tight text-slate-900">{primaryHost.full_name}</p>
                  {primaryHost.designation ? (
                    <p className="truncate text-[9px] font-medium leading-tight text-slate-500">
                      {primaryHost.designation}{primaryHost.organization ? ` at ${primaryHost.organization}` : ""}
                    </p>
                  ) : null}
                </div>
                {workshop.hosts.length > 1 ? (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-600">
                    +{workshop.hosts.length - 1}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
            <div className="text-xs font-bold text-slate-500">
              {seatsRemaining === null ? "Open seats" : `${seatsRemaining} seats left`}
            </div>

            {!registered ? (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href={`/dashboard/workshops/${workshop.id}`}
                  className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-[16px] border border-teachpad-cardBorder bg-white/85 px-3 text-sm font-extrabold text-teachpad-ink shadow-[0_10px_24px_var(--teachpad-shadowToolCard)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-teachpad-blue sm:text-base"
                >
                  View Details <ChevronRight className="h-4 w-4" />
                </Link>
                <Button
                  onClick={onRegister}
                  disabled={isRegistering}
                  className="h-12 w-full rounded-[16px] px-3 text-sm font-extrabold sm:text-base"
                >
                  {isRegistering ? "Registering..." : "Register Now"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className={cn("grid gap-2.5", whatsappGroupLink && "grid-cols-[3fr_7fr]")}>
                  <Button variant="danger" onClick={onCancel} disabled={isCancelling} className="h-12 w-full rounded-[16px] px-2 text-sm font-extrabold sm:text-base">
                    {isCancelling ? "Cancelling..." : "Cancel"}
                  </Button>
                  {whatsappGroupLink ? (
                    <a
                      href={whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-[16px] bg-[#25D366] px-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(37,211,102,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#20bd5a] sm:text-base"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Join WhatsApp Group
                    </a>
                  ) : null}
                </div>
                {meetingLink ? (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 w-full items-center justify-center gap-1 rounded-[16px] border border-teachpad-cardBorder bg-white/85 px-3 text-sm font-extrabold text-teachpad-ink shadow-[0_10px_24px_var(--teachpad-shadowToolCard)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:text-teachpad-blue sm:text-base"
                  >
                    <Video className="h-3.5 w-3.5" /> Join Meeting
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
