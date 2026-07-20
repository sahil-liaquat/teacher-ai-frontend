"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, PlayCircle, Search, ShieldCheck, UserCog, UserRoundCheck, UserRoundX, Users, ChevronLeft, ChevronRight, Send, Trash2 } from "lucide-react";
import { backendApi, type ApiUser } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill, formatDate } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useResendCooldown } from "@/lib/use-resend-cooldown";

const USERS_PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const users = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => backendApi.users((page - 1) * USERS_PAGE_SIZE, USERS_PAGE_SIZE),
    placeholderData: (previous) => previous
  });
  const [statusChange, setStatusChange] = useState<{ user: ApiUser; isActive: boolean } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [grant, setGrant] = useState<{ user: ApiUser; mode: "extend" | "comp" } | null>(null);
  const [grantDays, setGrantDays] = useState(30);
  const client = useQueryClient();
  const { toast } = useToast();
  const grantMutation = useMutation({
    mutationFn: () => grant!.mode === "comp"
      ? backendApi.adminCompUser(grant!.user.id!, grantDays)
      : backendApi.adminExtendUser(grant!.user.id!, grantDays),
    onSuccess: () => {
      toast({ title: grant!.mode === "comp" ? "Comp granted" : "Access extended", description: `${grantDays} days for ${grant!.user.email}`, variant: "success" });
      setGrant(null);
    },
    onError: (e) => toast({ title: "Grant failed", description: getErrorMessage(e, "Try again."), variant: "error" })
  });
  const resendCooldown = useResendCooldown();
  const resendMutation = useMutation({
    mutationFn: (user: ApiUser) => backendApi.adminResendConfirmation(user.id!),
    onSuccess: (res, target) => {
      toast({ title: "Confirmation re-sent", description: res.message, variant: "success" });
      if (target.id) resendCooldown.start(target.id);
    },
    onError: (e) => toast({ title: "Resend failed", description: getErrorMessage(e, "Try again."), variant: "error" })
  });
  const roleMutation = useMutation({
    mutationFn: ({ user, role }: { user: ApiUser; role: "teacher" | "influencer" }) => backendApi.adminChangeUserRole(user.id!, role),
    onSuccess: (res) => {
      toast({ title: "Role updated", description: res.message, variant: "success" });
      client.invalidateQueries({ queryKey: ["admin-users"] });
      client.invalidateQueries({ queryKey: ["admin-influencers"] });
    },
    onError: (e) => toast({ title: "Role update failed", description: getErrorMessage(e, "Try again."), variant: "error" })
  });
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const deleteMutation = useMutation({
    mutationFn: (user: ApiUser) => backendApi.adminDeleteUser(user.id!),
    onSuccess: () => {
      toast({ title: "User deleted", description: `${deleteTarget?.email ?? "User"} was permanently removed.`, variant: "success" });
      setDeleteTarget(null);
      setDeleteConfirmText("");
      client.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast({ title: "Delete failed", description: getErrorMessage(e, "Try again."), variant: "error" })
  });
  const totalPages = users.data?.pages || 1;
  const totalUsers = users.data?.total || 0;
  const activeUsers = users.data?.items?.filter((user) => user.is_active).length || 0;
  const disabledUsers = (users.data?.items?.length || 0) - activeUsers;
  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const items = users.data?.items || [];
    if (!search) return items;
    return items.filter((user) =>
      [user.full_name, user.name, user.email, user.phone, user.role, user.created_at]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [searchTerm, users.data?.items]);

  async function confirmStatusChange() {
    if (!statusChange?.user.id) return;
    setUpdatingStatus(true);
    try {
      await backendApi.updateUser(statusChange.user.id, { is_active: statusChange.isActive });
      toast({ title: statusChange.isActive ? "User activated" : "User deactivated" });
      setStatusChange(null);
      client.invalidateQueries({ queryKey: ["admin-users"] });
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Access management"
        title="Users"
        description="Manage user accounts, roles, and access controls."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Users" value={totalUsers} detail={`${totalPages} pages`} tone="blue" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active Users" value={activeUsers} detail="Can access platform" tone="green" icon={<UserRoundCheck className="h-5 w-5" />} />
        <MetricCard label="Disabled Users" value={disabledUsers} detail="Access paused" tone="rose" icon={<UserRoundX className="h-5 w-5" />} />
      </div>

      <AdminPanel
        title="User Directory"
        description="Search and manage user accounts."
        actions={
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:w-72">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              className="h-7 border-0 bg-transparent px-0 shadow-none focus:ring-0"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
        contentClassName="p-0"
      >
        {users.isLoading ? <div className="p-6"><LoadingState label="Loading users" /></div> : null}
        {!users.isLoading && !filteredUsers.length ? (
          <div className="p-6">
            <EmptyState title="No users found" description="Try another search term or go to a different page." />
          </div>
        ) : null}
        {filteredUsers.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    {["User", "Phone", "Joined", "Funnel", "Actions"].map((heading) => (
                      <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => <UserTableRow key={user.id} user={user} onStatusChange={setStatusChange} onGrant={setGrant} onRoleChange={(u, role) => roleMutation.mutate({ user: u, role })} rolePending={roleMutation.isPending && roleMutation.variables?.user.id === user.id} onResend={(u) => resendMutation.mutate(u)} onDelete={setDeleteTarget} resendSeconds={resendCooldown.secondsLeft(user.id || "")} resendPending={resendMutation.isPending && resendMutation.variables?.id === user.id} />)}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {filteredUsers.map((user) => <UserCard key={user.id} user={user} onStatusChange={setStatusChange} onGrant={setGrant} onRoleChange={(u, role) => roleMutation.mutate({ user: u, role })} rolePending={roleMutation.isPending && roleMutation.variables?.user.id === user.id} onResend={(u) => resendMutation.mutate(u)} onDelete={setDeleteTarget} resendSeconds={resendCooldown.secondsLeft(user.id || "")} resendPending={resendMutation.isPending && resendMutation.variables?.id === user.id} />)}
            </div>
          </>
        ) : null}
        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-gray-600">
            Page {users.data?.page || page} of {totalPages} · {totalUsers} total users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || users.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || users.isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AdminPanel>

      {statusChange ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="change-user-status-title" className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h2 id="change-user-status-title" className="text-lg font-bold text-gray-900">
                  {statusChange.isActive ? "Activate user?" : "Deactivate user?"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {statusChange.isActive
                    ? `${displayName(statusChange.user)} will be able to sign in again.`
                    : `${displayName(statusChange.user)} will no longer be able to sign in. Their records will remain available.`}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStatusChange(null)} disabled={updatingStatus}>Cancel</Button>
              <Button variant={statusChange.isActive ? "default" : "danger"} onClick={confirmStatusChange} disabled={updatingStatus}>
                {updatingStatus ? "Updating..." : statusChange.isActive ? "Activate User" : "Deactivate User"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {grant ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900">{grant.mode === "comp" ? "Comp free access" : "Extend access"}</h2>
            <p className="mt-2 text-sm text-gray-600">{displayName(grant.user)} ({grant.user.email})</p>
            <label className="mt-4 grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Days</span>
              <Input type="number" min={1} value={grantDays} onChange={(e) => setGrantDays(Number(e.target.value))} />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setGrant(null)} disabled={grantMutation.isPending}>Cancel</Button>
              <Button onClick={() => grantMutation.mutate()} disabled={grantMutation.isPending || grantDays < 1}>
                {grantMutation.isPending ? "Granting..." : "Grant"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-user-title" className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <UserRoundX className="h-6 w-6" />
              </span>
              <div>
                <h2 id="delete-user-title" className="text-lg font-bold text-gray-900">Delete user permanently?</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  This permanently removes <span className="font-semibold">{displayName(deleteTarget)}</span> and all of their data from TeachPad and Supabase Auth. This cannot be undone.
                </p>
              </div>
            </div>
            <label className="mt-4 grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Type <span className="font-mono normal-case text-gray-700">{deleteTarget.email}</span> to confirm
              </span>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget.email ?? ""}
                autoFocus
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }} disabled={deleteMutation.isPending}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deleteTarget)}
                disabled={deleteMutation.isPending || deleteConfirmText.trim().toLowerCase() !== (deleteTarget.email ?? "").trim().toLowerCase()}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type UserActionProps = {
  user: ApiUser;
  onStatusChange: (value: { user: ApiUser; isActive: boolean }) => void;
  onGrant: (value: { user: ApiUser; mode: "extend" | "comp" }) => void;
  onRoleChange: (user: ApiUser, role: "teacher" | "influencer") => void;
  rolePending: boolean;
  onResend: (user: ApiUser) => void;
  onDelete: (user: ApiUser) => void;
  resendSeconds: number;
  resendPending: boolean;
};

function UserTableRow({ user, onStatusChange, onGrant, onRoleChange, rolePending, onResend, onDelete, resendSeconds, resendPending }: UserActionProps) {
  return (
    <tr className={cn("hover:bg-gray-50 transition-colors", !user.confirmed ? "bg-amber-50/40" : undefined)}>
      <td className="px-6 py-4">
        <div className="min-w-0">
          <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2 font-semibold text-blue-600 hover:underline">
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", user.is_active ? "bg-emerald-500" : "bg-gray-300")}
              title={user.is_active ? "Active" : "Disabled"}
              aria-label={user.is_active ? "Active" : "Disabled"}
            />
            {displayName(user)}
          </Link>
          <p className="mt-0.5 text-xs text-gray-500">{user.email || "-"}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-700">{user.phone || "—"}</td>
      <td className="px-6 py-4 text-gray-600">{formatDate(user.created_at)}</td>
      <td className="px-6 py-4"><FunnelCell user={user} /></td>
      <td className="px-6 py-4">
        <StatusButtons user={user} onStatusChange={onStatusChange} onGrant={onGrant} onRoleChange={onRoleChange} rolePending={rolePending} onResend={onResend} onDelete={onDelete} resendSeconds={resendSeconds} resendPending={resendPending} />
      </td>
    </tr>
  );
}

function UserCard({ user, onStatusChange, onGrant, onRoleChange, rolePending, onResend, onDelete, resendSeconds, resendPending }: UserActionProps) {
  return (
    <div className={cn("rounded-xl border bg-white p-4", user.confirmed ? "border-gray-200" : "border-amber-200")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/users/${user.id}`} className="block">
            <p className="truncate font-semibold text-blue-600 hover:underline">{displayName(user)}</p>
            <p className="mt-0.5 truncate text-sm text-gray-500">{user.email}</p>
          </Link>
        </div>
        <StatusPill status={user.is_active ? "success" : "danger"}>{user.is_active ? "active" : "disabled"}</StatusPill>
      </div>
      <div className="mt-3"><FunnelCell user={user} /></div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Phone" value={user.phone || "—"} />
        <Info label="Joined" value={formatDate(user.created_at)} />
      </div>
      <div className="mt-4">
        <StatusButtons user={user} onStatusChange={onStatusChange} onGrant={onGrant} onRoleChange={onRoleChange} rolePending={rolePending} onResend={onResend} onDelete={onDelete} resendSeconds={resendSeconds} resendPending={resendPending} />
      </div>
    </div>
  );
}

function StatusButtons({ user, onStatusChange, onGrant, onRoleChange, rolePending, onResend, onDelete, resendSeconds, resendPending }: UserActionProps) {
  const nextRole = user.role === "influencer" ? "teacher" : "influencer";

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!user.is_active} onClick={() => onStatusChange({ user, isActive: false })}>
        <PauseCircle className="h-4 w-4" />
        Deactivate
      </Button>
      <Button size="sm" variant="outline" disabled={user.is_active} onClick={() => onStatusChange({ user, isActive: true })}>
        <PlayCircle className="h-4 w-4" />
        Activate
      </Button>
      <Button size="sm" variant="outline" onClick={() => onGrant({ user, mode: "extend" })}>Extend</Button>
      <Button size="sm" variant="outline" onClick={() => onGrant({ user, mode: "comp" })}>Comp</Button>
      {user.role !== "admin" ? (
        <Button size="sm" variant="outline" disabled={rolePending} onClick={() => onRoleChange(user, nextRole)}>
          <UserCog className="h-4 w-4" />
          {rolePending ? "Updating..." : nextRole === "influencer" ? "Make Influencer" : "Make Teacher"}
        </Button>
      ) : null}
      {!user.confirmed ? (
        <Button size="sm" variant="outline" disabled={resendPending || resendSeconds > 0} onClick={() => onResend(user)}>
          <Send className="h-4 w-4" />
          {resendPending ? "Sending…" : resendSeconds > 0 ? `Resend (${resendSeconds}s)` : "Resend"}
        </Button>
      ) : null}
      {user.role !== "admin" ? (
        <Button size="sm" variant="danger" onClick={() => onDelete(user)}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 truncate font-medium text-gray-900">{value}</p>
    </div>
  );
}

function displayName(user: ApiUser) {
  return user.full_name || user.name || user.email || "Unnamed user";
}

function FunnelCell({ user }: { user: ApiUser }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusPill status={user.confirmed ? "success" : "danger"}>
        {user.confirmed ? "confirmed" : "unconfirmed"}
      </StatusPill>
      <StatusPill status={user.logged_in ? "success" : "neutral"}>
        {user.logged_in ? "logged in" : "never logged in"}
      </StatusPill>
      <StatusPill status={user.has_subscription ? "info" : "danger"}>
        {user.has_subscription ? "has sub" : "no sub"}
      </StatusPill>
    </div>
  );
}
