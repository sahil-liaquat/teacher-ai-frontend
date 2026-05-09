"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, PlayCircle } from "lucide-react";
import { backendApi, type ApiUser } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const USERS_PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
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
    <div>
      <PageHeader title="Users" description="Manage teachers and super admins." />
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr>{["Name", "Email", "Role", "Joined", "Last active", "Status", "Actions"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {users.data?.items?.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-3 py-3 font-medium">{user.full_name || user.name}</td><td className="px-3 py-3">{user.email}</td><td className="px-3 py-3"><Badge>{user.role}</Badge></td><td className="px-3 py-3">{formatUserDate(user.created_at)}</td><td className="px-3 py-3">{formatUserDate(user.updated_at)}</td><td className="px-3 py-3"><Badge>{user.is_active ? "active" : "disabled"}</Badge></td>
                  <td className="px-3 py-3"><div className="flex gap-1"><Button size="icon" variant="ghost" title="Deactivate" aria-label={`Deactivate ${user.full_name || user.email || "user"}`} disabled={!user.is_active} onClick={() => setStatusChange({ user, isActive: false })}><PauseCircle className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Activate" aria-label={`Activate ${user.full_name || user.email || "user"}`} disabled={user.is_active} onClick={() => setStatusChange({ user, isActive: true })}><PlayCircle className="h-4 w-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.isLoading && !users.data?.items?.length ? <p className="p-5 text-sm font-semibold text-muted-foreground">No users found.</p> : null}
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
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
        </CardContent>
      </Card>
      {statusChange ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="change-user-status-title" className="w-full max-w-md rounded-[18px] border border-[#eeeaf7] bg-white p-5 shadow-[0_24px_80px_rgba(39,30,91,0.18)]">
            <h2 id="change-user-status-title" className="text-lg font-black text-slate-950">{statusChange.isActive ? "Activate user?" : "Deactivate user?"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {statusChange.isActive
                ? `${statusChange.user.full_name || statusChange.user.email || "This user"} will be able to sign in again.`
                : `${statusChange.user.full_name || statusChange.user.email || "This user"} will no longer be able to sign in. Their account and generated content will remain in the system.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusChange(null)} disabled={updatingStatus}>Cancel</Button>
              <Button variant={statusChange.isActive ? "default" : "danger"} onClick={confirmStatusChange} disabled={updatingStatus}>
                {updatingStatus ? "Updating..." : statusChange.isActive ? "Activate" : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatUserDate(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "-";
}
