"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Layers, Sparkles } from "lucide-react";
import { backendApi, Board, Book, ClassItem } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-5">
      <PageHeader
        title="Textbook Library"
        description="Browse boards, classes, and textbooks."
        actions={
          <Link href="/dashboard/lesson-plans/new">
            <Button><Sparkles className="h-4 w-4" /> Generate from Book</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56 hidden sm:block" />
        </div>
      ) : null}

      {!loading && !data.length ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-12 shadow-[0_14px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-white shadow-md">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No boards found</h3>
          <p className="mt-2 text-sm text-slate-600 max-w-sm">Ask your admin to add boards, classes and textbooks.</p>
          <Link href="/dashboard/lesson-plans/new" className="mt-5">
            <Button><Sparkles className="h-4 w-4" /> Generate Lesson Plan</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {data.map((board) => (
            <div key={board.id} className="premium-hover rounded-[24px] border border-white/70 bg-white/80 p-4 sm:p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-50 text-violet-600 shrink-0">
                    <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-950 truncate max-w-[200px] sm:max-w-none">{board.name}</h2>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">{board.code}</p>
                  </div>
                </div>
                <Badge className={board.is_active === false ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                  {board.is_active === false ? "Inactive" : "Active"}
                </Badge>
              </div>
              <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {board.classes.map((cls) => (
                  <div key={cls.id} className="rounded-[20px] border border-white/70 bg-gradient-to-br from-white to-slate-50 p-3 sm:p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-100 to-sky-50 text-blue-600 shrink-0">
                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{cls.name}</h3>
                        <p className="text-xs text-slate-500">{cls.books.length} {cls.books.length === 1 ? "book" : "books"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {cls.books.length ? cls.books.map((book) => (
                        <div key={book.id} className="rounded-xl border border-slate-100 bg-white p-2.5">
                          <div className="flex items-start gap-2">
                            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs sm:text-sm font-semibold text-slate-900 leading-tight">{book.title}</p>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-blue-700">{book.subject || "General"}</span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${book.is_ingested ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                  {book.is_ingested ? "Ingested" : "Not ingested"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-center">
                          <p className="text-xs font-medium text-slate-400">No books yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {board.classes.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-400">No classes in this board</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}