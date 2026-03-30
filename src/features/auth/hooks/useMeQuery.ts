"use client";

import { useQuery } from "@tanstack/react-query";
import { meQueryOptions } from "@/features/auth/queries/userQueries";

export function useMeQuery() {
  return useQuery(meQueryOptions());
}
