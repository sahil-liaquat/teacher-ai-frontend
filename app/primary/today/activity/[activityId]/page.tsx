import PrimaryActivityDetailPage from "@/components/primary/pages/primary-activity-detail-page";
import { PrimaryTeachingContextProvider } from "@/lib/primary-teaching-context";

export default async function ActivityPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  return (
    <PrimaryTeachingContextProvider>
      <PrimaryActivityDetailPage activityId={activityId} />
    </PrimaryTeachingContextProvider>
  );
}
