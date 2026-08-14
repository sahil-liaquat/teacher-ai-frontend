"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { ClassManager } from "@/components/school-admin/teachers/class-manager";
import { PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";

export default function ClassesAndSectionsPage() {
  const client = useQueryClient();
  const years = useQuery({ queryKey: ["school-admin", "academic-years"], queryFn: backendApi.schoolAdminAcademicYears });
  const activeYear = years.data?.find((year) => year.is_active) ?? years.data?.[0];
  const classes = useQuery({
    queryKey: ["school-admin", "classes", activeYear?.id],
    queryFn: () => backendApi.adminSchoolClasses({ academic_year_id: activeYear?.id, include_archived: true }),
    enabled: Boolean(activeYear?.id),
  });
  return <SchoolAdminPage>
    <PageHeading eyebrow="School structure" title="Classes & Sections" description="Define class levels, sections and subjects for an academic year, then assign teachers from the Teachers workspace." />
    <ClassManager classes={classes.data ?? []} isLoading={years.isLoading || classes.isLoading} academicYear={activeYear} onChanged={() => client.invalidateQueries({ queryKey: ["school-admin", "classes"] })} />
  </SchoolAdminPage>;
}
