"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, Clock, Laptop, MapPin, Sparkles, User, Video } from "lucide-react";
import Link from "next/link";
import { backendApi, type Workshop, BACKEND_ROOT } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn, resolveMediaUrl } from "@/lib/utils";

export default function DashboardWorkshopsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "registered">("upcoming");
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

  // Categorize
  const upcomingWorkshops = allWorkshops.filter(
    (w) => !registeredList.some((reg) => reg.workshop_id === w.id)
  );

  const registeredWorkshops = registeredList.map((reg) => reg.workshop).filter(Boolean);

  const isLoading = workshopsQuery.isLoading || registrationsQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Teacher"
        titleHighlight="Growth Hub"
        imageSrc="/assets/illustrations/classroom-tools-header.png"
        imageClassName="scale-110"
      />

      <div className="grid gap-3 rounded-[22px] border border-white/70 bg-white/80 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:grid-cols-2">
        <WorkshopTabButton
          active={activeTab === "upcoming"}
          icon={<Sparkles className="h-5 w-5" />}
          title="Upcoming Sessions"
          description="Live sessions you can still join"
          count={upcomingWorkshops.length}
          tone="blue"
          onClick={() => setActiveTab("upcoming")}
        />
        <WorkshopTabButton
          active={activeTab === "registered"}
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="My Registrations"
          description="Your saved seats and join links"
          count={registeredWorkshops.length}
          tone="green"
          onClick={() => setActiveTab("registered")}
        />
      </div>

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

      {!isLoading && activeTab === "upcoming" ? (
        upcomingWorkshops.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingWorkshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                onRegister={() => registerMutation.mutate(workshop.id)}
                isRegistering={registerMutation.isPending && registerMutation.variables === workshop.id}
              />
            ))}
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

      {!isLoading && activeTab === "registered" ? (
        registeredWorkshops.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {registeredWorkshops.map((workshop) => (
              <WorkshopCard
                key={workshop.id}
                workshop={workshop}
                registered
                onCancel={() => cancelRegistrationMutation.mutate(workshop.id)}
                isCancelling={cancelRegistrationMutation.isPending && cancelRegistrationMutation.variables === workshop.id}
              />
            ))}
          </div>
        ) : (
          <EmptyWorkshopState
            icon={<AlertCircle className="h-7 w-7" />}
            tone="amber"
            title="No registrations yet."
            description="Explore upcoming sessions and register to keep your join links here."
            action={<Button className="mt-5" onClick={() => setActiveTab("upcoming")}>Browse Sessions</Button>}
          />
        )
      ) : null}
    </div>
  );
}

function WorkshopTabButton({
  active,
  icon,
  title,
  description,
  count,
  tone,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number;
  tone: "blue" | "green";
  onClick: () => void;
}) {
  const toneClasses = tone === "blue"
    ? "from-[#eff6ff] via-[#eff6ff] to-white text-[#3b82f6] ring-blue-100"
    : "from-[#f0fff4] via-[#f0fff4] to-white text-emerald-600 ring-emerald-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/card relative overflow-hidden rounded-[18px] p-4 text-left transition-all duration-300 focus:outline-none",
        active
          ? `bg-gradient-to-br ${toneClasses} shadow-[0_14px_34px_rgba(15,23,42,0.08)]`
          : "bg-transparent text-slate-500 hover:bg-white/70"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-[18px] ring-1 transition-transform duration-300 group-hover/card:scale-105",
          active ? "bg-white/88 shadow-[0_12px_26px_rgba(15,23,42,0.08)]" : "bg-slate-50 text-slate-400 ring-slate-100"
        )}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[14.5px] font-extrabold leading-snug sm:text-[16.5px]", active ? "text-slate-900" : "text-slate-600")}>
            {title}
          </span>
          <span className="mt-1 block text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
            {description}
          </span>
        </span>
        <span className={cn(
          "grid h-8 min-w-8 place-items-center rounded-full px-2 text-xs font-black",
          active ? "bg-white text-slate-900" : "bg-slate-100 text-slate-500"
        )}>
          {count}
        </span>
      </div>
    </button>
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
    hour: "2-digit",
    minute: "2-digit"
  });
  const seatsRemaining = workshop.max_capacity
    ? Math.max(0, workshop.max_capacity - workshop.registered_users_count)
    : null;
  const modeLabel = workshop.mode === "online" ? "Online" : workshop.mode === "offline" ? "Offline" : "Hybrid";
  const modeIcon = workshop.mode === "offline" ? <MapPin className="h-3.5 w-3.5" /> : workshop.mode === "hybrid" ? <Video className="h-3.5 w-3.5" /> : <Laptop className="h-3.5 w-3.5" />;

  return (
    <Card className="group/card relative flex h-full overflow-hidden rounded-[18px] border-white/70 bg-gradient-to-br from-white via-[#f8fbff] to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-blue-200/25 blur-2xl" />
      <div className="relative flex min-h-full w-full flex-col">
        <div className="relative m-3 mb-0 h-48 overflow-hidden rounded-[16px] bg-gradient-to-br from-[#eff6ff] via-cyan-50/80 to-white sm:h-56 lg:h-60">
          {workshop.banner_url ? (
            <img
              src={resolveMediaUrl(workshop.banner_url)}
              alt={workshop.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-white/75 text-teachpad-blue shadow-[0_14px_30px_rgba(59,130,246,0.18)] ring-1 ring-blue-100">
                <Calendar className="h-10 w-10" />
              </div>
            </div>
          )}
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
            <Badge className={cn("border-white/80 bg-white/92 font-bold shadow-sm", isOnline ? "text-blue-600" : "text-emerald-600")}>
              {modeIcon} {modeLabel}
            </Badge>
            {registered && (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold">
                Registered
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col justify-between p-5">
          <div className="space-y-3">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  {formattedDate} · {formattedTime}
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                  {workshop.duration_minutes ? `${workshop.duration_minutes} mins` : "Live session"}
                </span>
              </div>
              <h3 className="mt-3 text-[16px] font-extrabold leading-snug text-slate-950 transition-colors group-hover/card:text-blue-600 sm:text-[18px]">
                {workshop.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 sm:text-sm line-clamp-2 leading-relaxed">
              {workshop.description || "Learn pedagogical strategies and classroom activity orchestration in this syllabus-grounded workshop."}
            </p>

            {workshop.hosts.length ? (
              <div className="rounded-[16px] border border-slate-100 bg-white/72 p-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Speaker / Host</p>
                <div className="flex flex-col gap-2 mt-1.5">
                  {workshop.hosts.slice(0, 2).map((host) => (
                    <div key={host.id} className="flex items-center gap-2">
                      {host.profile_photo ? (
                        <img
                          src={resolveMediaUrl(host.profile_photo)}
                          alt={host.full_name}
                          className="h-7 w-7 rounded-full object-cover border border-white shadow-sm"
                        />
                      ) : (
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-[#eef6ff] text-blue-600"><User className="h-3.5 w-3.5" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate leading-none">{host.full_name}</p>
                        {host.designation && (
                          <p className="text-[9px] text-slate-500 mt-0.5 truncate leading-none">{host.designation} {host.organization ? `at ${host.organization}` : ""}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-500">
                {seatsRemaining === null ? "Open seats" : `${seatsRemaining} seats left`}
              </div>
              <Link href={`/dashboard/workshops/${workshop.id}`} className="flex items-center text-xs font-bold text-teachpad-blue hover:underline">
                View Details <ChevronRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            {!registered ? (
              <Button
                size="sm"
                onClick={onRegister}
                disabled={isRegistering}
                className="w-full rounded-full"
              >
                {isRegistering ? "Registering..." : "Register Now"}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" onClick={onCancel} disabled={isCancelling} className="rounded-full">
                  {isCancelling ? "Cancelling..." : "Cancel"}
                </Button>
                <Link href={`/dashboard/workshops/${workshop.id}`}>
                  <Button size="sm" variant="outline" className="w-full rounded-full">
                    <Video className="h-3.5 w-3.5 mr-1" /> Join Link
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
