"use client";

import dynamic from "next/dynamic";
import { LoadingState } from "@/components/admin/admin-ui";

const CommissionsClient = dynamic(
  () => import("@/components/influencer/commissions-client"),
  {
    ssr: false,
    loading: () => <div className="p-12"><LoadingState label="Loading commission ledger" /></div>,
  }
);

export default function InfluencerCommissionsPage() {
  return <CommissionsClient />;
}
