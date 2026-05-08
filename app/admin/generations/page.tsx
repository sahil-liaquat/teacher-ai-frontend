"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { backendApi } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminGenerationsPage() {
  const generations = useQuery({ queryKey: ["admin-generations"], queryFn: () => backendApi.lessonPlans(0, 100) });
  return (
    <div>
      <PageHeader title="Lesson plan generations" description="The live backend exposes saved lesson plans for the current user." />
      <Card><CardContent className="overflow-x-auto pt-5"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr>{["User", "Tool", "Class", "Subject", "Chapter", "Topic", "Created", "Action"].map((h) => <th className="px-3 py-2" key={h}>{h}</th>)}</tr></thead><tbody>{generations.data?.items?.map((item) => <tr key={item.id} className="border-t border-border"><td className="px-3 py-3">{item.user_id}</td><td className="px-3 py-3"><Badge>Lesson Plan</Badge></td><td className="px-3 py-3">{item.class_name}</td><td className="px-3 py-3">{item.subject}</td><td className="px-3 py-3">{item.chapter_name}</td><td className="px-3 py-3">{item.topic || "-"}</td><td className="px-3 py-3">{item.created_at ? new Date(item.created_at).toLocaleString() : "-"}</td><td className="px-3 py-3"><Link href={`/admin/generations/${item.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></Link></td></tr>)}</tbody></table>{!generations.isLoading && !generations.data?.items?.length ? <p className="p-5 text-sm font-semibold text-muted-foreground">No lesson plan generations found.</p> : null}</CardContent></Card>
    </div>
  );
}
