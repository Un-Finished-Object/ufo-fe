import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = noIndexMetadata;

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
