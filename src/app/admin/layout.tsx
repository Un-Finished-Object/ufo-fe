import type { Metadata } from "next";
import AdminShell from "@/features/admin/components/AdminShell";
import { adminRoutes } from "@/features/admin/lib/adminRoutes";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = noIndexMetadata;

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell routes={adminRoutes}>{children}</AdminShell>;
}
