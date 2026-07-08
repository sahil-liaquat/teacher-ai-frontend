"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/admin/admin-ui";

const PayoutsClient = dynamic(
  () => import("@/components/influencer/payouts-client"),
  {
    ssr: false,
    loading: () => <div className="p-12"><LoadingState label="Loading payout ledger" /></div>,
  }
);

export default function InfluencerPayoutsPage() {
  return <PayoutsClient />;
}
