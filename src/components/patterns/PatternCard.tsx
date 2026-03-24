"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import HeartIcon, { type HeartIconVariant } from "@/components/icons/HeartIcon";
import { useAuthState } from "@/features/auth/hooks/useAuthState";
import { updatePatternScrap } from "@/features/patterns/services/updatePatternScrap";

export type PatternCardImageRatio = "1:1" | "4:5" | "5:4";

type PatternCardProps = {
  imageSrc: string;
  imageRatio: PatternCardImageRatio;
  title: string;
  author: string;
  patternId?: number;
  alt?: string;
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
  isScrapped = false,
  heartVariant,
  heartClassName,
  titleClassName = "truncate text-[13px] font-semibold",
  authorClassName = "text-[10px] text-ufo-text-neutral",
  onScrapChange,
}: PatternCardProps) {
  const router = useRouter();
  const { authStatus, isAuthenticated } = useAuthState();
  const [localIsScrapped, setLocalIsScrapped] = useState(
    isScrapped || heartVariant === "filled",
  );
  const showHeart = heartVariant !== undefined;
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
      onScrapChange?.(result.scrapped);
    },
    onError: (error) => {
      if (error.message === "Unauthorized") {
        router.push("/login?toast=auth_required");
      }
    },
  });
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
      router.push("/login?toast=auth_required");
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
    <div>
      <div
        className={`relative mb-2 w-full overflow-hidden rounded-2xl ${imageRatioClassMap[imageRatio]}`}
      >
        {patternHref ? (
          <Link href={patternHref} className="block h-full w-full">
            <Image src={imageSrc} alt={alt ?? `${title} image`} fill className="object-cover" />
          </Link>
        ) : (
          <Image src={imageSrc} alt={alt ?? `${title} image`} fill className="object-cover" />
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
  );
}
