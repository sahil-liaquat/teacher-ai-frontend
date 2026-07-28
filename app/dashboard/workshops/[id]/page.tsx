"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Laptop,
  Video,
  ChevronLeft,
  User,
  Linkedin,
  Globe,
  Award,
  AlertCircle,
  CheckCircle,
  FileCheck,
  PlaySquare,
  Star,
  Eye
} from "lucide-react";
import Link from "next/link";
import { backendApi, resolveUploadUrl } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkshopImage } from "@/components/workshop-image";

export default function WorkshopDetailPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const isAdminPreview = searchParams.get("preview") === "user";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  const workshopQuery = useQuery({
    queryKey: ["app-workshop-detail", id],
    queryFn: () => backendApi.workshop(id)
  });

  const registrationsQuery = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => backendApi.myRegistrations(),
    enabled: !isAdminPreview
  });

  const registerMutation = useMutation({
    mutationFn: () => backendApi.registerWorkshop(id),
    onSuccess: () => {
      toast({
        title: "Registered successfully",
        description: "You have reserved your seat for this workshop.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["app-workshop-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["app-workshops"] });
    },
    onError: (e) => {
      toast({
        title: "Registration failed",
        description: getErrorMessage(e, "Please try again later."),
        variant: "error"
      });
    }
  });

  const cancelRegistrationMutation = useMutation({
    mutationFn: () => backendApi.cancelWorkshopRegistration(id),
    onSuccess: () => {
      toast({
        title: "Registration cancelled",
        description: "Your workshop seat has been released.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["app-workshop-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["app-workshops"] });
    },
    onError: (e) => {
      toast({
        title: "Could not cancel registration",
        description: getErrorMessage(e, "Please try again later."),
        variant: "error"
      });
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: () => backendApi.submitWorkshopFeedback(id, {
      feedback_rating: feedbackRating,
      feedback_text: feedbackText.trim() || null
    }),
    onSuccess: () => {
      toast({
        title: "Feedback saved",
        description: "Thanks for helping us improve future Growth Hub sessions.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (e) => {
      toast({
        title: "Could not save feedback",
        description: getErrorMessage(e, "Please try again later."),
        variant: "error"
      });
    }
  });

  const workshop = workshopQuery.data;
  const registration = registrationsQuery.data?.find((reg) => reg.workshop_id === id);
  const isLoading = workshopQuery.isLoading;
  const backHref = isAdminPreview ? "/admin/workshops" : "/dashboard/workshops";
  const backLabel = isAdminPreview ? "Back to Admin Workshops" : "Back to Growth Hub";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-teachpad-blue" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="space-y-6">
        <Link href={backHref} className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4 mr-1" /> {backLabel}
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-black text-slate-950">Session not found</h3>
            <p className="mt-2 text-sm text-slate-600">The session you are looking for may have been archived or deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnline = workshop.mode === "online" || workshop.mode === "hybrid";
  const isOffline = workshop.mode === "offline" || workshop.mode === "hybrid";
  const formattedDate = new Date(workshop.scheduled_at).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
  const formattedTime = new Date(workshop.scheduled_at).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const isDeadlinePassed = workshop.registration_deadline
    ? new Date() > new Date(workshop.registration_deadline)
    : false;
  const hasStarted = new Date() >= new Date(workshop.scheduled_at);
  const isRegistered = isAdminPreview ? false : workshop.is_registered;
  const canCancel = isRegistered && !hasStarted;

  return (
    <div className="space-y-6">
      {isAdminPreview ? (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
          <Eye className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-extrabold">User preview</p>
            <p className="text-xs text-blue-700">This is the user-facing workshop view. Registration actions are disabled in preview mode.</p>
          </div>
        </div>
      ) : null}

      <Link href={backHref} className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" /> {backLabel}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Main Info */}
          <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
            <div className="relative aspect-video overflow-hidden bg-slate-100">
              <WorkshopImage
                bannerUrl={workshop.banner_url}
                alt={workshop.title}
                className="h-full w-full object-cover object-center"
                fallback={
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white/20">
                  <Calendar className="h-24 w-24" />
                </div>
                }
              />
            </div>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className={isOnline ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}>
                  {workshop.mode === "online" ? "Online Webinar" : workshop.mode === "offline" ? "Offline Venue" : "Hybrid Mode"}
                </Badge>
                {workshop.is_featured && <Badge className="bg-amber-50 text-amber-700">Featured</Badge>}
              </div>

              <h1 className="mt-3 text-2xl font-black text-slate-950 leading-tight md:text-3xl">
                {workshop.title}
              </h1>

              <div className="mt-6 space-y-4 text-sm text-slate-700 border-y border-slate-100 py-5">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-slate-900">{formattedDate}</p>
                    <p className="text-slate-500 mt-0.5">Scheduled Date</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-slate-900">{formattedTime} {workshop.duration_minutes ? `(${workshop.duration_minutes} Minutes)` : ""}</p>
                    <p className="text-slate-500 mt-0.5">Start Time</p>
                  </div>
                </div>
                {workshop.registration_deadline && (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-slate-900">
                        {new Date(workshop.registration_deadline).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      <p className="text-slate-500 mt-0.5">Registration Deadline</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">About this Session</h3>
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {workshop.description || "In this session, we will deep dive into syllabus mapping, textbooks integration, and creating lessons plan / worksheets utilizing AI platforms. You will learn to draft, iterate, and download ready-to-use resources."}
                </p>
              </div>

              {/* Future Ready Features */}
              {(workshop.enable_certificates || workshop.enable_recordings) && (
                <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Session Benefits</h4>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {workshop.enable_certificates && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                        <span>Completion Certificate</span>
                      </div>
                    )}
                    {workshop.enable_recordings && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <PlaySquare className="h-5 w-5 text-emerald-600" />
                        <span>Lifetime Access to Recording</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Speakers */}
          {workshop.hosts.length ? (
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-base font-extrabold text-slate-900">About the Speakers</h3>
                <div className="divide-y divide-slate-100">
                  {workshop.hosts.map((host) => (
                    <div key={host.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-start">
                      {host.profile_photo ? (
                        <img
                          src={resolveUploadUrl(host.profile_photo)}
                          alt={host.full_name}
                          className="h-16 w-16 rounded-2xl object-cover border"
                        />
                      ) : (
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-teachpad-blue border border-blue-100">
                          <User className="h-8 w-8" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{host.full_name}</h4>
                          {host.years_of_experience && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                              {host.years_of_experience}+ yrs exp
                            </span>
                          )}
                        </div>
                        {host.designation && (
                          <p className="text-xs font-bold text-teachpad-blue mt-0.5">{host.designation} {host.organization ? `at ${host.organization}` : ""}</p>
                        )}
                        {host.bio && (
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{host.bio}</p>
                        )}
                        <div className="flex gap-3 mt-3">
                          {host.linkedin && (
                            <a
                              href={host.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                          {host.website && (
                            <a
                              href={host.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar Status / Actions */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Registration Status</h3>
              
              {isRegistered ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold">You are registered for this event!</span>
                  </div>

                  {isOnline && workshop.meeting_link && (
                    <div className="space-y-2 border-t pt-4">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Meeting Link</label>
                      <a
                        href={workshop.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl font-bold bg-blue-600 text-white shadow-md hover:bg-blue-700 transition"
                      >
                        <Video className="h-4 w-4" /> Join Online Session
                      </a>
                    </div>
                  )}

                  {isOffline && workshop.venue_details && (
                    <div className="space-y-1.5 border-t pt-4 text-xs">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Venue Location</label>
                      <div className="flex items-start gap-2 text-slate-700 mt-1">
                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-semibold">{workshop.venue_details}</span>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const whatsappGroupLink = workshop.whatsapp_group_link || "https://chat.whatsapp.com/CSZrJFz6sMpJuSmAB87tq7?s=sw&p=i&ilr=1&amv=0";
                    return (
                      <div className="space-y-2 border-t pt-4">
                        <label className="text-[10px] uppercase font-bold text-slate-400">WhatsApp Group</label>
                        <a
                          href={whatsappGroupLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-md transition"
                        >
                          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.413 9.863-9.864.001-2.641-1.024-5.123-2.887-6.989A9.776 9.776 0 0 0 12.008 1.91c-5.444 0-9.871 4.415-9.875 9.869-.001 1.772.477 3.5 1.385 5.011L2.508 21.66l5.139-1.348zm10.741-6.969c-.297-.148-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          </svg>
                          Join WhatsApp Group
                        </a>
                      </div>
                    );
                  })()}

                  <Button
                    variant="outline"
                    onClick={() => cancelRegistrationMutation.mutate()}
                    disabled={!canCancel || cancelRegistrationMutation.isPending}
                    className="w-full"
                  >
                    {cancelRegistrationMutation.isPending
                      ? "Cancelling..."
                      : canCancel
                      ? "Cancel Registration"
                      : "Cancellation Closed"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Reservations are free but limited. Complete registration to unlock the joining information, certificates, and recordings.
                  </p>

                  <div className="text-xs space-y-2 border-t border-slate-100 pt-4">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Total Seats Remaining:</span>
                      <span className="text-slate-800 font-bold">
                        {workshop.max_capacity
                          ? Math.max(0, workshop.max_capacity - workshop.registered_users_count)
                          : "Unlimited"}
                      </span>
                    </div>
                    {workshop.max_capacity && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-500"
                          style={{ width: `${(workshop.registered_users_count / workshop.max_capacity) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      if (!isAdminPreview) registerMutation.mutate();
                    }}
                    disabled={isAdminPreview || registerMutation.isPending || isDeadlinePassed}
                    className="w-full h-11"
                    title={isAdminPreview ? "Registration is disabled in preview mode" : undefined}
                  >
                    {registerMutation.isPending
                      ? "Registering..."
                      : isDeadlinePassed
                      ? "Registration Closed"
                      : "Register Free Seat"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isRegistered ? (
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Session Feedback</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Share a quick rating after the session, or update it anytime.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackRating(rating)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-100 bg-slate-50 text-amber-400 transition hover:bg-amber-50"
                      aria-label={`Rate ${rating} out of 5`}
                    >
                      <Star className={cn("h-5 w-5", rating <= feedbackRating && "fill-current")} />
                    </button>
                  ))}
                  {registration?.feedback_rating ? (
                    <span className="ml-2 text-xs font-semibold text-slate-500">
                      Saved rating: {registration.feedback_rating}/5
                    </span>
                  ) : null}
                </div>

                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={registration?.feedback_text || "What worked well? What should we improve?"}
                  className="min-h-24 resize-none"
                />

                <Button
                  onClick={() => feedbackMutation.mutate()}
                  disabled={feedbackMutation.isPending}
                  className="w-full"
                >
                  {feedbackMutation.isPending ? "Saving..." : registration?.feedback_rating ? "Update Feedback" : "Submit Feedback"}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
