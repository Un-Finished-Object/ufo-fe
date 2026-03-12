"use client";

import { useEffect, useRef, useState } from "react";
import PatternCard from "@/components/PatternCard";
import ToastMessage from "@/components/ToastMessage";
import type { AuthStatus } from "@/hooks/useAuthState";
import { fetchWithAuthRetry } from "@/lib/fetchWithAuthRetry";

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
};

const MAX_INTEREST_COUNT = 4;

const interestRows = [
  {
    rowClassName: "pl-6 pr-6 justify-between",
    items: [
      { label: "빈티지", className: "" },
      { label: "클래식", className: "mt-3 -ml-4" },
      { label: "로맨틱", className: "-mt-0.5 -ml-1.5" },
      { label: "캐주얼", className: "mt-1.5" },
    ],
  },
  {
    rowClassName: "pl-2 justify-start gap-x-4",
    items: [
      { label: "오버사이즈", className: "mt-2 ml-0.5" },
      { label: "슬림핏", className: "mt-4 ml-8" },
      { label: "크롭", className: "ml-3" },
      { label: "레귤러핏", className: "mt-4 ml-4" },
    ],
  },
  {
    rowClassName: "pl-15 pr-8 justify-start gap-x-6",
    items: [
      { label: "아란무늬", className: "mt-2" },
      { label: "배색", className: "mt-3.5 ml-10" },
      { label: "메리야스", className: "mt-2 ml-5" },
    ],
  },
] as const;

export default function MainForYouSection({
  items,
  isAuthenticated,
  authStatus,
}: MainForYouSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const firstInterestButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFetchRef = useRef(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const isSettingDisabled = !isAuthenticated || authStatus === "loading";

  useEffect(() => {
    if (isModalOpen && firstInterestButtonRef.current) {
      firstInterestButtonRef.current.focus();
    }
  }, [isModalOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      didFetchRef.current = false;
      queueMicrotask(() => {
        setSelectedInterests([]);
      });
      return;
    }

    if (!apiBase || didFetchRef.current) {
      return;
    }

    let isMounted = true;
    didFetchRef.current = true;

    const fetchInterests = async () => {
      try {
        const response = await fetchWithAuthRetry({
          apiBase,
          input: `${apiBase}/v1/users/me/interests`,
          init: {
            method: "GET",
          },
        });

        if (!response.ok || !isMounted) {
          return;
        }

        const payload = (await response.json()) as {
          data?: { keywords?: string[] };
          error?: unknown;
        };

        if (payload.error || !payload.data) {
          return;
        }

        setSelectedInterests(Array.isArray(payload.data.keywords) ? payload.data.keywords : []);
      } catch {
        // Keep empty interests on network or parsing failures.
      }
    };

    void fetchInterests();

    return () => {
      isMounted = false;
    };
  }, [apiBase, authStatus]);

  const showToast = (message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2000);
  };

  const openModal = () => {
    if (isSettingDisabled) {
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
    if (!apiBase) {
      showToast("관심사 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      const response = await fetchWithAuthRetry({
        apiBase,
        input: `${apiBase}/v1/users/me/interests`,
        init: {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keywords: draftInterests }),
        },
      });

      if (!response.ok) {
        showToast("관심사 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      const payload = (await response.json()) as {
        data?: { keywords?: string[] };
        error?: unknown;
      };

      if (payload.error || !payload.data) {
        showToast("관심사 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      setSelectedInterests(Array.isArray(payload.data.keywords) ? payload.data.keywords : []);
      closeModal();
    } catch {
      showToast("관심사 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
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
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-4">
              {items.map((item) => (
                <article key={item.id} className="w-[156px] shrink-0">
                  <PatternCard
                    imageSrc={item.image}
                    imageRatio="5:4"
                    title={item.title}
                    author={item.author}
                    patternId={item.id}
                    titleClassName="truncate text-[11px] font-semibold text-white"
                    authorClassName="text-[10px] text-ufo-text-muted"
                  />
                </article>
              ))}
            </div>
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
              <h3 className="ml-2 text-l leading-tight font-bold text-white">관심사를 알려주세요!</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-2 py-1 text-sm font-semibold text-white"
                aria-label="관심사 설정 닫기"
              >
                닫기
              </button>
            </div>
            <p className="ml-2 text-l font-medium text-white">
              선택한 관심사를 바탕으로 도안을 추천해 드려요.
            </p>
            <p className="ml-2 mb-5 mt-1 text-l text-ufo-brand-soft">
              *관심사는 최대 {MAX_INTEREST_COUNT}개까지 설정할 수 있습니다.
            </p>

            <div className="space-y-3">
              {interestRows.map((row, rowIndex) => (
                <div
                  key={`interest-row-${rowIndex}`}
                  className={`flex flex-wrap items-start gap-y-2 ${row.rowClassName}`}
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
                        className={`${interest.className} rounded-md px-3 py-1.5 text-sm font-semibold transition-opacity ${
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
