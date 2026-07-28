"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ExternalLink, Send, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { backendApi, type AppNotification, type NotificationCreatePayload, type NotificationSeverity } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

const EMPTY_FORM: NotificationCreatePayload = {
  title: "",
  message: "",
  severity: "info",
  action_label: null,
  action_url: null,
  expires_at: null,
};

export default function AdminNotificationsPage() {
  const [form, setForm] = useState<NotificationCreatePayload>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const notifications = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => backendApi.adminNotifications(),
  });

  const publish = useMutation({
    mutationFn: () => backendApi.adminPublishNotification(form),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      toast({ title: "Notification sent", description: "It is now visible to every user.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast({ title: "Could not send notification", description: getErrorMessage(error, "Check the form and try again."), variant: "error" }),
  });

  const toggle = useMutation({
    mutationFn: (item: AppNotification) => backendApi.adminSetNotificationActive(item.id, !item.is_active),
    onSuccess: (item) => {
      toast({ title: item.is_active ? "Notification enabled" : "Notification disabled", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast({ title: "Could not update notification", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  const remove = useMutation({
    mutationFn: (item: AppNotification) => backendApi.adminDeleteNotification(item.id),
    onSuccess: () => {
      setDeleteTarget(null);
      toast({ title: "Notification deleted", description: "It has been removed for every user.", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => toast({ title: "Could not delete notification", description: getErrorMessage(error, "Try again."), variant: "error" }),
  });

  const actionIsPartial = Boolean(form.action_label) !== Boolean(form.action_url);
  const canPublish = form.title.trim().length >= 2 && form.message.trim().length >= 2 && !actionIsPartial;

  return (
    <>
      <AdminPageHeader
        eyebrow="Communication"
        title="Notifications"
        description="Send an announcement to every TeachPad user. New announcements appear immediately in the notification bell and remain unread until each user opens them."
      />

      <AdminPanel title="Send a notification" description="Use an optional action link when you want users to open a specific page.">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Field label="Title">
            <Input
              maxLength={160}
              value={form.title}
              placeholder="New feature available"
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
          </Field>
          <Field label="Type">
            <select
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium"
              value={form.severity}
              onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value as NotificationSeverity }))}
            >
              <option value="info">Information</option>
              <option value="success">Success / launch</option>
              <option value="warning">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Message">
            <Textarea
              rows={5}
              maxLength={5000}
              value={form.message}
              placeholder="Tell users what changed and what they need to know."
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Action button (optional)">
            <Input
              maxLength={60}
              value={form.action_label ?? ""}
              placeholder="Open Workspace"
              onChange={(event) => setForm((current) => ({ ...current, action_label: event.target.value || null }))}
            />
          </Field>
          <Field label="Action link (optional)">
            <Input
              maxLength={500}
              value={form.action_url ?? ""}
              placeholder="/dashboard/my-workspace"
              onChange={(event) => setForm((current) => ({ ...current, action_url: event.target.value || null }))}
            />
          </Field>
          <Field label="Expires at (optional)">
            <Input
              type="datetime-local"
              value={form.expires_at ? toLocalDateTime(form.expires_at) : ""}
              onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value ? new Date(event.target.value).toISOString() : null }))}
            />
          </Field>
        </div>
        {actionIsPartial && <p className="mt-2 text-xs font-semibold text-amber-700">Add both an action button label and an action link, or leave both empty.</p>}
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={() => publish.mutate()} disabled={!canPublish || publish.isPending}>
            <Send className="h-4 w-4" /> {publish.isPending ? "Sending..." : "Send to everyone"}
          </Button>
          <p className="text-xs font-medium text-slate-500">Delivery is in-app and usually appears within 30 seconds.</p>
        </div>
      </AdminPanel>

      <AdminPanel title="Sent notifications" description="Disable an announcement temporarily, or delete it permanently for everyone." contentClassName="p-0">
        {notifications.isLoading && <div className="p-6"><LoadingState label="Loading notifications" /></div>}
        {notifications.isError && (
          <div className="p-6"><EmptyState title="Could not load notifications" description="Refresh the page to try again." /></div>
        )}
        {!notifications.isLoading && !notifications.isError && !notifications.data?.length && (
          <div className="p-6"><EmptyState title="No notifications sent yet" description="Your first announcement will appear here." /></div>
        )}
        <div className="divide-y divide-slate-100">
          {notifications.data?.map((item) => (
            <article key={item.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><BellRing className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                    <StatusPill status={statusTone(item.severity)}>{item.severity}</StatusPill>
                    <StatusPill status={item.is_active ? "success" : "neutral"}>{item.is_active ? "active" : "disabled"}</StatusPill>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-600">{item.message}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-400">
                    <span>Sent {formatDateTime(item.created_at)}</span>
                    {item.expires_at && <span>Expires {formatDateTime(item.expires_at)}</span>}
                    {item.action_url && <a href={item.action_url} className="inline-flex items-center gap-1 text-blue-600 hover:underline">{item.action_label}<ExternalLink className="h-3 w-3" /></a>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(item)}>
                  {item.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {item.is_active ? "Disable" : "Enable"}
                </Button>
                <Button size="sm" variant="outline" disabled={remove.isPending} onClick={() => setDeleteTarget(item)} className="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      </AdminPanel>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onMouseDown={() => setDeleteTarget(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-notification-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="delete-notification-title" className="text-lg font-black text-slate-900">Delete notification?</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
              “{deleteTarget.title}” will be permanently removed from every user’s notification list. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={remove.isPending}>Cancel</Button>
              <Button variant="danger" onClick={() => remove.mutate(deleteTarget)} disabled={remove.isPending}>
                <Trash2 className="h-4 w-4" /> {remove.isPending ? "Deleting..." : "Delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>{children}</label>;
}

function statusTone(severity: NotificationSeverity): "info" | "success" | "warning" | "danger" {
  return { info: "info", success: "success", warning: "warning", urgent: "danger" }[severity] as "info" | "success" | "warning" | "danger";
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
