"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, RefreshCw, Trash2, Upload } from "lucide-react";
import { API_BASE, apiFetch, getToken } from "@/lib/api";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function AdminTextbooksPage() {
  const books = useQuery({ queryKey: ["admin-books"], queryFn: () => apiFetch<any[]>("/admin/books") });
  const client = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch(`${API_BASE}/admin/books/upload`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: form });
      if (!res.ok) throw new Error("Upload failed");
      toast({ title: "Book uploaded", description: "Indexing completed for local demo." });
      client.invalidateQueries({ queryKey: ["admin-books"] });
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setBusy(false);
    }
  }
  async function reindex(id: number) {
    await apiFetch(`/admin/books/${id}/index`, { method: "POST" });
    toast({ title: "Re-indexed" });
    client.invalidateQueries({ queryKey: ["admin-books"] });
  }
  async function remove(id: number) {
    if (!confirm("Delete this textbook?")) return;
    await apiFetch(`/admin/books/${id}`, { method: "DELETE" });
    client.invalidateQueries({ queryKey: ["admin-books"] });
  }
  return (
    <div>
      <PageHeader title="Textbook management" description="Upload PDFs, inspect indexing status, and manage library books." />
      <Card className="mb-4">
        <CardHeader><CardTitle>Upload PDF</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={upload} className="grid gap-3 md:grid-cols-5">
            <Field label="Board"><Input name="board" defaultValue="CBSE" /></Field>
            <Field label="Class"><Input name="class_name" defaultValue="8" /></Field>
            <Field label="Subject"><Input name="subject" defaultValue="Science" /></Field>
            <Field label="Book name"><Input name="title" defaultValue="Science Textbook" /></Field>
            <Field label="File"><Input name="file" type="file" accept="application/pdf" required /></Field>
            <Button className="md:col-span-5" type="submit" disabled={busy}><Upload className="h-4 w-4" />{busy ? "Uploading..." : "Upload and index"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card><CardContent className="overflow-x-auto pt-5"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr>{["Book", "Board", "Class", "Subject", "Status", "Chapters", "Indexing", "Actions"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{books.data?.map((book) => <tr key={book.id} className="border-t border-border"><td className="px-3 py-3 font-medium">{book.title}</td><td className="px-3 py-3">{book.board}</td><td className="px-3 py-3">{book.class_name}</td><td className="px-3 py-3">{book.subject}</td><td className="px-3 py-3"><Badge>{book.status}</Badge></td><td className="px-3 py-3">{book.chapter_count}</td><td className="px-3 py-3">{book.error_message || "ok"}</td><td className="px-3 py-3"><div className="flex gap-1"><Link href={`/admin/textbooks/${book.id}`}><Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button></Link><Button size="icon" variant="ghost" onClick={() => reindex(book.id)}><RefreshCw className="h-4 w-4" /></Button><Button size="icon" variant="danger" onClick={() => remove(book.id)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></CardContent></Card>
    </div>
  );
}
