"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, FileUp, LibraryBig, Search, Trash2, UploadCloud } from "lucide-react";
import { backendApi } from "@/lib/api";
import { Field } from "@/components/field";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredBooks = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const items = books.data || [];
    if (!search) return items;
    return items.filter((book: any) =>
      [book.title, book.board_name, book.class_name, book.subject, book.pinecone_index]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [books.data, searchTerm]);
  const ingested = (books.data || []).filter((book: any) => book.is_ingested).length;
  const active = (books.data || []).filter((book: any) => book.is_active).length;

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
      toast({ title: "Book uploaded", description: "The textbook was parsed and queued for indexing." });
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
    toast({ title: "Book deleted" });
    client.invalidateQueries({ queryKey: ["admin-books"] });
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Content library"
        title="Textbooks"
        description="Upload markdown textbooks, confirm indexing state, and inspect the books available to teacher workflows."
        actions={
          <a href="#upload-book">
            <Button>
              <FileUp className="h-4 w-4" />
              Upload markdown
            </Button>
          </a>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Books" value={books.data?.length || 0} detail="Visible in library" tone="blue" icon={<LibraryBig className="h-5 w-5" />} />
        <MetricCard label="Ingested" value={ingested} detail="Ready for retrieval" tone="green" icon={<UploadCloud className="h-5 w-5" />} />
        <MetricCard label="Active" value={active} detail="Available to teachers" tone="amber" icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <AdminPanel id="upload-book" title="Upload markdown book" description="Choose the owning board and class before uploading the source file.">
        <form onSubmit={upload} className="grid gap-3 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
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
            <UploadCloud className="h-4 w-4" />
            {busy ? "Uploading" : "Upload"}
          </Button>
        </form>
      </AdminPanel>

      <AdminPanel
        title="Library catalog"
        description="Search by title, class, subject, board, or index name."
        actions={
          <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:w-80">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0"
              placeholder="Search books"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
        contentClassName="p-0"
      >
        {books.isLoading ? <div className="p-5"><LoadingState label="Loading books" /></div> : null}
        {!books.isLoading && !filteredBooks.length ? <div className="p-5"><EmptyState title="No books found" description="Upload a markdown textbook or adjust your search." /></div> : null}
        {filteredBooks.length ? (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>{["Book", "Board", "Class", "Subject", "Status", "Index", "Actions"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBooks.map((book: any) => (
                    <tr key={book.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="max-w-[360px] truncate font-black text-slate-950">{book.title}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{book.board_name || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{book.class_name || "-"}</td>
                      <td className="px-5 py-4"><StatusPill status="neutral">{book.subject || "-"}</StatusPill></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill status={book.is_active ? "success" : "danger"}>{book.is_active ? "active" : "inactive"}</StatusPill>
                          <StatusPill status={book.is_ingested ? "info" : "warning"}>{book.is_ingested ? "ingested" : "pending"}</StatusPill>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-4 text-slate-600">{book.pinecone_index || "-"}</td>
                      <td className="px-5 py-4"><BookActions book={book} remove={remove} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 xl:hidden">
              {filteredBooks.map((book: any) => (
                <div key={book.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{book.title}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{book.board_name || "-"} · {book.class_name || "-"} · {book.subject || "-"}</p>
                    </div>
                    <StatusPill status={book.is_ingested ? "info" : "warning"}>{book.is_ingested ? "ingested" : "pending"}</StatusPill>
                  </div>
                  <p className="mt-3 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">{book.pinecone_index || "No index name"}</p>
                  <div className="mt-4"><BookActions book={book} remove={remove} /></div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </AdminPanel>
    </>
  );
}

function BookActions({ book, remove }: { book: any; remove: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/textbooks/${book.id}`}>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4" />
          View
        </Button>
      </Link>
      <Button size="sm" variant="danger" onClick={() => remove(book.id)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}

async function loadBookLibrary() {
  const boards = await backendApi.boards(0, 100);
  const classesByBoard = await Promise.all(
    boards.items.map((board) =>
      backendApi.classesByBoard(board.id, 0, 100)
        .then((classes) => ({ board, classes: classes.items }))
        .catch(() => ({ board, classes: [] as any[] }))
    )
  );
  const classRows = classesByBoard.flatMap(({ board, classes }) =>
    classes.map((cls: any) => ({ board, cls }))
  );
  const booksByClass = await Promise.all(
    classRows.map(({ board, cls }) =>
      backendApi.booksByClass(cls.id, 0, 100)
        .then((books) =>
          books.items.map((book: any) => ({
            ...book,
            board_name: board.name || board.code,
            class_name: cls.name
          }))
        )
        .catch(() => [])
    )
  );
  return booksByClass.flat();
}
