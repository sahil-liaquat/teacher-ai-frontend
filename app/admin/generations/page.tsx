"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminGenerationsPage() {
  const generations = useQuery({ queryKey: ["admin-generations"], queryFn: () => apiFetch<any[]>("/admin/generations") });
  return (
    <div>
      <PageHeader title="All generations" description="Audit generated outputs across users and tools." />
      <Card><CardContent className="overflow-x-auto pt-5"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr>{["User", "Tool", "Board", "Class", "Subject", "Book", "Chapter", "Topic", "Created", "Action"].map((h) => <th className="px-3 py-2" key={h}>{h}</th>)}</tr></thead><tbody>{generations.data?.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-3 py-3">{item.user_id}</td><td className="px-3 py-3"><Badge>{item.type}</Badge></td><td className="px-3 py-3">{item.board}</td><td className="px-3 py-3">{item.class_name}</td><td className="px-3 py-3">{item.subject}</td><td className="px-3 py-3">{item.book_id}</td><td className="px-3 py-3">{item.chapter_id}</td><td className="px-3 py-3">{item.topic || "-"}</td><td className="px-3 py-3">{new Date(item.created_at).toLocaleString()}</td><td className="px-3 py-3"><Link href={`/admin/generations/${item.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></Link></td></tr>)}</tbody></table></CardContent></Card>
    </div>
  );
}
