"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import TopBar from "@/components/navigation/TopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { userQueryKeys, type UserProfile } from "@/features/auth/queries/userQueries";
import { updateMyProfile } from "@/features/auth/services/updateMyProfile";

function LoadingState() {
  return (
    <section className="px-6 py-12">
      <div className="flex flex-col items-center justify-center rounded-3xl border border-ufo-border bg-white px-6 py-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ufo-border-light border-t-ufo-brand-pale" />
        <p className="mt-4 text-sm font-medium text-ufo-text-secondary">프로필 정보를 준비하고 있어요.</p>
      </div>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="px-6 py-12">
      <div className="rounded-3xl border border-ufo-border bg-white px-6 py-10 text-center">
        <p className="text-base font-semibold text-ufo-text">프로필 정보를 불러오지 못했어요.</p>
        <p className="mt-2 text-sm text-ufo-text-secondary">잠시 후 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-2xl bg-ufo-brand px-5 py-3 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const [draftNickname, setDraftNickname] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      router.replace("/login?error=unauthorized");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, router]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  const saveProfileMutation = useMutation({
    mutationFn: (nextNickname: string) => updateMyProfile({ nickname: nextNickname }),
    onSuccess: (result) => {
      queryClient.setQueryData<UserProfile | null>(userQueryKeys.me, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          nickname: result.nickname,
        };
      });

      router.replace("/my");
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "Unauthorized") {
        router.replace("/login?error=unauthorized");
        return;
      }

      showToast("닉네임 저장에 실패했어요.");
    },
  });

  const nickname = draftNickname ?? meQuery.data?.nickname ?? "";
  const normalizedNickname = nickname.trim();
  const initialNickname = meQuery.data?.nickname ?? "";
  const isSaveDisabled =
    meQuery.isPending ||
    saveProfileMutation.isPending ||
    normalizedNickname.length === 0 ||
    normalizedNickname === initialNickname;
  const profileImageSrc = meQuery.data?.profileImage?.trim() ? meQuery.data.profileImage : null;
  const previewNickname = normalizedNickname || meQuery.data?.nickname || "회원";

  const handleRetry = useCallback(() => {
    void meQuery.refetch();
  }, [meQuery]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSaveDisabled) {
        return;
      }

      saveProfileMutation.mutate(normalizedNickname);
    },
    [isSaveDisabled, normalizedNickname, saveProfileMutation],
  );

  if (meQuery.isPending) {
    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface text-ufo-text">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            title="프로필 수정"
            showBottomBorder
          />
          <LoadingState />
        </main>
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface text-ufo-text">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            title="프로필 수정"
            showBottomBorder
          />
          <ErrorState onRetry={handleRetry} />
        </main>
      </div>
    );
  }

  if (!meQuery.data) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-ufo-bg">
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-ufo-surface pb-8 text-ufo-text">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            title="프로필 수정"
            showBottomBorder
          />

          <section className="px-6 pb-6 pt-7">
            <div className="rounded-[28px] bg-ufo-brand px-5 py-6 text-white shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/25 ring-2 ring-white/30">
                  {profileImageSrc ? (
                    <Image
                      src={profileImageSrc}
                      loader={({ src }) => src}
                      unoptimized
                      width={64}
                      height={64}
                      alt={`${previewNickname} profile image`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                      {previewNickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-white/80">My Profile</p>
                  <p className="mt-1 text-2xl font-bold tracking-[-0.03em]">{previewNickname}</p>
                  <p className="mt-1 text-sm text-white/80">{meQuery.data.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6">
            <form onSubmit={handleSubmit} className="rounded-[28px] border border-ufo-border bg-white px-5 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-[-0.03em] text-ufo-text">닉네임 수정</h2>
                  <p className="mt-2 text-sm leading-5 text-ufo-text-secondary">
                    마이페이지에 보이는 이름을 원하는 분위기로 바꿔보세요.
                  </p>
                </div>
                <span className="rounded-full bg-ufo-brand-pale px-3 py-1 text-xs font-semibold text-ufo-brand">
                  공개 프로필
                </span>
              </div>

              <div className="mt-6">
                <label htmlFor="nickname" className="text-sm font-semibold text-ufo-text-subtle">
                  닉네임
                </label>
                <div className="mt-2 rounded-2xl border border-ufo-border bg-ufo-surface px-4 py-3 focus-within:border-ufo-brand">
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    value={nickname}
                    onChange={(event) => setDraftNickname(event.target.value)}
                    className="w-full bg-transparent text-base font-medium text-ufo-text outline-none placeholder:text-ufo-text-dim"
                    placeholder="닉네임을 입력해 주세요"
                    autoComplete="nickname"
                  />
                </div>
                <p className="mt-2 text-sm text-ufo-text-secondary">
                  저장하면 마이페이지와 채팅에서 새로운 닉네임이 보입니다.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaveDisabled}
                className={`mt-8 w-full rounded-2xl px-4 py-3.5 text-base font-semibold transition ${
                  isSaveDisabled
                    ? "bg-ufo-border text-ufo-text-dim"
                    : "bg-ufo-brand text-white shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
                }`}
              >
                {saveProfileMutation.isPending ? "저장 중..." : "저장하기"}
              </button>
            </form>
          </section>
        </main>
      </div>

      <ToastMessage message={toastMessage} />
    </>
  );
}
