"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function AdminUsersPage() {
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => apiFetch<any[]>("/admin/users") });
  const client = useQueryClient();
  const { toast } = useToast();
  async function status(id: number, value: string) {
    await apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ status: value }) });
    toast({ title: "User updated" });
    client.invalidateQueries({ queryKey: ["admin-users"] });
  }
  async function remove(id: number) {
    if (!confirm("Delete this user?")) return;
    await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    toast({ title: "User deleted" });
    client.invalidateQueries({ queryKey: ["admin-users"] });
  }
  return (
    <div>
      <PageHeader title="Users" description="Manage teachers and super admins." />
      <Card>
        <CardContent className="overflow-x-auto pt-5">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr>{["Name", "Email", "Role", "Joined", "Last active", "Lesson plans", "Worksheets", "Status", "Actions"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody>
              {users.data?.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-3 py-3 font-medium">{user.name}</td><td className="px-3 py-3">{user.email}</td><td className="px-3 py-3"><Badge>{user.role}</Badge></td><td className="px-3 py-3">{new Date(user.created_at).toLocaleDateString()}</td><td className="px-3 py-3">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "-"}</td><td className="px-3 py-3">{user.lesson_plan_count}</td><td className="px-3 py-3">{user.worksheet_count}</td><td className="px-3 py-3"><Badge>{user.status}</Badge></td>
                  <td className="px-3 py-3"><div className="flex gap-1"><Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => status(user.id, "suspended")}><PauseCircle className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => status(user.id, "active")}><PlayCircle className="h-4 w-4" /></Button><Button size="icon" variant="danger" onClick={() => remove(user.id)}><Trash2 className="h-4 w-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
