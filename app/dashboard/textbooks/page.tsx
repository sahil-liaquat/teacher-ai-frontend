"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Layers, Sparkles } from "lucide-react";
import { backendApi, Board, Book, ClassItem } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type BoardWithData = Board & { classes: Array<ClassItem & { books: Book[] }> };

export default function TeacherTextbooksPage() {
  const { toast } = useToast();
  const [data, setData] = useState<BoardWithData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const boards = await backendApi.boards(0, 50);
        const withClasses = await Promise.all(boards.items.map(async (board) => {
          const classes = await backendApi.classesByBoard(board.id, 0, 50).catch(() => ({ items: [] as ClassItem[] }));
          const classWithBooks = await Promise.all(classes.items.map(async (cls) => {
            const books = await backendApi.booksByClass(cls.id, 0, 50).catch(() => ({ items: [] as Book[] }));
            return { ...cls, books: books.items };
          }));
          return { ...board, classes: classWithBooks };
        }));
        if (!cancelled) setData(withClasses);
      } catch (err) {
        toast({ title: "Could not load textbooks", description: err instanceof Error ? err.message : "Try again" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [toast]);

  return (
    <div className="space-y-6">
      <PageHeader title="Textbook library" description="Boards, classes and books available from your existing backend endpoints." actions={<Link href="/dashboard/lesson-plans/new"><Button><Sparkles className="h-4 w-4" /> Generate from Book</Button></Link>} />
      {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div> : null}
      <div className="grid gap-6">
        {data.map((board) => (
          <Card key={board.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f3edff] text-primary"><Layers className="h-6 w-6" /></div><div><h2 className="text-2xl font-black text-[#071343]">{board.name}</h2><p className="text-sm font-semibold text-[#52617d]">{board.code}</p></div></div>
                <Badge className={board.is_active === false ? "bg-red-50 text-red-700" : "bg-[#eafff3] text-emerald-700"}>{board.is_active === false ? "Inactive" : "Active"}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {board.classes.map((cls) => (
                  <div key={cls.id} className="rounded-2xl border border-[#e4e8f3] bg-[#fbfcff] p-4">
                    <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf5ff] text-[#1684f6]"><GraduationCap className="h-5 w-5" /></div><div><h3 className="font-black text-[#071343]">{cls.name}</h3><p className="text-xs font-semibold text-[#66728f]">{cls.books.length} books</p></div></div>
                    <div className="grid gap-3">
                      {cls.books.length ? cls.books.map((book) => (
                        <div key={book.id} className="rounded-xl border border-[#edf0f7] bg-white p-3">
                          <div className="flex items-start gap-3"><BookOpen className="mt-1 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="truncate font-bold text-[#081436]">{book.title}</p><div className="mt-2 flex flex-wrap gap-2"><Badge>{book.subject}</Badge><Badge className={book.is_ingested ? "bg-[#eafff3] text-emerald-700" : "bg-[#fff7e8] text-orange-700"}>{book.is_ingested ? "Ingested" : "Not ingested"}</Badge></div></div></div>
                        </div>
                      )) : <p className="rounded-xl border border-dashed border-[#dfe6f5] bg-white p-4 text-sm font-semibold text-[#66728f]">No books in this class yet.</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && !data.length ? <Card><CardContent className="p-8 text-center"><BookOpen className="mx-auto h-10 w-10 text-primary" /><h3 className="mt-4 text-lg font-black text-[#071343]">No boards found</h3><p className="mt-2 text-sm text-[#52617d]">Ask admin to add boards, classes and books.</p></CardContent></Card> : null}
      </div>
    </div>
  );
}
