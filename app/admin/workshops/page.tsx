"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Laptop,
  Users,
  Award,
  Video,
  FileText,
  CheckCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Star,
  User,
  Linkedin,
  Globe,
  Contact,
  XCircle,
  CheckCircle2
} from "lucide-react";
import { backendApi, type Workshop, type Host, type WorkshopRegistration, BACKEND_ROOT } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const WORKSHOPS_PAGE_SIZE = 50;

export default function AdminWorkshopsAndHostsPage() {
  const [primaryTab, setPrimaryTab] = useState<"workshops" | "hosts">("workshops");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Workshop-specific UI State
  const [activeSubTab, setActiveSubTab] = useState<"all" | "draft" | "published">("all");
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [isWorkshopFormOpen, setIsWorkshopFormOpen] = useState(false);
  const [isDeletingWorkshop, setIsDeletingWorkshop] = useState<Workshop | null>(null);
  const [registrationsWorkshop, setRegistrationsWorkshop] = useState<Workshop | null>(null);

  // Host-specific UI State
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [isHostFormOpen, setIsHostFormOpen] = useState(false);
  const [isDeletingHost, setIsDeletingHost] = useState<Host | null>(null);
  const [isInlineHostCreation, setIsInlineHostCreation] = useState(false);

  // Workshop Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | "">("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [mode, setMode] = useState<"online" | "offline" | "hybrid">("online");
  const [meetingLink, setMeetingLink] = useState("");
  const [venueDetails, setVenueDetails] = useState("");
  const [maxCapacity, setMaxCapacity] = useState<number | "">("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [enableCertificates, setEnableCertificates] = useState(false);
  const [enableRecordings, setEnableRecordings] = useState(false);
  const [publishingDestination, setPublishingDestination] = useState<"landing_page" | "teachpad_app" | "both">("both");
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);

  // Shared Host Form State (handles both main CRUD and inline workshop creation)
  const [hostName, setHostName] = useState("");
  const [hostDesignation, setHostDesignation] = useState("");
  const [hostOrganization, setHostOrganization] = useState("");
  const [hostBio, setHostBio] = useState("");
  const [hostExperience, setHostExperience] = useState<number | "">("");
  const [hostLinkedin, setHostLinkedin] = useState("");
  const [hostWebsite, setHostWebsite] = useState("");
  const [hostIsActive, setHostIsActive] = useState(true);
  const [hostPhoto, setHostPhoto] = useState<string | null>(null);

  // Media upload progress states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingHostPhoto, setUploadingHostPhoto] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries
  const hostsQuery = useQuery({
    queryKey: ["admin-hosts-list", page],
    queryFn: () => backendApi.hosts(false, 0, 150),
    placeholderData: (previous) => previous
  });

  const workshopsQuery = useQuery({
    queryKey: ["admin-workshops", page, activeSubTab],
    queryFn: () => backendApi.workshops({
      status: activeSubTab === "all" ? undefined : activeSubTab,
      skip: (page - 1) * WORKSHOPS_PAGE_SIZE,
      limit: WORKSHOPS_PAGE_SIZE
    }),
    placeholderData: (previous) => previous
  });

  const registrationsQuery = useQuery({
    queryKey: ["admin-workshop-registrations", registrationsWorkshop?.id],
    queryFn: () => backendApi.workshopRegistrations(registrationsWorkshop!.id),
    enabled: Boolean(registrationsWorkshop?.id)
  });

  // Host metrics
  const totalHosts = hostsQuery.data?.total || 0;
  const activeHosts = hostsQuery.data?.items?.filter((h) => h.is_active).length || 0;
  const inactiveHosts = totalHosts - activeHosts;

  // Workshop metrics
  const totalWorkshops = workshopsQuery.data?.total || 0;
  const publishedWorkshops = workshopsQuery.data?.items?.filter((w) => w.status === "published").length || 0;
  const draftWorkshops = (workshopsQuery.data?.items?.length || 0) - publishedWorkshops;

  // Filters
  const filteredWorkshops = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const items = workshopsQuery.data?.items || [];
    if (!search) return items;
    return items.filter((w) =>
      [w.title, w.description, w.venue_details]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [searchTerm, workshopsQuery.data?.items]);

  const filteredHosts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const items = hostsQuery.data?.items || [];
    if (!search) return items;
    return items.filter((h) =>
      [h.full_name, h.designation, h.organization, h.bio]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [searchTerm, hostsQuery.data?.items]);

  const registrations = registrationsQuery.data || [];
  const attendedCount = registrations.filter((registration) => registration.attended).length;
  const certificatesIssuedCount = registrations.filter((registration) => registration.certificate_issued).length;

  // Media Upload handler
  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "thumbnail" | "host") {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "banner") setUploadingBanner(true);
    if (type === "thumbnail") setUploadingThumbnail(true);
    if (type === "host") setUploadingHostPhoto(true);

    try {
      const res = await backendApi.uploadWorkshopMedia(file, type === "host" ? "hosts" : "workshops");
      if (type === "banner") setBannerUrl(res.path);
      if (type === "thumbnail") thumbnailUrlUpdate(res.path);
      if (type === "host") setHostPhoto(res.path);
      toast({ title: "Media uploaded successfully" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: getErrorMessage(err, "Failed to upload file"),
        variant: "error"
      });
    } finally {
      if (type === "banner") setUploadingBanner(false);
      if (type === "thumbnail") setUploadingThumbnail(false);
      if (type === "host") setUploadingHostPhoto(false);
    }
  }

  // Workaround for closure variable naming
  function thumbnailUrlUpdate(path: string) {
    setThumbnailUrl(path);
  }

  // Host CRUD Mutations
  const createHostMutation = useMutation({
    mutationFn: (payload: Omit<Host, "id">) => backendApi.createHost(payload),
    onSuccess: (newHost) => {
      if (isInlineHostCreation) {
        toast({ title: "Host created inline", description: `${newHost.full_name} is now available.` });
        setSelectedHostIds((current) => [...current, newHost.id]);
      } else {
        toast({ title: "Host created", description: "New host profile added successfully.", variant: "success" });
      }
      resetHostForm();
      queryClient.invalidateQueries({ queryKey: ["admin-hosts-list"] });
    },
    onError: (e) => toast({ title: "Failed to create host", description: getErrorMessage(e, "Could not create host speaker profile."), variant: "error" })
  });

  const updateHostMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Host> }) => backendApi.updateHost(id, payload),
    onSuccess: () => {
      toast({ title: "Host updated", description: "Host profile updated successfully.", variant: "success" });
      resetHostForm();
      queryClient.invalidateQueries({ queryKey: ["admin-hosts-list"] });
    },
    onError: (e) => toast({ title: "Failed to update host", description: getErrorMessage(e, "Could not update host speaker profile."), variant: "error" })
  });

  const deleteHostMutation = useMutation({
    mutationFn: (id: string) => backendApi.deleteHost(id),
    onSuccess: () => {
      toast({ title: "Host deleted", description: "Host profile removed successfully.", variant: "success" });
      setIsDeletingHost(null);
      queryClient.invalidateQueries({ queryKey: ["admin-hosts-list"] });
    },
    onError: (e) => toast({ title: "Failed to delete host", description: getErrorMessage(e, "Could not delete host profile."), variant: "error" })
  });

  const toggleHostActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      backendApi.updateHost(id, { is_active: isActive }),
    onSuccess: (_, variables) => {
      toast({ title: variables.isActive ? "Host speaker activated" : "Host speaker deactivated" });
      queryClient.invalidateQueries({ queryKey: ["admin-hosts-list"] });
    },
    onError: (e) => toast({ title: "Status update failed", description: getErrorMessage(e, "Could not toggle host activation state."), variant: "error" })
  });

  // Workshop CRUD Mutations
  const createWorkshopMutation = useMutation({
    mutationFn: (payload: any) => backendApi.createWorkshop(payload),
    onSuccess: () => {
      toast({ title: "Workshop scheduled", description: "Workshop created successfully.", variant: "success" });
      resetWorkshopForm();
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
    },
    onError: (e) => toast({ title: "Failed to create workshop", description: getErrorMessage(e, "Could not create workshop."), variant: "error" })
  });

  const updateWorkshopMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => backendApi.updateWorkshop(id, payload),
    onSuccess: () => {
      toast({ title: "Workshop updated", description: "Workshop updated successfully.", variant: "success" });
      resetWorkshopForm();
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
    },
    onError: (e) => toast({ title: "Failed to update workshop", description: getErrorMessage(e, "Could not update workshop."), variant: "error" })
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: (id: string) => backendApi.deleteWorkshop(id),
    onSuccess: () => {
      toast({ title: "Workshop deleted", description: "Workshop deleted successfully.", variant: "success" });
      setIsDeletingWorkshop(null);
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
    },
    onError: (e) => toast({ title: "Failed to delete workshop", description: getErrorMessage(e, "Could not delete workshop."), variant: "error" })
  });

  const duplicateWorkshopMutation = useMutation({
    mutationFn: (id: string) => backendApi.duplicateWorkshop(id),
    onSuccess: () => {
      toast({ title: "Workshop duplicated", description: "Draft duplicate of workshop created.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
    },
    onError: (e) => toast({ title: "Failed to duplicate workshop", description: getErrorMessage(e, "Could not duplicate workshop."), variant: "error" })
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      backendApi.updateWorkshop(id, { is_featured: isFeatured }),
    onSuccess: (_, variables) => {
      toast({ title: variables.isFeatured ? "Featured" : "Unfeatured" });
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
    },
    onError: (e) => toast({ title: "Update failed", description: getErrorMessage(e, "Could not toggle featured status."), variant: "error" })
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { attended?: boolean; certificate_issued?: boolean } }) =>
      backendApi.updateWorkshopRegistration(id, payload),
    onSuccess: () => {
      toast({ title: "Registration updated", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-workshop-registrations", registrationsWorkshop?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-workshops"] });
    },
    onError: (e) => toast({ title: "Update failed", description: getErrorMessage(e, "Could not update this registration."), variant: "error" })
  });

  // Helpers
  function formatForInput(dateStr?: string | null) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  }

  function exportRegistrationsCsv() {
    if (!registrationsWorkshop || !registrations.length) return;

    const columns = [
      "Name",
      "Email",
      "Registered At",
      "Attended",
      "Certificate Issued",
      "Feedback Rating",
      "Feedback Text"
    ];
    const rows = registrations.map((registration) => [
      registration.user.full_name || registration.user.name || "",
      registration.user.email || "",
      registration.created_at ? formatDateTime(registration.created_at) : "",
      registration.attended ? "Yes" : "No",
      registration.certificate_issued ? "Yes" : "No",
      registration.feedback_rating ?? "",
      registration.feedback_text || ""
    ]);
    const csv = [columns, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${registrationsWorkshop.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Resets
  function resetHostForm() {
    setHostName("");
    setHostDesignation("");
    setHostOrganization("");
    setHostBio("");
    setHostExperience("");
    setHostLinkedin("");
    setHostWebsite("");
    setHostIsActive(true);
    setHostPhoto(null);
    setEditingHost(null);
    setIsHostFormOpen(false);
    setIsInlineHostCreation(false);
  }

  function resetWorkshopForm() {
    setTitle("");
    setDescription("");
    setScheduledAt("");
    setDurationMinutes("");
    setStatus("draft");
    setIsFeatured(false);
    setRegistrationDeadline("");
    setMode("online");
    setMeetingLink("");
    setVenueDetails("");
    setMaxCapacity("");
    setBannerUrl(null);
    setThumbnailUrl(null);
    setEnableCertificates(false);
    setEnableRecordings(false);
    setPublishingDestination("both");
    setSelectedHostIds([]);
    setEditingWorkshop(null);
    setIsWorkshopFormOpen(false);
  }

  // Opens
  function openEditWorkshop(w: Workshop) {
    setEditingWorkshop(w);
    setTitle(w.title);
    setDescription(w.description || "");
    setScheduledAt(formatForInput(w.scheduled_at));
    setDurationMinutes(w.duration_minutes ?? "");
    setStatus(w.status);
    setIsFeatured(w.is_featured);
    setRegistrationDeadline(formatForInput(w.registration_deadline));
    setMode(w.mode);
    setMeetingLink(w.meeting_link || "");
    setVenueDetails(w.venue_details || "");
    setMaxCapacity(w.max_capacity ?? "");
    setBannerUrl(w.banner_url || null);
    setThumbnailUrl(w.thumbnail_url || null);
    setEnableCertificates(w.enable_certificates);
    setEnableRecordings(w.enable_recordings);
    setPublishingDestination(w.publishing_destination);
    setSelectedHostIds(w.hosts.map((h) => h.id));
    setIsWorkshopFormOpen(true);
  }

  function openEditHost(host: Host) {
    setEditingHost(host);
    setHostName(host.full_name);
    setHostDesignation(host.designation || "");
    setHostOrganization(host.organization || "");
    setHostBio(host.bio || "");
    setHostExperience(host.years_of_experience ?? "");
    setHostLinkedin(host.linkedin || "");
    setHostWebsite(host.website || "");
    setHostIsActive(host.is_active);
    setHostPhoto(host.profile_photo || null);
    setIsHostFormOpen(true);
  }

  function openInlineHostCreation() {
    setIsInlineHostCreation(true);
    setIsHostFormOpen(true);
  }

  // Submits
  function handleHostSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hostName) return;

    const payload = {
      full_name: hostName,
      designation: hostDesignation || null,
      organization: hostOrganization || null,
      bio: hostBio || null,
      years_of_experience: hostExperience !== "" ? Number(hostExperience) : null,
      linkedin: hostLinkedin || null,
      website: hostWebsite || null,
      is_active: hostIsActive,
      profile_photo: hostPhoto || null
    };

    if (editingHost?.id) {
      updateHostMutation.mutate({ id: editingHost.id, payload });
    } else {
      createHostMutation.mutate(payload);
    }
  }

  function handleWorkshopSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !scheduledAt) return;

    const payload = {
      title,
      description: description || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: durationMinutes !== "" ? Number(durationMinutes) : null,
      status,
      is_featured: isFeatured,
      registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
      mode,
      meeting_link: meetingLink || null,
      venue_details: venueDetails || null,
      max_capacity: maxCapacity !== "" ? Number(maxCapacity) : null,
      banner_url: bannerUrl,
      thumbnail_url: thumbnailUrl,
      enable_certificates: enableCertificates,
      enable_recordings: enableRecordings,
      publishing_destination: publishingDestination,
      host_ids: selectedHostIds
    };

    if (editingWorkshop?.id) {
      updateWorkshopMutation.mutate({ id: editingWorkshop.id, payload });
    } else {
      createWorkshopMutation.mutate(payload);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Growth Hub Resources"
        title="Teacher Growth Hub portal"
        description="Schedule webinars, physical events, and manage instructor profiles in one place."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openInlineHostCreation()}>
              <Plus className="h-4 w-4 mr-1" /> Add Speaker / Host
            </Button>
            <Button onClick={() => setIsWorkshopFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Workshop
            </Button>
          </div>
        }
      />

      {/* Primary Navigation Tabs */}
      <div className="flex gap-4 border-b border-gray-150 pb-px mb-6">
        <button
          className={cn(
            "pb-3 pt-1 text-sm font-bold border-b-2 px-6 transition-all uppercase tracking-wider flex items-center gap-1.5",
            primaryTab === "workshops"
              ? "border-teachpad-blue text-teachpad-blue"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
          onClick={() => { setPrimaryTab("workshops"); setSearchTerm(""); setPage(1); }}
        >
          <Calendar className="h-4 w-4" /> Workshops
        </button>
        <button
          className={cn(
            "pb-3 pt-1 text-sm font-bold border-b-2 px-6 transition-all uppercase tracking-wider flex items-center gap-1.5",
            primaryTab === "hosts"
              ? "border-teachpad-blue text-teachpad-blue"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
          onClick={() => { setPrimaryTab("hosts"); setSearchTerm(""); setPage(1); }}
        >
          <Contact className="h-4 w-4" /> Speakers / Hosts
        </button>
      </div>

      {/* CONDITIONAL METRIC CARDS */}
      {primaryTab === "workshops" ? (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <MetricCard label="Total Workshops" value={totalWorkshops} tone="blue" icon={<Calendar className="h-5 w-5" />} />
          <MetricCard label="Live/Published" value={publishedWorkshops} tone="green" icon={<CheckCircle className="h-5 w-5" />} />
          <MetricCard label="Drafts" value={draftWorkshops} tone="amber" icon={<AlertCircle className="h-5 w-5" />} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <MetricCard label="Total Speakers" value={totalHosts} tone="blue" icon={<User className="h-5 w-5" />} />
          <MetricCard label="Active Status" value={activeHosts} tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
          <MetricCard label="Inactive Status" value={inactiveHosts} tone="rose" icon={<XCircle className="h-5 w-5" />} />
        </div>
      )}

      {/* WORKSHOPS TAB PANEL */}
      {primaryTab === "workshops" && (
        <>
          <div className="flex gap-2 border-b border-gray-100 pb-px mb-4">
            {(["all", "draft", "published"] as const).map((tab) => (
              <button
                key={tab}
                className={cn(
                  "pb-3 pt-1 text-sm font-bold border-b-2 px-4 transition-all uppercase tracking-wider",
                  activeSubTab === tab
                    ? "border-teachpad-blue text-teachpad-blue"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                )}
                onClick={() => { setActiveSubTab(tab); setPage(1); }}
              >
                {tab}
              </button>
            ))}
          </div>

          <AdminPanel
            title="Workshops Ledger"
            description={`Displaying all ${activeSubTab} workshops.`}
            actions={
              <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:w-72">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  className="h-7 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                  placeholder="Search workshops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            }
            contentClassName="p-0"
          >
            {workshopsQuery.isLoading ? <div className="p-6"><LoadingState label="Loading workshops" /></div> : null}
            {!workshopsQuery.isLoading && !filteredWorkshops.length ? (
              <div className="p-6">
                <EmptyState title="No workshops found" description="Create a new workshop to get started." />
              </div>
            ) : null}

            {filteredWorkshops.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Workshop</th>
                      <th className="px-6 py-4 font-semibold">Date & Mode</th>
                      <th className="px-6 py-4 font-semibold">Hosts</th>
                      <th className="px-6 py-4 font-semibold">Capacity</th>
                      <th className="px-6 py-4 font-semibold">Publish Destination</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredWorkshops.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-start gap-3">
                            {w.thumbnail_url ? (
                              <img
                                src={`${BACKEND_ROOT}/uploads/${w.thumbnail_url}`}
                                alt="thumbnail"
                                className="h-10 w-10 shrink-0 rounded-lg object-cover border border-gray-100 mt-0.5"
                              />
                            ) : (
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-400 mt-0.5">
                                <FileText className="h-5 w-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900 truncate leading-snug">{w.title}</span>
                                {w.is_featured && (
                                  <span className="grid h-4 w-4 shrink-0 place-items-center text-amber-400" title="Featured">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{w.description || "No description"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-medium text-gray-950">{formatDateTime(w.scheduled_at)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {w.mode === "online" ? (
                                <>
                                  <Laptop className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="capitalize">{w.mode} webinar</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="capitalize">{w.mode} event</span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {w.hosts.length ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {w.hosts.map((h) => (
                                <span key={h.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                  {h.full_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No host assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>
                              {w.registered_users_count} / {w.max_capacity ?? "∞"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={w.publishing_destination === "both" ? "info" : "neutral"}>
                            {w.publishing_destination === "landing_page"
                              ? "Landing Page"
                              : w.publishing_destination === "teachpad_app"
                              ? "TeachPad App"
                              : "Both"}
                          </StatusPill>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill status={w.status === "published" ? "success" : "warning"}>
                            {w.status}
                          </StatusPill>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRegistrationsWorkshop(w)}
                              title="Manage registrations"
                            >
                              <Users className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleFeaturedMutation.mutate({ id: w.id, isFeatured: !w.is_featured })}
                              title={w.is_featured ? "Remove featured" : "Feature workshop"}
                            >
                              <Star className={cn("h-3.5 w-3.5", w.is_featured ? "text-amber-400 fill-current" : "text-gray-400")} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => duplicateWorkshopMutation.mutate(w.id)} title="Duplicate">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEditWorkshop(w)} title="Edit">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setIsDeletingWorkshop(w)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </AdminPanel>
        </>
      )}

      {/* SPEAKERS TAB PANEL */}
      {primaryTab === "hosts" && (
        <AdminPanel
          title="Speaker Directory"
          description="Browse, filter, and edit host profiles."
          actions={
            <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:w-72">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                className="h-7 border-0 bg-transparent px-0 shadow-none focus:ring-0"
                placeholder="Search speakers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
          contentClassName="p-0"
        >
          {hostsQuery.isLoading ? <div className="p-6"><LoadingState label="Loading speakers" /></div> : null}
          {!hostsQuery.isLoading && !filteredHosts.length ? (
            <div className="p-6">
              <EmptyState title="No hosts found" description="Try another search or add a new host." />
            </div>
          ) : null}

          {filteredHosts.length ? (
            <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHosts.map((host) => (
                <div
                  key={host.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                    host.is_active ? "border-gray-100" : "border-gray-200 opacity-75"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {host.profile_photo ? (
                      <img
                        src={`${BACKEND_ROOT}/uploads/${host.profile_photo}`}
                        alt={host.full_name}
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover border border-gray-100"
                      />
                    ) : (
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-teachpad-blue border border-blue-100">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-gray-900 truncate">{host.full_name}</h3>
                        <StatusPill status={host.is_active ? "success" : "neutral"}>
                          {host.is_active ? "active" : "inactive"}
                        </StatusPill>
                      </div>
                      {host.designation && (
                        <p className="text-xs font-semibold text-teachpad-blue mt-0.5 truncate">{host.designation}</p>
                      )}
                      {host.organization && (
                        <p className="text-xs text-gray-500 truncate">{host.organization}</p>
                      )}
                    </div>
                  </div>

                  {host.bio && (
                    <p className="text-xs text-gray-600 mt-4 line-clamp-3 leading-relaxed flex-1">{host.bio}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs border-t border-gray-50 pt-4">
                    {host.years_of_experience !== null && (
                      <div className="flex items-center gap-1 text-gray-500 rounded bg-gray-50 px-2 py-0.5">
                        <Award className="h-3.5 w-3.5" />
                        <span>{host.years_of_experience} yrs exp</span>
                      </div>
                    )}
                    {host.linkedin && (
                      <a
                        href={host.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded"
                      >
                        <Linkedin className="h-3 w-3" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {host.website && (
                      <a
                        href={host.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-600 hover:underline bg-emerald-50 px-2 py-0.5 rounded"
                      >
                        <Globe className="h-3 w-3" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleHostActiveMutation.mutate({ id: host.id, isActive: !host.is_active })}
                    >
                      {host.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditHost(host)}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setIsDeletingHost(host)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </AdminPanel>
      )}

      {/* CREATE/EDIT WORKSHOP DIALOG */}
      {isWorkshopFormOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm overflow-y-auto py-10">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 shrink-0">{editingWorkshop ? "Edit Workshop Details" : "Create New Workshop"}</h2>
            
            <form onSubmit={handleWorkshopSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Workshop Title *</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Syllabus Integration with Generative AI" className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide curriculum info, target teachers, outcomes..." className="mt-1 h-20 resize-none" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scheduled Date & Time *</label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Duration (Minutes)</label>
                  <Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="60" className="mt-1" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Registration Deadline</label>
                  <Input type="datetime-local" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Maximum Capacity</label>
                  <Input type="number" min={1} value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="Leave empty for unlimited" className="mt-1" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Workshop Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-teachpad-blue focus:outline-none"
                  >
                    <option value="online">Online Webinar</option>
                    <option value="offline">Offline Venue</option>
                    <option value="hybrid">Hybrid (Both)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Publishing Destination</label>
                  <select
                    value={publishingDestination}
                    onChange={(e) => setPublishingDestination(e.target.value as any)}
                    className="mt-1 flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-teachpad-blue focus:outline-none"
                  >
                    <option value="both">Both Landing Page & TeachPad App</option>
                    <option value="landing_page">Landing Page Only</option>
                    <option value="teachpad_app">TeachPad App Only</option>
                  </select>
                </div>
              </div>

              {mode === "online" || mode === "hybrid" ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Online Meeting Link (Zoom, Meet, etc.)</label>
                  <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" className="mt-1" />
                </div>
              ) : null}

              {mode === "offline" || mode === "hybrid" ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Venue Address Details</label>
                  <Textarea value={venueDetails} onChange={(e) => setVenueDetails(e.target.value)} placeholder="Auditorium A, Block 3, Academic Block, New Delhi" className="mt-1 h-14 resize-none" />
                </div>
              ) : null}

              {/* Media Uploads */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Banner Image</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    {bannerUrl ? (
                      <img src={`${BACKEND_ROOT}/uploads/${bannerUrl}`} alt="Banner" className="h-10 w-16 rounded object-cover border" />
                    ) : (
                      <div className="grid h-10 w-16 place-items-center rounded bg-gray-100 text-gray-400 border border-dashed"><Upload className="h-4 w-4" /></div>
                    )}
                    <label className="cursor-pointer inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 transition">
                      {uploadingBanner ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : null}
                      Upload Banner
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "banner")} disabled={uploadingBanner} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Thumbnail Image</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    {thumbnailUrl ? (
                      <img src={`${BACKEND_ROOT}/uploads/${thumbnailUrl}`} alt="Thumbnail" className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded bg-gray-100 text-gray-400 border border-dashed"><Upload className="h-4 w-4" /></div>
                    )}
                    <label className="cursor-pointer inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 transition">
                      {uploadingThumbnail ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : null}
                      Upload Thumb
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "thumbnail")} disabled={uploadingThumbnail} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Host Selector */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Assign Hosts</label>
                  <button
                    type="button"
                    onClick={() => openInlineHostCreation()}
                    className="text-xs font-bold text-teachpad-blue hover:underline"
                  >
                    + Create Host Inline
                  </button>
                </div>
                {hostsQuery.isLoading ? <p className="text-xs text-gray-500 mt-2">Loading hosts...</p> : null}
                {hostsQuery.data?.items?.length ? (
                  <div className="grid gap-2 sm:grid-cols-2 mt-2 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2.5 bg-gray-50/50">
                    {hostsQuery.data.items.map((host) => {
                      const isSelected = selectedHostIds.includes(host.id);
                      return (
                        <label
                          key={host.id}
                          className={cn(
                            "flex items-center gap-2 border rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer select-none transition-colors",
                            isSelected
                              ? "bg-blue-50 border-blue-200 text-teachpad-blue"
                              : "bg-white border-gray-150 hover:bg-gray-50 text-gray-700"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-teachpad-blue focus:ring-teachpad-blue"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedHostIds((current) =>
                                isSelected
                                  ? current.filter((id) => id !== host.id)
                                  : [...current, host.id]
                              );
                            }}
                          />
                          <span className="truncate">{host.full_name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : !hostsQuery.isLoading ? (
                  <p className="text-xs text-gray-400 italic mt-2">No active host profiles found. Please create one inline.</p>
                ) : null}
              </div>

              {/* Options */}
              <div className="grid gap-3 sm:grid-cols-3 bg-gray-50 p-3 rounded-xl border mt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teachpad-blue focus:ring-teachpad-blue"
                  />
                  <span>Feature Workshop</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCertificates}
                    onChange={(e) => setEnableCertificates(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teachpad-blue focus:ring-teachpad-blue"
                  />
                  <span>Provide Certificates</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRecordings}
                    onChange={(e) => setEnableRecordings(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-teachpad-blue focus:ring-teachpad-blue"
                  />
                  <span>Enable Recordings</span>
                </label>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="flex h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-bold focus:border-teachpad-blue focus:outline-none"
                >
                  <option value="draft">Save as Draft</option>
                  <option value="published">Publish Immediately</option>
                </select>
                <p className="text-xs text-gray-500">Drafts are hidden from teachers & landing pages.</p>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 shrink-0">
                <Button type="button" variant="outline" onClick={resetWorkshopForm} disabled={createWorkshopMutation.isPending || updateWorkshopMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWorkshopMutation.isPending || updateWorkshopMutation.isPending || uploadingBanner || uploadingThumbnail}>
                  {createWorkshopMutation.isPending || updateWorkshopMutation.isPending ? "Saving..." : "Save Workshop"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIFIED SPEAKER / HOST DIALOG (CRUD & INLINE CREATION) */}
      {isHostFormOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm overflow-y-auto py-10">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl my-auto">
            <h2 className="text-lg font-bold text-gray-900">
              {editingHost ? "Edit Speaker Profile" : isInlineHostCreation ? "Create Host Inline" : "Add New Host"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Create a speaker profile to assign as a host across multiple workshops.
            </p>

            <form onSubmit={handleHostSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Full Name *</label>
                <Input value={hostName} onChange={(e) => setHostName(e.target.value)} required placeholder="Dr. Jane Doe" className="mt-1" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Designation</label>
                  <Input value={hostDesignation} onChange={(e) => setHostDesignation(e.target.value)} placeholder="Senior AI Researcher" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Organization</label>
                  <Input value={hostOrganization} onChange={(e) => setHostOrganization(e.target.value)} placeholder="State Education Board" className="mt-1" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Bio</label>
                <Textarea value={hostBio} onChange={(e) => setHostBio(e.target.value)} placeholder="Tell us about their background, credentials, and experience..." className="mt-1 h-20 resize-none" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Years of Experience</label>
                  <Input type="number" min={0} value={hostExperience} onChange={(e) => setHostExperience(e.target.value !== "" ? Number(e.target.value) : "")} placeholder="8" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Profile Photo</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    {hostPhoto ? (
                      <img src={`${BACKEND_ROOT}/uploads/${hostPhoto}`} alt="Preview" className="h-10 w-10 rounded-lg object-cover border" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded bg-gray-105 text-gray-400 border border-dashed"><User className="h-5 w-5" /></div>
                    )}
                    <label className="cursor-pointer inline-flex items-center justify-center h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 transition">
                      {uploadingHostPhoto ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : null}
                      {hostPhoto ? "Change Photo" : "Upload Photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, "host")} disabled={uploadingHostPhoto} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">LinkedIn URL</label>
                  <Input value={hostLinkedin} onChange={(e) => setHostLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Website URL</label>
                  <Input value={hostWebsite} onChange={(e) => setHostWebsite(e.target.value)} placeholder="https://example.com" className="mt-1" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="hostIsActive"
                  checked={hostIsActive}
                  onChange={(e) => setHostIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teachpad-blue focus:ring-teachpad-blue"
                />
                <label htmlFor="hostIsActive" className="text-sm font-semibold text-gray-700">Active and available for workshops</label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={resetHostForm} disabled={createHostMutation.isPending || updateHostMutation.isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHostMutation.isPending || updateHostMutation.isPending || uploadingHostPhoto}>
                  {createHostMutation.isPending || updateHostMutation.isPending ? "Saving..." : "Save Host"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRATION MANAGEMENT DIALOG */}
      {registrationsWorkshop && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm overflow-y-auto py-10">
          <div className="my-auto flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex shrink-0 flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Workshop registrations</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">{registrationsWorkshop.title}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateTime(registrationsWorkshop.scheduled_at)} · {registrationsWorkshop.mode}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportRegistrationsCsv} disabled={!registrations.length}>
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => setRegistrationsWorkshop(null)}>
                  Close
                </Button>
              </div>
            </div>

            <div className="grid shrink-0 gap-3 py-4 sm:grid-cols-3">
              <MetricCard label="Registered" value={registrations.length} tone="blue" icon={<Users className="h-5 w-5" />} />
              <MetricCard label="Attended" value={attendedCount} tone="green" icon={<CheckCircle className="h-5 w-5" />} />
              <MetricCard label="Certificates" value={certificatesIssuedCount} tone="amber" icon={<Award className="h-5 w-5" />} />
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-gray-100">
              {registrationsQuery.isLoading ? (
                <div className="p-6">
                  <LoadingState label="Loading registrations" />
                </div>
              ) : null}

              {!registrationsQuery.isLoading && !registrations.length ? (
                <div className="p-6">
                  <EmptyState title="No registrations yet" description="Registrations will appear here as teachers reserve seats." />
                </div>
              ) : null}

              {registrations.length ? (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Teacher</th>
                      <th className="px-5 py-3 font-semibold">Registered</th>
                      <th className="px-5 py-3 font-semibold">Feedback</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.map((registration: WorkshopRegistration) => {
                      const displayName = registration.user.full_name || registration.user.name || "Teacher";
                      return (
                        <tr key={registration.id} className="align-top hover:bg-gray-50">
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">{displayName}</div>
                            <div className="mt-0.5 text-xs text-gray-500">{registration.user.email || "No email available"}</div>
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-gray-600">
                            {registration.created_at ? formatDateTime(registration.created_at) : "Unknown"}
                          </td>
                          <td className="px-5 py-4">
                            {registration.feedback_rating ? (
                              <div className="max-w-xs">
                                <div className="text-xs font-bold text-amber-600">{registration.feedback_rating}/5 rating</div>
                                {registration.feedback_text ? (
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{registration.feedback_text}</p>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No feedback</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              <StatusPill status={registration.attended ? "success" : "neutral"}>
                                {registration.attended ? "Attended" : "Not attended"}
                              </StatusPill>
                              <StatusPill status={registration.certificate_issued ? "success" : "neutral"}>
                                {registration.certificate_issued ? "Certificate issued" : "No certificate"}
                              </StatusPill>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant={registration.attended ? "outline" : "default"}
                                onClick={() => updateRegistrationMutation.mutate({
                                  id: registration.id,
                                  payload: { attended: !registration.attended }
                                })}
                                disabled={updateRegistrationMutation.isPending}
                              >
                                {registration.attended ? "Undo Attend" : "Mark Attended"}
                              </Button>
                              <Button
                                size="sm"
                                variant={registration.certificate_issued ? "outline" : "default"}
                                onClick={() => updateRegistrationMutation.mutate({
                                  id: registration.id,
                                  payload: { certificate_issued: !registration.certificate_issued }
                                })}
                                disabled={updateRegistrationMutation.isPending}
                              >
                                {registration.certificate_issued ? "Revoke Cert" : "Issue Cert"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* DELETE WORKSHOP CONFIRM DIALOG */}
      {isDeletingWorkshop && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete workshop?</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Are you sure you want to delete the workshop <span className="font-semibold">{isDeletingWorkshop.title}</span>? This will permanently delete the workshop and all of its associated registrations.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="outline" onClick={() => setIsDeletingWorkshop(null)} disabled={deleteWorkshopMutation.isPending}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteWorkshopMutation.mutate(isDeletingWorkshop.id)} disabled={deleteWorkshopMutation.isPending}>
                {deleteWorkshopMutation.isPending ? "Deleting..." : "Delete Workshop"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE HOST CONFIRM DIALOG */}
      {isDeletingHost && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete host profile?</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Are you sure you want to delete <span className="font-semibold">{isDeletingHost.full_name}</span>? This will remove them from all assigned workshops. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Button variant="outline" onClick={() => setIsDeletingHost(null)} disabled={deleteHostMutation.isPending}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteHostMutation.mutate(isDeletingHost.id)} disabled={deleteHostMutation.isPending}>
                {deleteHostMutation.isPending ? "Deleting..." : "Delete Host"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
