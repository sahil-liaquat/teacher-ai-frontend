"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, ExternalLink, Loader2, Trash2, X } from "lucide-react";

import { backendApi, type AppNotification, type NotificationInbox } from "@/lib/api";
import { cn } from "@/lib/utils";

const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function NotificationCenter({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => backendApi.notifications(),
    // Keep the header badge fresh soon after an admin publishes an update.
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const markOne = useMutation({
    mutationFn: (id: string) => backendApi.markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData<NotificationInbox>(NOTIFICATIONS_QUERY_KEY, (current) => {
        if (!current) return current;
        const wasUnread = current.items.some((item) => item.id === id && !item.is_read);
        return {
          ...current,
          unread_count: Math.max(0, current.unread_count - (wasUnread ? 1 : 0)),
          items: current.items.map((item) => item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item),
        };
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const markAll = useMutation({
    mutationFn: () => backendApi.markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData<NotificationInbox>(NOTIFICATIONS_QUERY_KEY, (current) => current ? {
        ...current,
        unread_count: 0,
        items: current.items.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() })),
      } : current);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const clearOne = useMutation({
    mutationFn: (id: string) => backendApi.clearNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData<NotificationInbox>(NOTIFICATIONS_QUERY_KEY, (current) => {
        if (!current) return current;
        const removed = current.items.find((item) => item.id === id);
        return {
          ...current,
          unread_count: Math.max(0, current.unread_count - (removed && !removed.is_read ? 1 : 0)),
          items: current.items.filter((item) => item.id !== id),
        };
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const clearAll = useMutation({
    mutationFn: () => backendApi.clearAllNotifications(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.setQueryData<NotificationInbox>(NOTIFICATIONS_QUERY_KEY, (current) => current ? {
        ...current,
        unread_count: 0,
        items: [],
      } : current);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const unreadCount = inbox.data?.unread_count ?? 0;

  function read(item: AppNotification) {
    if (!item.is_read && !markOne.isPending) markOne.mutate(item.id);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative grid place-items-center text-[#0B73FF] transition hover:-translate-y-0.5 hover:text-blue-700",
          mobile ? "h-10 w-10 rounded-full bg-transparent" : "h-11 w-11 rounded-full bg-transparent",
        )}
      >
        <Bell className="h-[23px] w-[23px] fill-none" strokeWidth={2.8} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label="Notifications panel"
          className={cn(
            "absolute right-0 top-[calc(100%+10px)] z-50 w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.20)]",
            mobile && "fixed right-3 top-[58px]",
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-3.5">
            <div>
              <h2 className="text-sm font-black text-slate-900">Notifications</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={markAll.isPending}
                  onClick={() => markAll.mutate()}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark read
                </button>
              )}
              {!!inbox.data?.items.length && (
                <button
                  type="button"
                  disabled={clearAll.isPending}
                  onClick={() => clearAll.mutate()}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear all
                </button>
              )}
            </div>
          </header>

          <div className="max-h-[min(520px,calc(100vh-100px))] overflow-y-auto">
            {inbox.isLoading && (
              <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications
              </div>
            )}
            {inbox.isError && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-bold text-slate-700">Couldn&apos;t load notifications</p>
                <button type="button" onClick={() => inbox.refetch()} className="mt-2 text-xs font-bold text-blue-600">Try again</button>
              </div>
            )}
            {!inbox.isLoading && !inbox.isError && !inbox.data?.items.length && (
              <div className="px-5 py-12 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Bell className="h-5 w-5" /></span>
                <p className="mt-3 text-sm font-bold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-xs font-medium text-slate-500">New updates from TeachPad will appear here.</p>
              </div>
            )}
            {inbox.data?.items.map((item) => (
              <article
                key={item.id}
                onClick={() => read(item)}
                className={cn(
                  "relative border-b border-slate-100 px-4 py-3.5 last:border-0",
                  item.is_read ? "bg-white" : "bg-blue-50/45",
                )}
              >
                {!item.is_read && <span className={cn("absolute left-1.5 top-5 h-2 w-2 rounded-full", severityDot(item.severity))} />}
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl", severityTone(item.severity))}>
                    {item.is_read ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={cn("text-sm text-slate-900", item.is_read ? "font-bold" : "font-black")}>{item.title}</h3>
                      <div className="flex shrink-0 items-center gap-1">
                        <time className="text-[10px] font-semibold text-slate-400" dateTime={item.created_at}>{relativeTime(item.created_at)}</time>
                        <button
                          type="button"
                          aria-label={`Clear ${item.title}`}
                          disabled={clearOne.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            clearOne.mutate(item.id);
                          }}
                          className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs font-medium leading-relaxed text-slate-600">{item.message}</p>
                    {item.action_url && item.action_label && (
                      <a
                        href={item.action_url}
                        target={item.action_url.startsWith("https://") ? "_blank" : undefined}
                        rel={item.action_url.startsWith("https://") ? "noreferrer" : undefined}
                        onClick={(event) => {
                          event.stopPropagation();
                          read(item);
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-700"
                      >
                        {item.action_label} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function severityTone(severity: AppNotification["severity"]) {
  return {
    info: "bg-blue-100 text-blue-600",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-700",
    urgent: "bg-rose-100 text-rose-600",
  }[severity];
}

function severityDot(severity: AppNotification["severity"]) {
  return { info: "bg-blue-500", success: "bg-emerald-500", warning: "bg-amber-500", urgent: "bg-rose-500" }[severity];
}

function relativeTime(value: string) {
  const milliseconds = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
