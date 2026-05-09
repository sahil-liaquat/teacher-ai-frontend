"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, PlayCircle, Search, ShieldCheck, UserRoundCheck, UserRoundX, Users } from "lucide-react";
import { backendApi, type ApiUser } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill, formatDate } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

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
  const client = useQueryClient();
  const { toast } = useToast();
  const totalPages = users.data?.pages || 1;
  const totalUsers = users.data?.total || 0;
  const activeUsers = users.data?.items?.filter((user) => user.is_active).length || 0;
  const disabledUsers = (users.data?.items?.length || 0) - activeUsers;
  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const items = users.data?.items || [];
    if (!search) return items;
    return items.filter((user) =>
      [user.full_name, user.name, user.email, user.role, user.created_at]
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
        description="Review account status, roles, and access controls for teachers and administrators."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Total users" value={totalUsers} detail="Across all pages" tone="blue" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active on page" value={activeUsers} detail="Can access the platform" tone="green" icon={<UserRoundCheck className="h-5 w-5" />} />
        <MetricCard label="Disabled on page" value={disabledUsers} detail="Access is paused" tone="rose" icon={<UserRoundX className="h-5 w-5" />} />
      </div>

      <AdminPanel
        title="User directory"
        description="Search within this page and update account status."
        actions={
          <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:w-80">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0"
              placeholder="Search users"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
        contentClassName="p-0"
      >
        {users.isLoading ? <div className="p-5"><LoadingState label="Loading users" /></div> : null}
        {!users.isLoading && !filteredUsers.length ? (
          <div className="p-5">
            <EmptyState title="No users found" description="Try another search term or move to a different page." />
          </div>
        ) : null}
        {filteredUsers.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>{["User", "Role", "Joined", "Updated", "Status", "Actions"].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => <UserTableRow key={user.id} user={user} onStatusChange={setStatusChange} />)}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {filteredUsers.map((user) => <UserCard key={user.id} user={user} onStatusChange={setStatusChange} />)}
            </div>
          </>
        ) : null}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">
            Page {users.data?.page || page} of {totalPages} · {totalUsers} users
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || users.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || users.isFetching} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
            </Button>
          </div>
        </div>
      </AdminPanel>

      {statusChange ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="change-user-status-title" className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 id="change-user-status-title" className="text-lg font-black text-slate-950">{statusChange.isActive ? "Activate user?" : "Deactivate user?"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {statusChange.isActive
                    ? `${displayName(statusChange.user)} will be able to sign in again.`
                    : `${displayName(statusChange.user)} will no longer be able to sign in. Their records stay available.`}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusChange(null)} disabled={updatingStatus}>Cancel</Button>
              <Button variant={statusChange.isActive ? "default" : "danger"} onClick={confirmStatusChange} disabled={updatingStatus}>
                {updatingStatus ? "Updating..." : statusChange.isActive ? "Activate" : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserTableRow({ user, onStatusChange }: { user: ApiUser; onStatusChange: (value: { user: ApiUser; isActive: boolean }) => void }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="min-w-0">
          <p className="font-black text-slate-950">{displayName(user)}</p>
          <p className="mt-1 text-xs text-slate-500">{user.email || "-"}</p>
        </div>
      </td>
      <td className="px-5 py-4"><StatusPill status={user.role === "admin" ? "info" : "neutral"}>{user.role || "teacher"}</StatusPill></td>
      <td className="px-5 py-4 text-slate-600">{formatDate(user.created_at)}</td>
      <td className="px-5 py-4 text-slate-600">{formatDate(user.updated_at)}</td>
      <td className="px-5 py-4"><StatusPill status={user.is_active ? "success" : "danger"}>{user.is_active ? "active" : "disabled"}</StatusPill></td>
      <td className="px-5 py-4">
        <StatusButtons user={user} onStatusChange={onStatusChange} />
      </td>
    </tr>
  );
}

function UserCard({ user, onStatusChange }: { user: ApiUser; onStatusChange: (value: { user: ApiUser; isActive: boolean }) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-slate-950">{displayName(user)}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
        </div>
        <StatusPill status={user.is_active ? "success" : "danger"}>{user.is_active ? "active" : "disabled"}</StatusPill>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Role" value={user.role || "teacher"} />
        <Info label="Joined" value={formatDate(user.created_at)} />
      </div>
      <div className="mt-4">
        <StatusButtons user={user} onStatusChange={onStatusChange} />
      </div>
    </div>
  );
}

function StatusButtons({ user, onStatusChange }: { user: ApiUser; onStatusChange: (value: { user: ApiUser; isActive: boolean }) => void }) {
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
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate font-bold text-slate-800">{value}</p>
    </div>
  );
}

function displayName(user: ApiUser) {
  return user.full_name || user.name || user.email || "Unnamed user";
}
