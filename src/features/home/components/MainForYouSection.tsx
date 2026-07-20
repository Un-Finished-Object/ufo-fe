"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import PatternCard from "@/components/patterns/PatternCard";
import ToastMessage from "@/components/common/ToastMessage";
import type { AuthStatus } from "@/features/auth/hooks/useAuthState";
import {
  homeQueryKeys,
  saveUserInterests,
  userInterestsQueryOptions,
} from "@/features/home/queries/homeQueries";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";

type CuratedItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type MainForYouSectionProps = {
  items: CuratedItem[];
  isAuthenticated: boolean;
  authStatus: AuthStatus;
  authCacheKey: string;
};

const MAX_INTEREST_COUNT = 4;

const interestRows = [
  {
    items: [
      { label: "빈티지", className: "col-span-3 justify-self-center" },
      { label: "클래식", className: "col-span-3 translate-y-3 justify-self-center" },
      { label: "로맨틱", className: "col-span-3 -translate-y-0.5 justify-self-center" },
      { label: "캐주얼", className: "col-span-3 translate-y-1.5 justify-self-center" },
    ],
  },
  {
    items: [
      { label: "오버사이즈", className: "col-span-4 translate-y-2 justify-self-start" },
      { label: "슬림핏", className: "col-span-3 translate-y-4 justify-self-center" },
      { label: "크롭", className: "col-span-2 justify-self-center" },
      { label: "레귤러핏", className: "col-span-3 translate-y-4 justify-self-end" },
    ],
  },
  {
    items: [
      { label: "아란무늬", className: "col-span-3 col-start-2 translate-y-2 justify-self-start" },
      { label: "배색", className: "col-span-2 col-start-6 translate-y-3.5 justify-self-center" },
      { label: "메리야스", className: "col-span-3 col-start-9 translate-y-2 justify-self-end" },
    ],
  },
] as const;

export default function MainForYouSection({
  items,
  isAuthenticated,
  authStatus,
  authCacheKey,
}: MainForYouSectionProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const { showAuthRequiredToast, showToast, toastMessage } = useAuthRequiredToast(2000);
  const firstInterestButtonRef = useRef<HTMLButtonElement | null>(null);
  const isSettingDisabled = authStatus === "loading";
  const previousAuthCacheKeyRef = useRef(authCacheKey);
  const interestsQuery = useQuery({
    ...userInterestsQueryOptions(authCacheKey),
    enabled: authStatus === "authenticated",
  });
  const selectedInterests = authStatus === "authenticated" ? interestsQuery.data ?? [] : [];
  const isLoadingInterests = authStatus === "authenticated" && interestsQuery.isPending;
  const shouldShowInterestPrompt =
    authStatus !== "loading" && !isLoadingInterests && selectedInterests.length === 0;

  useEffect(() => {
    if (isModalOpen && firstInterestButtonRef.current) {
      firstInterestButtonRef.current.focus();
    }
  }, [isModalOpen]);

  useEffect(() => {
    const previousAuthCacheKey = previousAuthCacheKeyRef.current;

    if (previousAuthCacheKey === authCacheKey) {
      return;
    }

    queryClient.removeQueries({
      queryKey: homeQueryKeys.interests(previousAuthCacheKey),
    });
    previousAuthCacheKeyRef.current = authCacheKey;
  }, [authCacheKey, queryClient]);

  const saveInterestsMutation = useMutation({
    mutationFn: () => saveUserInterests(draftInterests),
    onSuccess: async (keywords) => {
      queryClient.setQueryData(homeQueryKeys.interests(authCacheKey), keywords);
      await queryClient.invalidateQueries({
        queryKey: homeQueryKeys.recommendPatterns(authCacheKey),
      });
      closeModal();
    },
    onError: () => {
      showToast("관심사 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    },
  });

  const openModal = () => {
    if (isSettingDisabled) {
      return;
    }

    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    setDraftInterests(selectedInterests);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleInterest = (interest: string) => {
    setDraftInterests((previous) => {
      if (previous.includes(interest)) {
        return previous.filter((item) => item !== interest);
      }
      if (previous.length >= MAX_INTEREST_COUNT) {
        return previous;
      }
      return [...previous, interest];
    });
  };

  const saveInterests = async () => {
    if (authStatus !== "authenticated") {
      showAuthRequiredToast();
      return;
    }

    saveInterestsMutation.mutate();
  };

  return (
    <>
      <section>
        <div className="mb-3 flex items-center justify-between px-4">
          <h2 className="text-xl font-bold tracking-tight">당신을 위한</h2>
          <button
            type="button"
            onClick={openModal}
            disabled={isSettingDisabled}
            className={`rounded-md px-2 py-1.5 text-xs text-white ${
              isSettingDisabled ? "bg-ufo-text-dim" : "bg-ufo-text"
            }`}
            aria-label="관심사 설정"
            aria-disabled={isSettingDisabled}
          >
            관심사 설정
          </button>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {selectedInterests.map((tag) => (
            <button
              key={tag}
              type="button"
              className="shrink-0 rounded-md bg-ufo-brand-soft px-3 py-1.5 text-xs"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="bg-ufo-text px-4 py-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-color:var(--color-ufo-brand-soft)_var(--color-ufo-text)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ufo-brand-soft [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/20">
            {shouldShowInterestPrompt ? (
              <div className="px-4 py-10 text-center text-sm font-semibold text-white">
                <p>관심사를 알려주세요!</p>
                <p className="mt-1 font-medium text-ufo-brand-soft">
                  선택한 관심사를 바탕으로 도안을 추천해 드려요.
                </p>
              </div>
            ) : items.length > 0 ? (
              <div className="flex w-max gap-4">
                {items.map((item) => (
                  <article key={item.id} className="w-[156px] shrink-0">
                    <PatternCard
                      imageSrc={item.image}
                      imageRatio="5:4"
                      imageSizes="156px"
                      title={item.title}
                      author={item.author}
                      patternId={item.id}
                      titleClassName="truncate text-[11px] font-semibold text-white"
                      authorClassName="text-[10px] text-ufo-text-muted"
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-white/80">
                추천 도안이 아직 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="관심사 설정"
        >
          <div className="w-full max-w-[430px] bg-ufo-text px-4 pb-6 pt-5">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="ml-2 text-lg leading-tight font-bold text-white">관심사를 알려주세요!</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-2 py-1 text-sm font-semibold text-white"
                aria-label="관심사 설정 닫기"
              >
                닫기
              </button>
            </div>
            <p className="ml-2 text-lg font-medium text-white">
              선택한 관심사를 바탕으로 도안을 추천해 드려요.
            </p>
            <p className="ml-2 mb-5 mt-1 text-lg text-ufo-brand-soft">
              *관심사는 최대 {MAX_INTEREST_COUNT}개까지 설정할 수 있습니다.
            </p>

            <div className="space-y-5">
              {interestRows.map((row, rowIndex) => (
                <div
                  key={`interest-row-${rowIndex}`}
                  className="grid grid-cols-12 items-start"
                >
                  {row.items.map((interest, index) => {
                    const selected = draftInterests.includes(interest.label);
                    const maxReached = draftInterests.length >= MAX_INTEREST_COUNT;
                    const disabled = !selected && maxReached;

                    return (
                      <button
                        key={interest.label}
                        ref={rowIndex === 0 && index === 0 ? firstInterestButtonRef : null}
                        type="button"
                        onClick={() => toggleInterest(interest.label)}
                        disabled={disabled}
                        className={`${interest.className} whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold transition-opacity max-[321px]:text-xs ${
                          selected ? "bg-ufo-brand-soft text-ufo-text" : "bg-ufo-border text-ufo-text-secondary"
                        } ${disabled ? "opacity-45" : ""}`}
                        aria-pressed={selected}
                        aria-disabled={disabled}
                        title={disabled ? "관심사는 최대 4개까지 선택할 수 있습니다." : undefined}
                      >
                        {interest.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={saveInterests}
              disabled={saveInterestsMutation.isPending}
              className="mt-6 h-11 w-full rounded-xl bg-ufo-brand-soft text-sm font-bold text-ufo-text"
            >
              관심사 설정
            </button>
          </div>
        </div>
      ) : null}
      <ToastMessage message={toastMessage} />
    </>
  );
}
