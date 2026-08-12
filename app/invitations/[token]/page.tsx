"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Building2, Check, LoaderCircle } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  backendApi,
  ensureSession,
  type OrganizationInvitationPreview,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/school-admin-teachers";
import { Button } from "@/components/ui/button";

/**
 * The teacher's half of the invitation flow. A school admin can only offer
 * membership — this page is where it is accepted, signed in as the invited
 * address. Nothing here can be completed on the teacher's behalf.
 */
export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    void ensureSession().then((present) => {
      if (!present) {
        router.replace(`/login?next=${encodeURIComponent(`/invitations/${token}`)}`);
        return;
      }
      setSessionReady(true);
    });
  }, [router, token]);

  const preview = useQuery<OrganizationInvitationPreview>({
    queryKey: ["organization-invitation", token],
    queryFn: () => backendApi.organizationInvitation(token),
    enabled: sessionReady,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => backendApi.acceptOrganizationInvitation(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });

  if (!sessionReady || preview.isLoading) {
    return <Shell><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" /><p className="mt-3 text-sm font-semibold text-slate-500">Checking your invitation…</p></Shell>;
  }

  if (accept.isSuccess) {
    return (
      <Shell>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Check className="h-6 w-6" /></span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
          You've joined {accept.data.organization_name}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {accept.data.already_member
            ? "You were already a member of this school — nothing changed."
            : "Your school administrator can now assign you to classes. Published school curriculum reaches you automatically."}
        </p>
        <Link href="/primary" className="mt-6 inline-block"><Button>Go to Primary</Button></Link>
      </Shell>
    );
  }

  if (preview.isError) {
    return (
      <Shell>
        <Problem message={getErrorMessage(preview.error, "This invitation link isn't valid.")} />
      </Shell>
    );
  }

  const invitation = preview.data;
  const usable = invitation?.status === "pending";

  return (
    <Shell>
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><Building2 className="h-6 w-6" /></span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
        Join {invitation?.organization_name}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        This invitation was sent to <strong className="font-semibold text-slate-900">{invitation?.email}</strong>.
        Accepting links your account to this school so you receive its published curriculum.
        Your own class roster, notes and observations stay private to you.
      </p>

      {usable ? (
        <>
          <p className="mt-3 text-xs font-semibold text-slate-500">Expires {formatDate(invitation?.expires_at)}</p>
          {accept.isError ? <Problem message={getErrorMessage(accept.error, "This invitation could not be accepted.")} /> : null}
          <Button className="mt-6" disabled={accept.isPending} onClick={() => accept.mutate()}>
            {accept.isPending ? "Joining…" : "Accept and join"}
          </Button>
        </>
      ) : (
        <Problem
          message={
            invitation?.status === "expired"
              ? "This invitation has expired. Ask your school to send a new one."
              : invitation?.status === "accepted"
                ? "This invitation has already been used."
                : "This invitation was cancelled."
          }
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fa] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">{children}</div>
    </main>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-left text-sm font-semibold leading-5 text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
