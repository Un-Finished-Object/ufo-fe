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

const availableInterests = [
  "빈티지",
  "클래식",
  "로맨틱",
  "캐주얼",
  "오버사이즈",
  "슬림핏",
  "크롭",
  "레귤러핏",
  "아란무늬",
  "메리야스",
  "배색"
];

const initialSelectedInterests = ["빈티지", "오버사이즈"];

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
          <h2 className="text-2xl font-black tracking-tight">당신을 위한</h2>
          <button
            type="button"
            onClick={openModal}
            className="rounded-full border border-[#d6d6d6] bg-[#f8f8f8] px-3 py-1 text-xs font-semibold text-[#666]"
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
              className="shrink-0 rounded-full border border-[#d6d6d6] bg-[#f8f8f8] px-3 py-1 text-xs font-semibold text-[#666]"
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="bg-[#222327] px-4 py-5">
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-4">
              {items.map((item) => (
                <article key={item.id} className="w-[156px] shrink-0">
                  <div className="relative mb-2 h-[112px] overflow-hidden rounded-2xl">
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
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 px-4 pb-6 pt-10"
          role="dialog"
          aria-modal="true"
          aria-label="관심사 설정"
        >
          <div className="w-full max-w-[430px] rounded-2xl bg-[#ffffff] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#222]">관심사 설정</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-2 py-1 text-sm font-semibold text-[#777]"
                aria-label="닫기"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {availableInterests.map((interest, index) => {
                const selected = draftInterests.includes(interest);

                return (
                  <button
                    key={interest}
                    ref={index === 0 ? firstInterestButtonRef : null}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                      selected
                        ? "border-[#f09fa7] bg-[#fce6ea] text-[#d26d78]"
                        : "border-[#d6d6d6] bg-white text-[#666]"
                    }`}
                    aria-pressed={selected}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={saveInterests}
              className="mt-5 h-11 w-full rounded-xl bg-[#ec9ca5] text-sm font-bold text-white"
            >
              관심사 저장
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
