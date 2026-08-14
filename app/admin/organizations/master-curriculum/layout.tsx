import type { ReactNode } from "react";
import { MasterCurriculumShell } from "@/components/admin/master-curriculum/master-curriculum-shell";

export default function MasterCurriculumLayout({ children }: { children: ReactNode }) {
  return <MasterCurriculumShell>{children}</MasterCurriculumShell>;
}
