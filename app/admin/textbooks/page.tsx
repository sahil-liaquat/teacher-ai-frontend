"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Trash2, Upload } from "lucide-react";
import { backendApi } from "@/lib/api";
import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

export default function AdminTextbooksPage() {
  const books = useQuery({ queryKey: ["admin-books"], queryFn: loadBookLibrary });
  const boards = useQuery({ queryKey: ["admin-upload-boards"], queryFn: () => backendApi.boards(0, 100) });
  const [boardId, setBoardId] = useState("");
  const classes = useQuery({
    queryKey: ["admin-upload-classes", boardId],
    queryFn: () => backendApi.classesByBoard(boardId, 0, 100),
    enabled: Boolean(boardId)
  });
  const [classId, setClassId] = useState("");
  const client = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const firstBoard = boards.data?.items?.[0]?.id || "";
    if (!boardId && firstBoard) setBoardId(firstBoard);
  }, [boardId, boards.data?.items]);

  useEffect(() => {
    const firstClass = classes.data?.items?.[0]?.id || "";
    if (firstClass && !classes.data?.items?.some((item: any) => item.id === classId)) {
      setClassId(firstClass);
    }
  }, [classId, classes.data?.items]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classId) {
      toast({ title: "Select a class", description: "Choose the class this markdown textbook belongs to." });
      return;
    }
    setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await backendApi.uploadBook(classId, form);
      formElement.reset();
      toast({ title: "Markdown book uploaded", description: "The book was parsed and indexed." });
      client.invalidateQueries({ queryKey: ["admin-books"] });
    } catch (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this textbook?")) return;
    await backendApi.deleteBook(id);
    client.invalidateQueries({ queryKey: ["admin-books"] });
  }
  return (
    <div>
      <PageHeader title="Textbook management" description="Upload markdown books, inspect indexing status, and manage library books." />
      <Card className="mb-4">
        <CardHeader><CardTitle>Upload Markdown Book</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={upload} className="grid gap-3 md:grid-cols-[1fr_1fr_1.5fr_auto] md:items-end">
            <Field label="Board">
              <Select value={boardId} onChange={(event) => { setBoardId(event.target.value); setClassId(""); }} disabled={boards.isLoading || busy}>
                {(boards.data?.items || []).map((board: any) => <option key={board.id} value={board.id}>{board.name || board.code}</option>)}
              </Select>
            </Field>
            <Field label="Class">
              <Select value={classId} onChange={(event) => setClassId(event.target.value)} disabled={!boardId || classes.isLoading || busy}>
                {(classes.data?.items || []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="Markdown file">
              <Input name="file" type="file" accept=".md,text/markdown,text/plain" required disabled={busy} />
            </Field>
            <Button type="submit" disabled={busy || !classId}>
              <Upload className="h-4 w-4" />
              {busy ? "Uploading..." : "Upload and index"}
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            The markdown file must include frontmatter with <code>subject</code> and <code>book_title</code>.
          </p>
        </CardContent>
      </Card>
      <Card><CardContent className="overflow-x-auto pt-5"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr>{["Book", "Board", "Class", "Subject", "Active", "Ingested", "Index", "Actions"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{books.data?.map((book) => <tr key={book.id} className="border-t border-border"><td className="px-3 py-3 font-medium">{book.title}</td><td className="px-3 py-3">{book.board_name}</td><td className="px-3 py-3">{book.class_name}</td><td className="px-3 py-3">{book.subject}</td><td className="px-3 py-3"><Badge>{book.is_active ? "active" : "inactive"}</Badge></td><td className="px-3 py-3"><Badge>{book.is_ingested ? "ingested" : "not ingested"}</Badge></td><td className="px-3 py-3">{book.pinecone_index || "-"}</td><td className="px-3 py-3"><div className="flex gap-1"><Link href={`/admin/textbooks/${book.id}`}><Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button></Link><Button size="icon" variant="danger" onClick={() => remove(book.id)}><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table>{!books.isLoading && !books.data?.length ? <p className="p-5 text-sm font-semibold text-muted-foreground">No books found in the backend library.</p> : null}</CardContent></Card>
    </div>
  );
}

async function loadBookLibrary() {
  const boards = await backendApi.boards(0, 100);
  const rows: any[] = [];
  for (const board of boards.items) {
    const classes = await backendApi.classesByBoard(board.id, 0, 100).catch(() => ({ items: [] as any[] }));
    for (const cls of classes.items) {
      const books = await backendApi.booksByClass(cls.id, 0, 100).catch(() => ({ items: [] as any[] }));
      rows.push(...books.items.map((book: any) => ({
        ...book,
        board_name: board.name || board.code,
        class_name: cls.name,
      })));
    }
  }
  return rows;
}
