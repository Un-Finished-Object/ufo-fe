import { redirect } from "next/navigation";
import { adminRoutes } from "@/features/admin/lib/adminRoutes";

export default function AdminPage() {
  redirect(adminRoutes.main);
}
