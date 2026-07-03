"use client";

import dynamic from "next/dynamic";
import { InfluencerSkeleton } from "@/components/influencer/influencer-skeleton";

const InfluencerPortalClient = dynamic(
  () => import("@/components/influencer/influencer-client"),
  {
    ssr: false,
    loading: () => <InfluencerSkeleton />,
  }
);

export default function InfluencerPortalPage() {
  return <InfluencerPortalClient />;
}
