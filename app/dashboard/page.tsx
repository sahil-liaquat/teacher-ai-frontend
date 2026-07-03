"use client";

import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

const DashboardClient = dynamic(
  () => import("@/components/dashboard/dashboard-client"),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

export default function TeacherDashboard() {
  return <DashboardClient />;
}
