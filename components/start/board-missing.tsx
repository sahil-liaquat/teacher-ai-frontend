"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// TOOL_REGISTRY's `teacher-writing-assistant`. It is the one generator that
// genuinely works on day one without a textbook: WritingGenerateRequest carries
// no book, board or chapter, and the trial gate excludes it.
const WRITING_ASSISTANT_HREF = "/dashboard/writing-assistant";

export function BoardMissing({
  boardName,
  onNameBoard,
  onBrowseCbse,
  onPickAnother
}: {
  boardName: string;
  /** Only supplied for "my board isn't listed" — there is no code to record. */
  onNameBoard?: (name: string) => void;
  onBrowseCbse?: () => void;
  onPickAnother: () => void;
}) {
  const [typedBoard, setTypedBoard] = useState("");
  const [saved, setSaved] = useState(false);

  function submitBoardName(event: FormEvent) {
    event.preventDefault();
    const name = typedBoard.trim();
    if (!name || !onNameBoard) return;
    onNameBoard(name);
    setSaved(true);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-4 sm:pt-8">
      <section className="rounded-2xl border border-teachpad-cardBorder bg-white/85 p-5">
        <h1 className="text-lg font-black text-teachpad-ink">We don&apos;t have your board&apos;s textbooks yet.</h1>
        <p className="mt-2 text-base font-semibold leading-7 text-teachpad-muted">
          TeachPad works by reading the actual chapter from your prescribed book, and we have only CBSE
          and JKBOSE so far. We will not pretend it is your book.
        </p>
        <p className="mt-2 text-base font-semibold leading-7 text-teachpad-muted">
          We have noted that you teach{" "}
          <strong className="text-teachpad-ink">{saved && typedBoard.trim() ? typedBoard.trim() : boardName}</strong>,
          and it helps us decide what to add next.
        </p>

        {onNameBoard ? (
          <form className="mt-4" onSubmit={submitBoardName}>
            <label className="block text-sm font-bold text-teachpad-ink" htmlFor="start-other-board">
              Which board?
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id="start-other-board"
                value={typedBoard}
                onChange={(event) => {
                  setTypedBoard(event.target.value);
                  setSaved(false);
                }}
                maxLength={24}
                placeholder="e.g. UP Board, ISC, DAV"
                className="h-11"
              />
              <Button type="submit" variant="outline" className="h-11 shrink-0" disabled={!typedBoard.trim()}>
                Save
              </Button>
            </div>
            <p className="mt-2 text-xs text-teachpad-muted" aria-live="polite">
              {saved ? "Noted — thank you. We count these when we choose the next board." : " "}
            </p>
          </form>
        ) : null}

        <p className="mt-4 text-base font-semibold leading-7 text-teachpad-muted">
          In the meantime the <strong className="text-teachpad-ink">Writing Assistant</strong> works without
          a textbook — use it for notes, letters, remarks and question wording.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href={WRITING_ASSISTANT_HREF}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-teachpad-blue text-base font-bold text-white transition-opacity hover:opacity-90"
          >
            Open Writing Assistant
          </Link>
          {onBrowseCbse ? (
            <Button type="button" variant="outline" className="h-12 flex-1 text-base" onClick={onBrowseCbse}>
              Browse CBSE anyway
            </Button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onPickAnother}
          className="mt-4 text-sm font-bold text-teachpad-blue underline underline-offset-4"
        >
          Pick a different board
        </button>
      </section>
    </div>
  );
}
