import type { QueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { chatMessagesQueryRoot } from "@/features/chat/hooks/useChatMessagesQuery";
import { chatStatusQueryRoot } from "@/features/chat/hooks/useChatStatusQuery";
import { myChatRoomsQueryKey } from "@/features/chat/queries/chatQueries";
import { clearPendingChatReads } from "@/features/chat/lib/chatReadReceiptQueue";
import { referralQueryKeys } from "@/features/friends/queries/referralQueries";
import { homeQueryKeys } from "@/features/home/queries/homeQueries";
import { myActivityQueryKeys } from "@/features/my/queries/myActivityQueries";
import { patternAlternativesQueryRoot } from "@/features/patterns/queries/patternAlternativeQueries";
import { alternativeReactionQueryRoot } from "@/features/patterns/queries/patternAlternativeReactionQueries";
import { alternativeCommentsQueryRoot } from "@/features/patterns/queries/patternAlternativeCommentQueries";
import { patternCatalogQueryKeys } from "@/features/patterns/queries/patternCatalogQueries";
import { patternDetailQueryRoot } from "@/features/patterns/queries/patternDetailQueries";
import { patternPurchaseQueryRoot } from "@/features/patterns/queries/patternPurchaseQueries";
import { patternSearchQueryKeys } from "@/features/patterns/queries/patternSearchQueries";
import { patternScrapQueryKeys } from "@/features/scraps/queries/patternScrapQueries";

const authenticatedQueryRoots = [
  userQueryKeys.wallet,
  referralQueryKeys.all,
  myChatRoomsQueryKey,
  chatMessagesQueryRoot,
  chatStatusQueryRoot,
  myActivityQueryKeys.all,
  patternPurchaseQueryRoot,
  patternAlternativesQueryRoot,
  alternativeReactionQueryRoot,
  alternativeCommentsQueryRoot,
  patternScrapQueryKeys.all,
  homeQueryKeys.all,
  patternCatalogQueryKeys.all,
  patternSearchQueryKeys.all,
  patternDetailQueryRoot,
] as const;

export function clearAuthenticatedQueryCache(queryClient: QueryClient) {
  clearPendingChatReads();

  authenticatedQueryRoots.forEach((queryKey) => {
    queryClient.removeQueries({ queryKey });
  });
  queryClient.setQueryData(userQueryKeys.me, null);
}
