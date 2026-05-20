"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Filter, Search, Sparkles, XCircle } from "lucide-react";
import { backendApi, Board, Book, ClassItem } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PastelIconTile } from "@/components/pastel-icon-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BoardWithData = Board & { classes: Array<ClassItem & { books: Book[] }> };

type FilterMode = "all" | "ingested" | "pending";

const statTiles = [
  { label: "Boards", key: "boards", icon: "layers", tone: "bg-[#e9e1ff]" },
  { label: "Classes", key: "classes", icon: "graduationCap", tone: "bg-[#dffafa]" },
  { label: "Books", key: "books", icon: "bookOpen", tone: "bg-[#fff0bf]" },
  { label: "Ready", key: "ready", icon: "checkCircle", tone: "bg-[#e5ffc6]" }
] as const;

export default function TeacherTextbooksPage() {
  const { toast } = useToast();
  const [data, setData] = useState<BoardWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const boards = await backendApi.boards(0, 50);
        const withClasses = await Promise.all(
          boards.items.map(async (board) => {
            const classes = await backendApi.classesByBoard(board.id, 0, 50).catch(() => ({ items: [] as ClassItem[] }));
            const classWithBooks = await Promise.all(
              classes.items.map(async (cls) => {
                const books = await backendApi.booksByClass(cls.id, 0, 50).catch(() => ({ items: [] as Book[] }));
                return { ...cls, books: books.items };
              })
            );
            return { ...board, classes: classWithBooks };
          })
        );
        if (!cancelled) setData(withClasses);
      } catch (err) {
        toast({ title: "Could not load textbooks", description: err instanceof Error ? err.message : "Try again" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const stats = useMemo(() => {
    const classes = data.reduce((sum, board) => sum + board.classes.length, 0);
    const books = data.reduce((sum, board) => sum + board.classes.reduce((classSum, cls) => classSum + cls.books.length, 0), 0);
    const ready = data.reduce(
      (sum, board) => sum + board.classes.reduce((classSum, cls) => classSum + cls.books.filter((book) => book.is_ingested).length, 0),
      0
    );
    return { boards: data.length, classes, books, ready };
  }, [data]);

  const selectedBoard = useMemo(() => data.find((board) => board.id === selectedBoardId) || null, [data, selectedBoardId]);
  const selectedClass = useMemo(
    () => selectedBoard?.classes.find((classItem) => classItem.id === selectedClassId) || null,
    [selectedBoard, selectedClassId]
  );

  const visibleBoards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;
    return data.filter((board) => `${board.name} ${board.code || ""}`.toLowerCase().includes(query));
  }, [data, searchQuery]);

  const visibleClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!selectedBoard) return [];
    if (!query) return selectedBoard.classes;
    return selectedBoard.classes.filter((classItem) => classItem.name.toLowerCase().includes(query));
  }, [searchQuery, selectedBoard]);

  const subjectGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!selectedClass) return [];

    const groups = selectedClass.books.reduce<Record<string, Book[]>>((collection, book) => {
      const subject = book.subject || "General";
      const statusMatches =
        filterMode === "all" || (filterMode === "ingested" && book.is_ingested) || (filterMode === "pending" && !book.is_ingested);
      const textMatches = !query || `${subject} ${book.title}`.toLowerCase().includes(query);
      if (!statusMatches || !textMatches) return collection;
      collection[subject] = [...(collection[subject] || []), book];
      return collection;
    }, {});

    return Object.entries(groups)
      .map(([subject, books]) => ({ subject, books }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [filterMode, searchQuery, selectedClass]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || (Boolean(selectedClass) && filterMode !== "all");
  const searchPlaceholder = selectedClass
    ? "Search subject or textbook..."
    : selectedBoard
      ? "Search class..."
      : "Search board...";

  const goToBoards = () => {
    setSelectedBoardId(null);
    setSelectedClassId(null);
    setSearchQuery("");
    setFilterMode("all");
  };

  const goToClasses = () => {
    setSelectedClassId(null);
    setSearchQuery("");
    setFilterMode("all");
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <PageHeader
        title="Textbook Library"
        description="Browse every board, class, and textbook from one clean teaching library."
        size="hero"
        illustration={
          <>
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white/95 to-transparent" />
            <img
              src="/assets/illustrations/textbook-library-header.png"
              alt=""
              aria-hidden="true"
              className="absolute right-6 top-1/2 w-[270px] -translate-y-1/2 select-none object-contain drop-shadow-[0_14px_14px_rgba(37,99,235,0.14)] xl:right-8 xl:w-[330px]"
            />
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statTiles.map((stat) => (
          <div key={stat.key} className="rounded-[22px] border border-teachpad-cardBorder bg-white/88 p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
            <div className="flex items-center gap-3">
              <PastelIconTile name={stat.icon} className={cn("h-12 w-12 rounded-2xl", stat.tone)} />
              <div>
                <p className="text-2xl font-black tracking-tight text-teachpad-ink">{loading ? "..." : stats[stat.key]}</p>
                <p className="text-sm font-bold text-teachpad-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[24px] border border-teachpad-cardBorder bg-white/88 p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teachpad-muted" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 pl-10"
              placeholder={searchPlaceholder}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {selectedClass ? (
              <div className="flex items-center gap-2 rounded-xl border border-teachpad-cardBorder bg-teachpad-tag px-3 py-2 text-sm font-bold text-teachpad-muted">
                <Filter className="h-4 w-4" />
                <Select value={filterMode} onChange={(event) => setFilterMode(event.target.value as FilterMode)} className="h-7 w-[150px] border-0 bg-transparent p-0 shadow-none">
                  <option value="all">All books</option>
                  <option value="ingested">Ready only</option>
                  <option value="pending">Pending only</option>
                </Select>
              </div>
            ) : null}
            {hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterMode("all");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? <LibrarySkeleton /> : null}

      {!loading && !data.length ? <EmptyLibrary /> : null}

      {!loading && data.length > 0 ? (
        <section className="rounded-[24px] border border-teachpad-cardBorder bg-white/88 p-4 shadow-[0_14px_34px_var(--teachpad-shadowCard)]">
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-teachpad-muted">
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
        </section>
      ) : null}

      {!loading && data.length > 0 && !selectedBoard ? (
        visibleBoards.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onSelect={() => {
                  setSelectedBoardId(board.id);
                  setSelectedClassId(null);
                  setSearchQuery("");
                  setFilterMode("all");
                }}
              />
            ))}
          </section>
        ) : (
          <NoMatchState onClear={() => setSearchQuery("")} />
        )
      ) : null}

      {!loading && selectedBoard && !selectedClass ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleClasses.length ? (
            visibleClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                cls={classItem}
                onSelect={() => {
                  setSelectedClassId(classItem.id);
                  setSearchQuery("");
                  setFilterMode("all");
                }}
              />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="No classes found" description="Try another search term, or go back to choose another board." compact />
            </div>
          )}
        </section>
      ) : null}

      {!loading && selectedClass ? (
        <section className="grid gap-4">
          <Button variant="ghost" size="sm" className="w-fit" onClick={goToClasses}>
            <ArrowLeft className="h-4 w-4" /> Back to classes
          </Button>
          {subjectGroups.length ? (
            subjectGroups.map((group) => <SubjectShelf key={group.subject} subject={group.subject} books={group.books} />)
          ) : (
            <EmptyState
              title="No subjects found"
              description={hasActiveFilters ? "Try clearing your search or status filter." : "Subjects will appear here once textbooks are added for this class."}
              action={
                hasActiveFilters ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterMode("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          )}
        </section>
      ) : null}
    </div>
  );
}

function BoardCard({ board, onSelect }: { board: BoardWithData; onSelect: () => void }) {
  const bookCount = board.classes.reduce((sum, cls) => sum + cls.books.length, 0);
  const readyCount = board.classes.reduce((sum, cls) => sum + cls.books.filter((book) => book.is_ingested).length, 0);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group overflow-hidden rounded-[24px] border border-teachpad-cardBorder bg-white text-left shadow-[0_18px_45px_var(--teachpad-shadowCard)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_var(--teachpad-shadowToolCard)]"
    >
      <div className="flex min-h-full flex-col gap-4 bg-gradient-to-r from-[#f8ffff] via-white to-[#fff7fb] p-5">
        <div className="flex min-w-0 items-center gap-3">
          <PastelIconTile name="layers" className="h-14 w-14 rounded-[20px]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-black tracking-tight text-teachpad-ink">{board.name}</h2>
              <Badge className={board.is_active === false ? "border-[#ffd9de] bg-[#ffd9de] text-[#b4233f]" : "border-[#e5ffc6] bg-[#e5ffc6] text-[#3d7b0f]"}>
                {board.is_active === false ? "Inactive" : "Active"}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-semibold text-teachpad-muted">
              {[board.code, `${board.classes.length} ${board.classes.length === 1 ? "class" : "classes"}`, `${bookCount} ${bookCount === 1 ? "book" : "books"}`]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-[220px]">
          <MiniMetric label="Ready" value={readyCount} />
          <MiniMetric label="Pending" value={Math.max(bookCount - readyCount, 0)} />
        </div>
        <div className="flex items-center justify-end text-sm font-black text-teachpad-blue">
          View classes <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

function ClassCard({ cls, onSelect }: { cls: ClassItem & { books: Book[] }; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group rounded-[22px] border border-teachpad-cardBorder bg-gradient-to-br from-white to-[#f8ffff] p-4 text-left shadow-[0_14px_34px_var(--teachpad-shadowCard)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_var(--teachpad-shadowToolCard)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PastelIconTile name="graduationCap" className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-teachpad-ink">{cls.name}</h3>
            <p className="text-xs font-bold text-teachpad-muted">{cls.books.length} {cls.books.length === 1 ? "textbook" : "textbooks"}</p>
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

function NoMatchState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      title="No boards match your search"
      description="Try another board name or clear the search."
      action={
        <Button variant="secondary" onClick={onClear}>
          Clear search
        </Button>
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

function LibrarySkeleton() {
  return (
    <div className="grid gap-5">
      {[1, 2].map((item) => (
        <div key={item} className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
          <div className="mb-5 flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-[20px]" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 rounded-[22px]" />
            <Skeleton className="h-44 rounded-[22px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
