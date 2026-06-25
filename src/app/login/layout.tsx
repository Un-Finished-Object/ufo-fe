import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/metadata";

export const metadata: Metadata = noIndexMetadata;

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
