"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import HeartIcon, { type HeartIconVariant } from "@/components/icons/HeartIcon";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { syncPatternScrapCaches } from "@/features/patterns/lib/syncPatternScrapCaches";
import { updatePatternScrap } from "@/features/patterns/services/updatePatternScrap";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";

export type PatternCardImageRatio = "1:1" | "4:5" | "5:4";

type PatternCardProps = {
  imageSrc: string;
  imageRatio: PatternCardImageRatio;
  title: string;
  author: string;
  patternId?: number;
  alt?: string;
  imageSizes?: string;
  isScrapped?: boolean;
  heartVariant?: HeartIconVariant;
  heartClassName?: string;
  titleClassName?: string;
  authorClassName?: string;
  onScrapChange?: (isScrapped: boolean) => void;
};

const imageRatioClassMap: Record<PatternCardImageRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "5:4": "aspect-[5/4]",
};

export default function PatternCard({
  imageSrc,
  imageRatio,
  title,
  author,
  patternId,
  alt,
  imageSizes = "(max-width: 430px) calc((100vw - 48px) / 2), 191px",
  isScrapped = false,
  heartVariant,
  heartClassName,
  titleClassName = "truncate text-[13px] font-semibold",
  authorClassName = "text-[10px] text-ufo-text-neutral",
  onScrapChange,
}: PatternCardProps) {
  const queryClient = useQueryClient();
  const { authStatus, isAuthenticated, data: currentUser } = useAuthState();
  const { showAuthRequiredToast, toastMessage } = useAuthRequiredToast();
  const [localIsScrapped, setLocalIsScrapped] = useState(
    isScrapped || heartVariant === "filled",
  );
  const showHeart = heartVariant !== undefined;
  const authCacheKey = isAuthenticated
    ? currentUser?.userId ?? currentUser?.email ?? "member"
    : "guest";
  const patternHref = patternId !== undefined ? `/patterns/${patternId}` : null;
  const displayHeartVariant = localIsScrapped ? "filled" : "outline";
  const resolvedHeartClassName =
    displayHeartVariant === "filled"
      ? "h-5 w-5 stroke-white fill-white"
      : "h-5 w-5 stroke-white";
  const toggleScrapMutation = useMutation<
    Awaited<ReturnType<typeof updatePatternScrap>>,
    Error,
    boolean
  >({
    mutationFn: (nextIsScrapped: boolean) =>
      updatePatternScrap({
        patternId: patternId ?? 0,
        shouldScrap: nextIsScrapped,
      }),
    onSuccess: (result) => {
      setLocalIsScrapped(result.scrapped);
      syncPatternScrapCaches(queryClient, {
        patternId: patternId ?? 0,
        scrapped: result.scrapped,
        scrapCount: result.scrapCount,
        viewerKey: authCacheKey,
      });
      onScrapChange?.(result.scrapped);
    },
    onError: (error) => {
      if (isApiError(error, 401)) {
        showAuthRequiredToast();
      }
    },
  });

  useEffect(() => {
    setLocalIsScrapped(isScrapped);
  }, [isScrapped]);
  const handleHeartClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!showHeart || patternId === undefined || toggleScrapMutation.isPending) {
      return;
    }

    if (authStatus === "loading") {
      return;
    }

    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    toggleScrapMutation.mutate(!localIsScrapped);
  };
  const textContent = (
    <>
      <p className={titleClassName}>{title}</p>
      <p className={authorClassName}>{author}</p>
    </>
  );

  return (
    <>
      <div>
        <div
          className={`relative mb-2 w-full overflow-hidden rounded-2xl ${imageRatioClassMap[imageRatio]}`}
        >
        {patternHref ? (
          <Link href={patternHref} className="block h-full w-full">
            <Image
              src={imageSrc}
              alt={alt ?? `${title} image`}
              fill
              sizes={imageSizes}
              className="object-cover"
            />
          </Link>
        ) : (
          <Image
            src={imageSrc}
            alt={alt ?? `${title} image`}
            fill
            sizes={imageSizes}
            className="object-cover"
          />
        )}
        {showHeart ? (
          <div className="absolute bottom-2 right-2 z-10">
            {patternId !== undefined ? (
              <button
                type="button"
                onClick={handleHeartClick}
                disabled={toggleScrapMutation.isPending}
                className="flex items-center justify-center disabled:cursor-not-allowed"
                aria-label={localIsScrapped ? "찜 해제" : "찜 추가"}
                aria-pressed={localIsScrapped}
              >
                <HeartIcon
                  variant={displayHeartVariant}
                  className={heartClassName ?? resolvedHeartClassName}
                />
              </button>
            ) : (
              <HeartIcon
                variant={displayHeartVariant}
                className={heartClassName ?? resolvedHeartClassName}
              />
            )}
          </div>
        ) : null}
        </div>
        {patternHref ? (
          <Link href={patternHref} className="block">
            {textContent}
          </Link>
        ) : (
          textContent
        )}
      </div>
      <ToastMessage message={toastMessage} />
    </>
  );
}
