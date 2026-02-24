"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type CuratedItem = {
  id: number;
  title: string;
  author: string;
  image: string;
};

type MainForYouSectionProps = {
  items: CuratedItem[];
};

const initialSelectedInterests = ["빈티지"];
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

export default function MainForYouSection({ items }: MainForYouSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialSelectedInterests,
  );
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const firstInterestButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isModalOpen && firstInterestButtonRef.current) {
      firstInterestButtonRef.current.focus();
    }
  }, [isModalOpen]);

  const openModal = () => {
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

  const saveInterests = () => {
    // TODO: Replace local interest state with API save/load when backend is ready.
    setSelectedInterests(draftInterests);
    closeModal();
  };

  return (
    <>
      <section>
        <div className="mb-3 flex items-center justify-between px-4">
          <h2 className="text-xl font-bold tracking-tight">당신을 위한</h2>
          <button
            type="button"
            onClick={openModal}
            className="rounded-md bg-[#252525] px-2 py-1.5 text-xs text-[#ffffff]"
            aria-label="관심사 설정"
          >
            관심사 설정
          </button>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {selectedInterests.map((tag) => (
            <button
              key={tag}
              type="button"
              className="shrink-0 rounded-md bg-[#fecbc8] px-3 py-1.5 text-xs"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="bg-[#252525] px-4 py-5">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-4">
              {items.map((item) => (
                <article key={item.id} className="w-[156px] shrink-0">
                  <div className="relative mb-2 aspect-[5/4] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={item.image}
                      alt={`${item.title} image`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="truncate text-[11px] font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-[#8f9198]">{item.author}</p>
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
          <div className="w-full max-w-[430px] bg-[#252525] px-4 pb-6 pt-5">
            <h3 className="ml-2 mb-4 text-l leading-tight font-bold text-white">
              관심사를 알려주세요!
            </h3>
            <p className="ml-2 text-l font-medium text-[#ffffff]">
              선택한 관심사를 바탕으로 도안을 추천해 드려요.
            </p>
            <p className="ml-2 mb-5 mt-1 text-l text-[#fecbc8]">
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
                          selected ? "bg-[#fecbc8] text-[#222327]" : "bg-[#d9d9d9] text-[#49494d]"
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
              className="mt-6 h-11 w-full rounded-xl bg-[#fecbc8] text-sm font-bold"
            >
              관심사 설정
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
