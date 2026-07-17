import CreditHistoryScreen from "@/features/my/screens/CreditHistoryScreen";
import type {
  CreditTransactionReasonFilter,
  CreditTransactionTypeFilter,
} from "@/features/my/queries/creditTransactionQueries";

type MyCreditsPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    type?: string | string[];
    reason?: string | string[];
  }>;
};

const typeFilterValues = new Set(["all", "earn", "spend", "adjust"]);
const reasonFilterValues = new Set(["all", "attendance", "chat"]);

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parsePage(value: string) {
  const parsedPage = Number.parseInt(value, 10);

  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function parseTypeFilter(value: string): CreditTransactionTypeFilter {
  return typeFilterValues.has(value) ? (value as CreditTransactionTypeFilter) : "all";
}

function parseReasonFilter(value: string): CreditTransactionReasonFilter {
  return reasonFilterValues.has(value) ? (value as CreditTransactionReasonFilter) : "all";
}

export default async function MyCreditsPage({ searchParams }: MyCreditsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = parsePage(getSingleSearchParam(resolvedSearchParams?.page));
  const type = parseTypeFilter(getSingleSearchParam(resolvedSearchParams?.type));
  const reason = parseReasonFilter(getSingleSearchParam(resolvedSearchParams?.reason));

  return (
    <CreditHistoryScreen
      key={`${page}-${type}-${reason}`}
      initialPage={page}
      initialType={type}
      initialReason={reason}
    />
  );
}
