"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { ClassManager } from "@/components/school-admin/teachers/class-manager";
import { PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";

/**
 * People → Classes & Sections.
 *
 * ⚠ THE ONLY home for class management. `ClassManager` used to render here AND
 * at the foot of the Teachers workspace — two doors into the same CRUD, with
 * this page telling the admin to go to Teachers in order to assign. The Teachers
 * copy is gone; assignment stays on Teachers, where the roster is.
 *
 * `/school-admin/classes` redirects here so existing links keep working.
 */
export default function SchoolPeoplePage() {
  const client = useQueryClient();
  const years = useQuery({
    queryKey: ["school-admin", "academic-years"],
    queryFn: backendApi.schoolAdminAcademicYears,
  });
  const activeYear = years.data?.find((year) => year.is_active) ?? years.data?.[0];
  const classes = useQuery({
    queryKey: ["school-admin", "classes", activeYear?.id],
    queryFn: () => backendApi.adminSchoolClasses({ academic_year_id: activeYear?.id, include_archived: true }),
    enabled: Boolean(activeYear?.id),
  });

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading
        eyebrow="People"
        title="Classes & Sections"
        description="The class levels, sections and subjects your school runs this year. Assign teachers to them from Teachers."
      />
      <ClassManager
        classes={classes.data ?? []}
        isLoading={years.isLoading || classes.isLoading}
        academicYear={activeYear}
        onChanged={() => client.invalidateQueries({ queryKey: ["school-admin", "classes"] })}
      />
    </SchoolAdminPage>
  );
}
