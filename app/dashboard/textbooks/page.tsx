"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Sparkles, XCircle, Search, X } from "lucide-react";
import { backendApi, Board, Book, ClassItem } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { PastelIconTile } from "@/components/pastel-icon-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const statTiles = [
  { label: "Boards", key: "boards", icon: "layers", tone: "bg-[#e9e1ff]" },
  { label: "Classes", key: "classes", icon: "graduationCap", tone: "bg-[#dffafa]" },
  { label: "Books", key: "books", icon: "bookOpen", tone: "bg-[#fff0bf]" }
] as const;

export default function TeacherTextbooksPage() {
  const { toast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState({ classes: 0, books: 0, loading: false });
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingBoards(true);
    backendApi.boards(0, 100)
      .then((res) => {
        if (!cancelled) setBoards(res.items.filter((board) => board.is_active !== false));
      })
      .catch((err) => {
        if (!cancelled) toast({ title: "Could not load boards", description: getErrorMessage(err, "Try again"), variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoadingBoards(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    if (loadingBoards) return;
    if (!boards.length) {
      setSummary({ classes: 0, books: 0, loading: false });
      return;
    }
    let cancelled = false;
    setSummary((current) => ({ ...current, loading: true }));

    async function loadSummary() {
      try {
        const classResponses = await Promise.all(boards.map((board) => backendApi.classesByBoard(board.id, 0, 100)));
        const allClasses = classResponses.flatMap((response) => response.items).filter((item) => item.is_active !== false);
        const bookResponses = await Promise.all(allClasses.map((classItem) => backendApi.booksByClass(classItem.id, 0, 100)));
        const allBooks = bookResponses.flatMap((response) => response.items).filter((book) => book.is_active !== false);
        if (!cancelled) {
          setSummary({
            classes: allClasses.length,
            books: allBooks.length,
            loading: false
          });
        }
      } catch (err) {
        if (!cancelled) {
          setSummary({ classes: 0, books: 0, loading: false });
          toast({ title: "Could not load textbook summary", description: getErrorMessage(err, "Try again"), variant: "error" });
        }
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [boards, loadingBoards, toast]);

  useEffect(() => {
    if (!selectedBoardId) {
      setClasses([]);
      setBooks([]);
      setLoadingClasses(false);
      return;
    }
    let cancelled = false;
    setClasses([]);
    setBooks([]);
    setSelectedClassId(null);
    setLoadingClasses(true);
    backendApi.classesByBoard(selectedBoardId, 0, 100)
      .then((res) => {
        if (!cancelled) setClasses(res.items.filter((item) => item.is_active !== false));
      })
      .catch((err) => {
        if (!cancelled) toast({ title: "Could not load classes", description: getErrorMessage(err, "Try again"), variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoadingClasses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBoardId, toast]);

  useEffect(() => {
    if (!selectedClassId) {
      setBooks([]);
      setLoadingBooks(false);
      return;
    }
    let cancelled = false;
    setBooks([]);
    setLoadingBooks(true);
    backendApi.booksByClass(selectedClassId, 0, 100)
      .then((res) => {
        if (!cancelled) setBooks(res.items.filter((book) => book.is_active !== false));
      })
      .catch((err) => {
        if (!cancelled) toast({ title: "Could not load textbooks", description: getErrorMessage(err, "Try again"), variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoadingBooks(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, toast]);

  const selectedBoard = useMemo(() => boards.find((board) => board.id === selectedBoardId) || null, [boards, selectedBoardId]);
  const selectedClass = useMemo(() => classes.find((classItem) => classItem.id === selectedClassId) || null, [classes, selectedClassId]);

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        board.name.toLowerCase().includes(query) ||
        (board.code && board.code.toLowerCase().includes(query))
      );
    });
  }, [boards, searchQuery]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return cls.name.toLowerCase().includes(query);
    });
  }, [classes, searchQuery]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        book.title.toLowerCase().includes(query) ||
        (book.subject && book.subject.toLowerCase().includes(query))
      );
    });
  }, [books, searchQuery]);

  const subjectGroups = useMemo(() => {
    const groups = filteredBooks.reduce<Record<string, Book[]>>((collection, book) => {
      const subject = book.subject || "General";
      collection[subject] = [...(collection[subject] || []), book];
      return collection;
    }, {});

    return Object.entries(groups)
      .map(([subject, items]) => ({ subject, books: items }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [filteredBooks]);

  const goToBoards = () => {
    setSelectedBoardId(null);
    setSelectedClassId(null);
    setClasses([]);
    setBooks([]);
    setSearchQuery("");
  };

  const goToClasses = () => {
    setSelectedClassId(null);
    setBooks([]);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <DashboardBannerHeader
        titleTop="Textbook"
        titleHighlight="Library"
        imageSrc="/assets/illustrations/textbook-library-header.png"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statTiles.map((stat) => {
          const value = stat.key === "boards" ? boards.length : summary[stat.key];
          return (
            <div key={stat.key} className="rounded-[22px] border border-teachpad-cardBorder bg-white/88 p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
              <div className="flex items-center gap-3">
                <PastelIconTile name={stat.icon} className={cn("h-12 w-12 rounded-2xl", stat.tone)} />
                <div>
                  <p className="text-2xl font-black tracking-tight text-teachpad-ink">{loadingBoards || (stat.key !== "boards" && summary.loading) ? "..." : value}</p>
                  <p className="text-sm font-bold text-teachpad-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[24px] border border-teachpad-cardBorder bg-white/88 p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-base font-bold text-teachpad-muted">
            <button type="button" onClick={goToBoards} className={cn("transition hover:text-teachpad-blue", !selectedBoard && "text-teachpad-blue")}>
              Boards
            </button>
            {selectedBoard ? (
              <>
                <ChevronRight className="h-4 w-4" />
                <button type="button" onClick={goToClasses} className={cn("transition hover:text-teachpad-blue", !selectedClass && "text-teachpad-blue")}>
                  {selectedBoard.name}
                </button>
              </>
            ) : null}
            {selectedClass ? (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-teachpad-blue">{selectedClass.name}</span>
              </>
            ) : null}
          </div>
          <div className="relative group w-full sm:w-[260px] md:w-[320px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                !selectedBoard
                  ? "Search boards..."
                  : !selectedClass
                  ? "Search classes..."
                  : "Search textbooks..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-12 rounded-xl border border-slate-200/80 bg-white/60 hover:bg-white/80 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none shadow-[0_8px_20px_rgba(15,23,42,0.03)] focus:shadow-[0_12px_24px_rgba(37,99,235,0.06)] focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 ease-in-out"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:scale-110 active:scale-95 transition-all duration-150 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-sm opacity-80 transition-opacity duration-200 group-focus-within:opacity-0 sm:inline-block hidden">
                ⌘K
              </span>
            )}
          </div>
        </div>
      </section>

      {loadingBoards ? <LibrarySkeleton label="Loading boards..." /> : null}

      {!loadingBoards && !boards.length ? <EmptyLibrary /> : null}

      {!loadingBoards && boards.length > 0 && !selectedBoard ? (
        filteredBoards.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onSelect={() => {
                  setSelectedBoardId(board.id);
                  setSearchQuery("");
                }}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            title="No boards found"
            description="Try adjusting your search term to find a board."
            compact
          />
        )
      ) : null}

      {selectedBoard && !selectedClass ? (
        loadingClasses ? (
          <LibrarySkeleton label="Loading classes..." />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClasses.length ? (
              filteredClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  cls={classItem}
                  onSelect={() => {
                    setSelectedClassId(classItem.id);
                    setSearchQuery("");
                  }}
                />
              ))
            ) : (
              <div className="md:col-span-2 xl:col-span-3">
                <EmptyState
                  title="No classes found"
                  description={
                    searchQuery
                      ? "Try adjusting your search term to find a class."
                      : "Try another search term, or go back to choose another board."
                  }
                  compact
                />
              </div>
            )}
          </section>
        )
      ) : null}

      {selectedClass ? (
        <section className="grid gap-4">
          <Button variant="ghost" size="sm" className="w-fit" onClick={goToClasses}>
            <ArrowLeft className="h-4 w-4" /> Back to classes
          </Button>
          {loadingBooks ? (
            <LibrarySkeleton label="Loading textbooks..." />
          ) : subjectGroups.length ? (
            subjectGroups.map((group) => <SubjectShelf key={group.subject} subject={group.subject} books={group.books} />)
          ) : (
            <EmptyState
              title={searchQuery ? "No textbooks found" : "No subjects found"}
              description={
                searchQuery
                  ? "Try adjusting your search term to find a textbook."
                  : "Subjects will appear here once textbooks are added for this class."
              }
            />
          )}
        </section>
      ) : null}
    </div>
  );
}

function BoardCard({ board, onSelect }: { board: Board; onSelect: () => void }) {
  const boardLogo = board.code?.toLowerCase().includes("jkbose")
    ? "/landing/board-logos/jkbose-logo.png"
    : board.code?.toLowerCase().includes("cbse")
    ? "/landing/board-logos/cbse-logo.png"
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="clickable-card group overflow-hidden rounded-[24px] border border-teachpad-cardBorder bg-white text-left shadow-[0_18px_45px_var(--teachpad-shadowCard)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_var(--teachpad-shadowToolCard)] [--clickable-card-hover-bg:linear-gradient(135deg,#dbeafe_0%,#ffffff_74%)]"
    >
      <div className="flex min-h-full flex-col gap-4 bg-gradient-to-r from-[#f8ffff] via-white to-[#fff7fb] p-5 transition-colors duration-200 group-hover:from-[#dbeafe] group-hover:via-white group-hover:to-[#ffd9e8]">
        <div className="flex min-w-0 items-start gap-3">
          {boardLogo ? (
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[20px] bg-white p-2 shadow-sm">
              <Image src={boardLogo} alt={board.name} width={80} height={80} className="h-full w-full object-contain" />
            </span>
          ) : (
            <PastelIconTile name="layers" className="h-14 w-14 rounded-[20px]" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <h2 className="min-w-0 text-xl font-black leading-6 tracking-tight text-teachpad-ink">{board.name}</h2>
            </div>
            <p className="mt-1 text-sm font-semibold text-teachpad-muted">{board.code || "Curriculum board"}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-xl bg-teachpad-blue px-4 py-2 text-sm font-black text-white shadow-[0_10px_22px_rgba(22,119,255,0.20)] transition group-hover:bg-[#0f63d6]">
            View classes <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function ClassCard({ cls, onSelect }: { cls: ClassItem; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="clickable-card group rounded-[22px] border border-teachpad-cardBorder bg-gradient-to-br from-white to-[#f8ffff] p-4 text-left shadow-[0_14px_34px_var(--teachpad-shadowCard)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_var(--teachpad-shadowToolCard)] [--clickable-card-hover-bg:linear-gradient(135deg,#ccfbf1_0%,#ffffff_74%)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PastelIconTile name="graduationCap" className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-teachpad-ink">{cls.name}</h3>
            <p className="text-xs font-bold text-teachpad-muted">Open to load textbooks</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-teachpad-muted transition group-hover:translate-x-0.5 group-hover:text-teachpad-blue" />
      </div>
    </button>
  );
}

function SubjectShelf({ subject, books }: { subject: string; books: Book[] }) {
  const readyCount = books.filter((book) => book.is_ingested).length;

  return (
    <article className="rounded-[24px] border border-teachpad-cardBorder bg-white p-4 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <PastelIconTile name="bookOpen" className="h-12 w-12 rounded-[18px] bg-[#fff0bf]" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-teachpad-ink">{subject}</h2>
            <p className="text-xs font-bold text-teachpad-muted">{books.length} {books.length === 1 ? "textbook" : "textbooks"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-[220px]">
          <MiniMetric label="Ready" value={readyCount} />
          <MiniMetric label="Pending" value={Math.max(books.length - readyCount, 0)} />
        </div>
      </div>
      <div className="grid gap-2">
        {books.map((book) => (
          <BookRow key={book.id} book={book} />
        ))}
      </div>
    </article>
  );
}

function BookRow({ book }: { book: Book }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-teachpad-cardBorder bg-white p-3 shadow-[0_8px_22px_rgba(30,50,80,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_var(--teachpad-shadowToolCard)]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fff0bf] text-[#b97800]">
        <BookOpen className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black leading-5 text-teachpad-ink">{book.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-teachpad-tag px-2 py-0.5 text-xs font-bold text-teachpad-muted">{book.subject || "General"}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
              book.is_ingested ? "bg-[#e5ffc6] text-[#3d7b0f]" : "bg-[#fff0bf] text-[#b97800]"
            )}
          >
            {book.is_ingested ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {book.is_ingested ? "Ready" : "Pending"}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-teachpad-muted transition group-hover:translate-x-0.5 group-hover:text-teachpad-blue" />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-teachpad-cardBorder bg-white/76 px-3 py-2 text-center">
      <p className="text-lg font-black leading-5 text-teachpad-ink">{value}</p>
      <p className="mt-0.5 text-xs font-bold text-teachpad-muted">{label}</p>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <EmptyState
      title="No boards found"
      description="Ask your admin to add boards, classes, and textbooks. Once available, they will be organized here."
      action={
        <Link href="/dashboard/lesson-plans/new">
          <Button>
            <Sparkles className="h-4 w-4" /> Generate Lesson Plan
          </Button>
        </Link>
      }
    />
  );
}

function EmptyState({
  title,
  description,
  action,
  compact = false
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[24px] border border-dashed border-teachpad-cardBorder bg-white/78 text-center shadow-[0_14px_34px_var(--teachpad-shadowCard)]",
        compact ? "p-5" : "p-10"
      )}
    >
      <PastelIconTile name="bookOpen" className={cn("mb-4 rounded-[20px]", compact ? "h-12 w-12" : "h-16 w-16")} />
      <h3 className="text-lg font-black text-teachpad-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-teachpad-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function LibrarySkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-[20px]" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <p className="mb-4 text-sm font-bold text-teachpad-muted">{label}</p>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-[22px]" />
        <Skeleton className="h-32 rounded-[22px]" />
        <Skeleton className="h-32 rounded-[22px]" />
      </div>
    </div>
  );
}
