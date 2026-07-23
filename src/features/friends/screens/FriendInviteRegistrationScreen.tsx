"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import SegmentedSwitch from "@/components/common/SegmentedSwitch";
import ToastMessage from "@/components/common/ToastMessage";
import CopyIcon from "@/components/icons/CopyIcon";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import StateBlock from "@/components/common/StateBlock";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { clearAuthenticatedQueryCache } from "@/features/auth/lib/clearAuthenticatedQueryCache";
import {
  referralQueryOptions,
  validateReferralCode,
} from "@/features/friends/queries/referralQueries";
import { useToast } from "@/hooks/useToast";
import { clearAccessToken } from "@/lib/auth/accessToken";
import { isApiError } from "@/lib/api/ApiError";

type FriendPageView = "invite" | "register";

const friendPageViewOptions = [
  { label: "친구 초대", value: "invite" },
  { label: "친구 등록", value: "register" },
] as const;

const FRIEND_CODE_LENGTH = 9;
const FRIEND_CODE_CHARACTER_PATTERN = /^[A-Z0-9]$/;
const FRIEND_REGISTRATION_PERIOD_DAYS = 7;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function isWithinFriendRegistrationPeriod(joinDate: number | null | undefined) {
  if (typeof joinDate !== "number" || !Number.isFinite(joinDate) || joinDate < 0) {
    return false;
  }

  if (joinDate < 1_000_000_000) {
    return joinDate <= FRIEND_REGISTRATION_PERIOD_DAYS;
  }

  const joinedAt = joinDate < 1_000_000_000_000 ? joinDate * 1000 : joinDate;
  const elapsedTime = Date.now() - joinedAt;

  return elapsedTime >= 0 && elapsedTime <= FRIEND_REGISTRATION_PERIOD_DAYS * DAY_IN_MILLISECONDS;
}

function normalizeFriendCodeCharacters(value: string) {
  return Array.from(value.toUpperCase()).filter((character) =>
    FRIEND_CODE_CHARACTER_PATTERN.test(character),
  );
}

function createEmptyFriendCode() {
  return Array.from({ length: FRIEND_CODE_LENGTH }, () => "");
}

type FriendCodeInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

function FriendCodeInput({ value, onChange }: FriendCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const nextCharacter = normalizeFriendCodeCharacters(event.target.value).at(-1) ?? "";
    const nextValue = [...value];
    nextValue[index] = nextCharacter;
    onChange(nextValue);

    if (nextCharacter && index < FRIEND_CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !value[index] && index > 0) {
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < FRIEND_CODE_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pastedCharacters = normalizeFriendCodeCharacters(
      event.clipboardData.getData("text"),
    ).slice(0, FRIEND_CODE_LENGTH);

    if (pastedCharacters.length === 0) {
      return;
    }

    event.preventDefault();
    onChange(
      Array.from(
        { length: FRIEND_CODE_LENGTH },
        (_, index) => pastedCharacters[index] ?? "",
      ),
    );
    focusInput(Math.min(pastedCharacters.length, FRIEND_CODE_LENGTH) - 1);
  };

  return (
    <div className="grid grid-cols-[repeat(9,minmax(0,1fr))] gap-1.5">
      {value.map((character, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="text"
          pattern="[A-Z0-9]"
          value={character}
          maxLength={2}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoCapitalize="characters"
          className="h-12 min-w-0 rounded-lg border border-ufo-border-light bg-ufo-surface text-center text-base font-semibold text-ufo-text outline-none focus:border-ufo-brand"
          aria-label={`친구 초대 코드 ${index + 1}번째 자리`}
        />
      ))}
    </div>
  );
}

export default function FriendInviteRegistrationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<FriendPageView>("invite");
  const [friendCode, setFriendCode] = useState(createEmptyFriendCode);
  const { showToast, toastMessage } = useToast();
  const normalizedFriendCode = friendCode.join("");
  const meQuery = useMeQuery();
  const referralQuery = useQuery(referralQueryOptions(meQuery.data?.userId));
  const canRegisterFriend = isWithinFriendRegistrationPeriod(meQuery.data?.joinDate);
  const visibleView = canRegisterFriend ? activeView : "invite";
  const isReferralUnauthorized = isApiError(referralQuery.error, 401);

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      router.replace("/login?toast=auth_required");
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, router]);

  useEffect(() => {
    if (!isReferralUnauthorized) {
      return;
    }

    clearAccessToken();
    clearAuthenticatedQueryCache(queryClient);
    router.replace("/login?toast=auth_required");
  }, [isReferralUnauthorized, queryClient, router]);

  const validateReferralMutation = useMutation({
    mutationFn: validateReferralCode,
    onSuccess: (valid) => {
      if (valid) {
        setFriendCode(createEmptyFriendCode());
        showToast("친구 등록이 완료됐어요.");
        return;
      }

      showToast("유효하지 않은 친구 초대 코드예요.");
    },
    onError: () => {
      showToast("친구 초대 코드를 확인하지 못했어요.");
    },
  });

  const handleCopy = async () => {
    const inviteCode = referralQuery.data?.referralCode;

    if (!inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast("초대 코드를 복사했어요.");
    } catch {
      showToast("초대 코드를 복사하지 못했어요.");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedFriendCode) {
      return;
    }

    validateReferralMutation.mutate(normalizedFriendCode);
  };

  if (meQuery.isPending) {
    return (
      <MobileShell>
        <TopBar left="back" title="친구 초대/등록" showBottomBorder />
        <StateBlock type="loading" title="사용자 정보를 불러오고 있어요." variant="plain" />
      </MobileShell>
    );
  }

  if (meQuery.isError) {
    return (
      <MobileShell>
        <TopBar left="back" title="친구 초대/등록" showBottomBorder />
        <StateBlock
          type="error"
          title="사용자 정보를 불러오지 못했어요."
          actionLabel="다시 시도"
          onAction={() => void meQuery.refetch()}
          variant="plain"
        />
      </MobileShell>
    );
  }

  if (!meQuery.data || isReferralUnauthorized) {
    return (
      <MobileShell>
        <TopBar left="back" title="친구 초대/등록" showBottomBorder />
        <StateBlock type="loading" title="로그인 화면으로 이동하고 있어요." variant="plain" />
      </MobileShell>
    );
  }

  return (
    <>
      <MobileShell surfaceClassName="pb-10">
        <TopBar
          left="back"
          title={canRegisterFriend ? "친구 초대/등록" : "친구 초대"}
          right={[{ type: "home", href: "/", ariaLabel: "홈으로 이동" }]}
          showBottomBorder
        />

        <div className="px-5 pt-7">
          <header>
            <h1 className="text-xl font-bold tracking-tight text-ufo-text">
              {canRegisterFriend ? "친구 초대/등록" : "친구 초대"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">
              {canRegisterFriend
                ? "초대 코드를 공유하거나 친구에게 받은 코드를 등록할 수 있어요."
                : "초대 코드를 친구에게 공유할 수 있어요."}
            </p>
          </header>

          {canRegisterFriend ? (
            <div className="mt-6">
              <SegmentedSwitch
                options={friendPageViewOptions}
                value={activeView}
                onChange={setActiveView}
              />
            </div>
          ) : null}

          {visibleView === "invite" ? (
            <section className="mt-8" aria-labelledby="my-invite-code-title">
              <h2 id="my-invite-code-title" className="text-base font-semibold text-ufo-text">
                {referralQuery.data ? `${referralQuery.data.username}님의 초대 코드` : "나의 친구 초대 코드"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">
                친구에게 아래 코드를 공유해 주세요.
              </p>

              {referralQuery.isPending ? (
                <StateBlock type="loading" title="초대 코드를 불러오고 있어요." variant="plain" className="mt-4" />
              ) : referralQuery.isError ? (
                <StateBlock
                  type="error"
                  title="초대 코드를 불러오지 못했어요."
                  actionLabel="다시 시도"
                  onAction={() => void referralQuery.refetch()}
                  variant="plain"
                  className="mt-4"
                />
              ) : (
                <div className="mt-4 flex min-h-14 items-center rounded-xl border border-ufo-border-light bg-ufo-surface px-3">
                  <p
                    className="grid min-w-0 flex-1 grid-cols-[repeat(9,minmax(0,1fr))] gap-1.5 text-center text-base font-semibold text-ufo-text"
                    aria-label={`나의 친구 초대 코드 ${referralQuery.data?.referralCode}`}
                  >
                    {Array.from(referralQuery.data?.referralCode ?? "").map(
                      (character, index) => (
                        <span key={`${character}-${index}`} aria-hidden="true">
                          {character}
                        </span>
                      ),
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ufo-brand"
                    aria-label="나의 친구 초대 코드 복사"
                  >
                    <CopyIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="mt-8" aria-labelledby="friend-registration-title">
              <h2 id="friend-registration-title" className="text-base font-semibold text-ufo-text">
                친구 등록
              </h2>
              <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">
                친구에게 받은 영문 대문자와 숫자 9자리 초대 코드를 입력해 주세요.
              </p>

              <form onSubmit={handleSubmit} className="mt-4">
                <FriendCodeInput value={friendCode} onChange={setFriendCode} />

                <button
                  type="submit"
                  disabled={
                    normalizedFriendCode.length !== FRIEND_CODE_LENGTH ||
                    validateReferralMutation.isPending
                  }
                  className="mt-4 h-12 w-full rounded-xl bg-ufo-brand text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-ufo-border disabled:text-ufo-text-dim"
                >
                  {validateReferralMutation.isPending ? "확인 중..." : "친구 등록하기"}
                </button>
              </form>
            </section>
          )}
        </div>
      </MobileShell>

      <ToastMessage message={toastMessage} />
    </>
  );
}
