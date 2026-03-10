"use client";

import { useQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/lib/queries/user";

export function useMeQuery() {
  return useQuery(meQueryOptions());
}
