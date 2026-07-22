"use client";

import { useState } from "react";
import StateBlock from "@/components/common/StateBlock";
import SearchBar from "@/components/common/SearchBar";
import SegmentedSwitch from "@/components/common/SegmentedSwitch";
import ToastMessage from "@/components/common/ToastMessage";
import YesOrNo from "@/components/dialogs/YesOrNo";
import CreditBadge from "@/components/credits/CreditBadge";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import NavBar from "@/components/navigation/NavBar";
import PatternCard from "@/components/patterns/PatternCard";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatRoomList from "@/features/chat/components/ChatRoomList";
import ChatRoomTopBar from "@/features/chat/components/ChatRoomTopBar";
import { chatRoomFilters, type ChatRoomFilter } from "@/features/chat/constants";
import type { ChatRoom } from "@/features/chat/types";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const colorTokens = [
  ["ufo-bg", "bg-ufo-bg"],
  ["ufo-surface", "bg-ufo-surface"],
  ["ufo-text", "bg-ufo-text"],
  ["ufo-text-muted", "bg-ufo-text-muted"],
  ["ufo-border", "bg-ufo-border"],
  ["ufo-border-light", "bg-ufo-border-light"],
  ["ufo-brand", "bg-ufo-brand"],
  ["ufo-brand-soft", "bg-ufo-brand-soft"],
  ["ufo-brand-pale", "bg-ufo-brand-pale"],
  ["ufo-credit", "bg-ufo-credit"],
  ["ufo-chat-unread", "bg-ufo-chat-unread"],
  ["ufo-chat-thumbnail", "bg-ufo-chat-thumbnail"],
  ["ufo-divider", "bg-ufo-divider"],
] as const;

const patternCards = [
  {
    imageSrc: "/mock/pattern-card.svg",
    title: "라인패치아노락(Line Patch)",
    author: "@da0_knit다공",
    ratio: "1:1" as const,
  },
  {
    imageSrc: "/mock/plush-pink.svg",
    title: "순둥이 무설탕 토끼인형",
    author: "@ufo_knit",
    ratio: "4:5" as const,
  },
  {
    imageSrc: "/mock/plush-white.svg",
    title: "(대바늘) 뜨강아지",
    author: "@knit_room",
    ratio: "5:4" as const,
  },
];

const chatRooms: ChatRoom[] = [
  {
    chatId: "gallery-1",
    patternId: "pattern-1",
    name: "리터로폰텐 가디건",
    nickname: "뜨개구름",
    imageUrl: null,
    lastMessage: "대화중",
    favorite: true,
    isHidden: false,
    unreadCount: 22,
    createdAt: "2026-07-02T00:00:00.000Z",
  },
  {
    chatId: "gallery-2",
    patternId: "pattern-2",
    name: "라인패치아노락",
    nickname: "구름뜨개",
    imageUrl: "/mock/pattern-card.svg",
    lastMessage: "새로운 대체실 정보가 있어요.",
    favorite: false,
    isHidden: true,
    unreadCount: 0,
    createdAt: "2026-07-02T00:00:00.000Z",
  },
];

function GallerySection({ title, children }: SectionProps) {
  return (
    <section className="border-t border-ufo-divider px-4 py-6">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-ufo-text">{title}</h2>
      {children}
    </section>
  );
}

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ufo-border-light bg-ufo-surface">
      {children}
    </div>
  );
}

export default function DesignGalleryScreen() {
  const [query, setQuery] = useState("");
  const [switchValue, setSwitchValue] = useState<"card" | "plain">("card");
  const [chatFilter, setChatFilter] = useState<ChatRoomFilter>("UFO");
  const [settingsMode, setSettingsMode] = useState(false);
  const [message, setMessage] = useState("오늘 뜨개 진도 공유해요");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = () => {
    setToastMessage("토스트 메시지 예시입니다.");
    window.setTimeout(() => setToastMessage(null), 1800);
  };

  return (
    <>
      <MobileShell surfaceClassName="pb-10">
        <TopBar
          left="back"
          leftHref="/"
          title="디자인 갤러리"
          right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
          showBottomBorder
        />

        <section className="px-4 py-5">
          <p className="text-sm leading-6 text-ufo-text-secondary">
            보류된 radius와 PatternCard 규격을 재검토하기 위한 내부 시각 확인 페이지입니다.
          </p>
        </section>

        <GallerySection title="Colors">
          <div className="grid grid-cols-2 gap-3">
            {colorTokens.map(([name, className]) => (
              <div key={name} className="rounded-xl border border-ufo-border-light bg-white p-3">
                <div className={`mb-2 h-10 rounded-lg border border-ufo-border-light ${className}`} />
                <p className="break-all text-xs font-semibold text-ufo-text-secondary">{name}</p>
              </div>
            ))}
          </div>
        </GallerySection>

        <GallerySection title="Typography">
          <div className="space-y-3 rounded-2xl border border-ufo-border-light bg-white p-4">
            <p className="text-base font-semibold text-ufo-brand">Top bar title / text-base semibold</p>
            <p className="text-xl font-bold tracking-tight text-ufo-text">Section title / text-xl bold</p>
            <p className="text-sm leading-6 text-ufo-text-secondary">Body text / text-sm with relaxed reading rhythm</p>
            <p className="text-xs text-ufo-text-dim">Meta text / text-xs muted</p>
            <p className="text-[11px] font-semibold text-ufo-text-neutral">Caption or badge text / text-[11px]</p>
          </div>
        </GallerySection>

        <GallerySection title="Navigation">
          <div className="space-y-4">
            <PreviewFrame>
              <TopBar
                left="logo"
                leftHref="/"
                title={null}
                right={[
                  { type: "chat", href: "/chats", ariaLabel: "채팅" },
                  { type: "profile", href: "/my", ariaLabel: "프로필" },
                ]}
                sticky={false}
              />
            </PreviewFrame>
            <PreviewFrame>
              <NavBar />
            </PreviewFrame>
            <PreviewFrame>
              <ChatRoomTopBar
                title="리터로폰텐 가디건"
                subtitle="47명"
                right={[
                  { type: "favorite", ariaLabel: "즐겨찾기", active: true },
                  { type: "search", ariaLabel: "검색" },
                  { type: "fo", ariaLabel: "FO", active: false },
                ]}
              />
            </PreviewFrame>
          </div>
        </GallerySection>

        <GallerySection title="Inputs And Controls">
          <div className="space-y-4">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="검색어를 입력해 주세요"
              showSubmitButton
              submitDisabled={query.trim().length === 0}
            />
            <SegmentedSwitch
              options={[
                { label: "Card", value: "card" },
                { label: "Plain", value: "plain" },
              ]}
              value={switchValue}
              onChange={setSwitchValue}
            />
            <div className="flex flex-wrap gap-2">
              {["ALL", "긴소매", "반소매", "가디건", "조끼"].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`h-8 rounded-md px-3 text-xs font-semibold ${
                    index === 0
                      ? "bg-ufo-brand-soft text-ufo-text"
                      : "border border-ufo-border bg-white text-ufo-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <CreditBadge credits={30} />
          </div>
        </GallerySection>

        <GallerySection title="Cards">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {patternCards.map((card) => (
              <PatternCard
                key={`${card.imageSrc}-${card.ratio}`}
                imageSrc={card.imageSrc}
                imageRatio={card.ratio}
                title={card.title}
                author={card.author}
                heartVariant="outline"
              />
            ))}
          </div>
        </GallerySection>

        <GallerySection title="States">
          <div className="space-y-4">
            <StateBlock type="loading" title="정보를 불러오고 있어요." />
            <StateBlock
              type="error"
              title="정보를 불러오지 못했어요."
              description="잠시 후 다시 시도해 주세요."
              actionLabel="다시 시도"
              onAction={showToast}
            />
            <StateBlock
              type="empty"
              title="아직 내용이 없습니다."
              description="새 항목이 생기면 이곳에 표시됩니다."
            />
            <StateBlock type="empty" title="검색 결과가 없습니다." variant="plain" />
          </div>
        </GallerySection>

        <GallerySection title="Chat">
          <div className="space-y-5">
            <ChatRoomList
              title="나의 채팅방"
              rooms={chatRooms}
              emptyText="검색 결과가 없습니다."
              filters={chatRoomFilters}
              activeFilter={chatFilter}
              onFilterChange={setChatFilter}
              showSettingsButton
              isSettingsMode={settingsMode}
              onSettingsClick={() => setSettingsMode((current) => !current)}
            />
            <ChatInput
              value={message}
              onChange={setMessage}
              isSending={false}
              onSendMessage={showToast}
              replyPreview={{
                senderName: "뜨개감지",
                text: "이 실은 색감이 비슷해서 대체하기 좋아요.",
              }}
              onCancelReply={() => undefined}
            />
          </div>
        </GallerySection>

        <GallerySection title="Feedback">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={showToast}
              className="flex h-10 flex-1 items-center justify-center rounded-xl bg-ufo-text px-4 text-sm font-semibold text-white"
            >
              Toast
            </button>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-ufo-border bg-white px-4 text-sm font-semibold text-ufo-brand"
            >
              Dialog
            </button>
          </div>
        </GallerySection>
      </MobileShell>

      {isDialogOpen ? (
        <YesOrNo
          mainText="이 컴포넌트 기준을 확인할까요?"
          subText="radius와 typography를 함께 확인합니다."
          onYes={() => setIsDialogOpen(false)}
          onNo={() => setIsDialogOpen(false)}
        />
      ) : null}
      <ToastMessage message={toastMessage} />
    </>
  );
}
