"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, FileUp, LibraryBig, Search, Trash2, UploadCloud, AlertCircle, FileText } from "lucide-react";
import { backendApi } from "@/lib/api";
import { Field } from "@/components/field";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";

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
  const [showHelp, setShowHelp] = useState(false);

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
      toast({ title: "Select a class", description: "Choose the class this textbook belongs to." });
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
      toast({ title: "Upload failed", description: getErrorMessage(error, "Try again"), variant: "error" });
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
        description="Upload and manage markdown textbooks for the content library."
        actions={
          <Button onClick={() => setShowHelp(!showHelp)} variant="outline">
            <FileText className="h-4 w-4" />
            {showHelp ? "Hide" : "Show"} Format
          </Button>
        }
      />

      {showHelp && (
        <AdminPanel title="Markdown Format Requirements" description="Your markdown file must include valid frontmatter at the top.">
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Required frontmatter</p>
                  <p className="mt-1 text-sm text-amber-700">Your markdown file must start with YAML frontmatter containing these fields:</p>
                </div>
              </div>
            </div>
            <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto">
{`---
subject: "Math"
book_title: "Algebra Grade 8"
---`}
            </pre>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">subject</p>
                <p className="mt-1 text-sm font-medium text-gray-900">The subject name (e.g., "Math", "Science")</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">book_title</p>
                <p className="mt-1 text-sm font-medium text-gray-900">The book title (e.g., "Algebra Grade 8")</p>
              </div>
            </div>
          </div>
        </AdminPanel>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total Books" value={books.data?.length || 0} detail="In library" tone="blue" icon={<LibraryBig className="h-5 w-5" />} />
        <MetricCard label="Ingested" value={ingested} detail="Ready for retrieval" tone="green" icon={<UploadCloud className="h-5 w-5" />} />
        <MetricCard label="Active" value={active} detail="Available to teachers" tone="amber" icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <AdminPanel id="upload-book" title="Upload Textbook" description="Select board, class, and upload your markdown file.">
        <form onSubmit={upload} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
          <Field label="Markdown File">
            <Input name="file" type="file" accept=".md,text/markdown,text/plain" required disabled={busy} />
          </Field>
          <Button type="submit" disabled={busy || !classId} className="w-full md:w-auto">
            <UploadCloud className="h-4 w-4" />
            {busy ? "Uploading..." : "Upload Textbook"}
          </Button>
        </form>
      </AdminPanel>

      <AdminPanel
        title="Library Catalog"
        description="Search and browse all textbooks in the library."
        actions={
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:w-72">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              className="h-7 border-0 bg-transparent px-0 shadow-none focus:ring-0"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
        contentClassName="p-0"
      >
        {books.isLoading ? <div className="p-6"><LoadingState label="Loading books" /></div> : null}
        {!books.isLoading && !filteredBooks.length ? (
          <div className="p-6">
            <EmptyState title="No books found" description="Upload a markdown textbook or adjust your search." />
          </div>
        ) : null}
        {filteredBooks.length ? (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    {["Book Title", "Board", "Class", "Subject", "Status", "Index", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBooks.map((book: any) => (
                    <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="max-w-xs truncate font-semibold text-gray-900">{book.title}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{book.board_name || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{book.class_name || "-"}</td>
                      <td className="px-6 py-4"><StatusPill status="neutral">{book.subject || "-"}</StatusPill></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill status={book.is_active ? "success" : "danger"}>{book.is_active ? "active" : "inactive"}</StatusPill>
                          <StatusPill status={book.is_ingested ? "info" : "warning"}>{book.is_ingested ? "ingested" : "pending"}</StatusPill>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-6 py-4 text-gray-600">{book.pinecone_index || "-"}</td>
                      <td className="px-6 py-4"><BookActions book={book} remove={remove} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 xl:hidden">
              {filteredBooks.map((book: any) => (
                <div key={book.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{book.title}</p>
                      <p className="mt-1 truncate text-sm text-gray-500">{book.board_name || "-"} · {book.class_name || "-"} · {book.subject || "-"}</p>
                    </div>
                    <StatusPill status={book.is_ingested ? "info" : "warning"}>{book.is_ingested ? "ingested" : "pending"}</StatusPill>
                  </div>
                  <p className="mt-3 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">{book.pinecone_index || "No index"}</p>
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