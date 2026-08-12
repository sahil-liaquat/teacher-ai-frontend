"use client";

import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { backendApi, type TeacherInvitation } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ActionDialog } from "@/components/school-admin/shared/action-dialog";

export function InviteTeacherDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<TeacherInvitation | null>(null);

  function close() {
    onOpenChange(false);
    setEmail("");
    setIssued(null);
  }

  async function invite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setBusy(true);
    try {
      const invitation = await backendApi.adminInviteSchoolTeacher(trimmed);
      setIssued(invitation);
      await onInvited();
    } catch (error) {
      toast({
        title: "Could not send this invitation",
        description: getErrorMessage(error, "Check the email address and try again."),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}
      title={issued ? "Invitation ready to share" : "Invite a teacher"}
      description={
        issued
          ? "Send this link to the teacher. They sign in with the invited email and accept it themselves."
          : "The teacher receives an invitation and joins only after they accept it. Nobody is moved between schools automatically."
      }
      footer={
        issued ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button disabled={busy || !email.trim()} onClick={() => void invite()}>
              {busy ? "Creating…" : "Create invitation"}
            </Button>
          </>
        )
      }
    >
      {issued ? <IssuedInvitation invitation={issued} /> : (
        <>
          <label className="block text-sm font-semibold text-slate-900">
            Teacher's email
            <Input
              autoFocus
              type="email"
              className="mt-2"
              placeholder="teacher@school.edu.in"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && email.trim()) void invite(); }}
            />
          </label>
          <p className="mt-4 flex gap-2 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              A teacher who already belongs to another school cannot be invited — they have to leave
              that school first. Their students and notes always stay private to them.
            </span>
          </p>
        </>
      )}
    </ActionDialog>
  );
}

function IssuedInvitation({ invitation }: { invitation: TeacherInvitation }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const link = invitation.accept_url ?? "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy the link manually", description: "Your browser blocked clipboard access.", variant: "error" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Invitation for</p>
        <p className="mt-1 text-sm font-semibold text-slate-950">{invitation.email}</p>
        <p className="mt-3 break-all rounded-xl bg-white p-3 font-mono text-xs text-slate-700">{link}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => void copy()}>
          {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Copy className="h-4 w-4" /> Copy link</>}
        </Button>
      </div>
      <p className="text-xs leading-5 text-amber-800">
        This link is shown once and expires in seven days. It is stored hashed, so it cannot be
        recovered later — if you lose it, resend the invitation to issue a new one.
      </p>
    </div>
  );
}
