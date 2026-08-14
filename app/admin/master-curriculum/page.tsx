import { redirect } from "next/navigation";

export default function LegacyMasterCurriculumRedirect() {
  redirect("/admin/organizations/master-curriculum");
}
