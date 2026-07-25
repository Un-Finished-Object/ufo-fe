"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import Checkbox from "@/components/common/Checkbox";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import { useToast } from "@/hooks/useToast";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import {
  createRandomNickname,
  MAX_SIGNUP_INTEREST_COUNT,
  SIGNUP_INTEREST_OPTIONS,
} from "@/features/auth/lib/signupOptions";
import { userQueryKeys, type UserProfile } from "@/features/auth/queries/userQueries";
import { checkNicknameAvailability } from "@/features/auth/services/checkNicknameAvailability";
import { completeSignup } from "@/features/auth/services/completeSignup";
import { homeQueryKeys } from "@/features/home/queries/homeQueries";
import { SIGNUP_WELCOME_SESSION_KEY } from "@/features/onboarding/lib/signupWelcome";
import { isApiError } from "@/lib/api/ApiError";
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from "@/lib/legalLinks";
import {
  IMAGE_UPLOAD_ACCEPT,
  uploadImageFiles,
  type UploadedImageFile,
} from "@/services/images/uploadImageFiles";

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]+$/;
const MAX_NICKNAME_GENERATION_ATTEMPTS = 10;
const DEFAULT_PROFILE_IMAGE_KEY = "defaults/profile.png";
const DEFAULT_PROFILE_IMAGE_URL = "https://cdn.knit-ufo.co.kr/defaults/profile.png";

type AgreementKey = "terms" | "privacy";

export default function SignupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState("");
  const [debouncedNickname, setDebouncedNickname] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({
    terms: false,
    privacy: false,
  });
  const [profileImage, setProfileImage] = useState<UploadedImageFile | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const { showToast, toastMessage } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => setNickname(createRandomNickname()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedNickname(nickname.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [nickname]);

  useEffect(() => {
    return () => {
      if (previewImageUrl?.startsWith("blob:")) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  const normalizedNickname = nickname.trim();
  const isNicknameFormatValid =
    normalizedNickname.length >= 2 &&
    normalizedNickname.length <= 20 &&
    NICKNAME_PATTERN.test(normalizedNickname);
  const nicknameCheckQuery = useQuery({
    queryKey: ["nickname-availability", debouncedNickname],
    queryFn: ({ signal }) => checkNicknameAvailability(debouncedNickname, signal),
    enabled: debouncedNickname.length > 0 &&
      debouncedNickname === normalizedNickname &&
      isNicknameFormatValid,
    staleTime: 30_000,
    retry: false,
  });

  const generateNicknameMutation = useMutation({
    mutationFn: async () => {
      for (let attempt = 0; attempt < MAX_NICKNAME_GENERATION_ATTEMPTS; attempt += 1) {
        const candidate = createRandomNickname();
        const isAvailable = await checkNicknameAvailability(candidate);

        if (isAvailable) return candidate;
      }

      throw new Error("사용 가능한 닉네임을 만들지 못했어요.");
    },
    onSuccess: (availableNickname) => {
      setNickname(availableNickname);
      setDebouncedNickname(availableNickname);
      queryClient.setQueryData(["nickname-availability", availableNickname], true);
    },
    onError: () => {
      showToast("닉네임을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const [uploadedImage] = await uploadImageFiles({ files: [file], purpose: "PROFILE" });
      if (!uploadedImage) throw new Error("프로필 이미지 업로드에 실패했어요.");
      return uploadedImage;
    },
    onSuccess: setProfileImage,
    onError: (error) => {
      setPreviewImageUrl(null);
      setProfileImage(null);
      showToast(error instanceof Error ? error.message : "프로필 이미지 업로드에 실패했어요.");
    },
  });

  const signupMutation = useMutation({
    mutationFn: () =>
      completeSignup({
        userName: normalizedNickname,
        profileImageKey: profileImage?.imageKey ?? DEFAULT_PROFILE_IMAGE_KEY,
        keywords: selectedInterests,
      }),
    onSuccess: (profile) => {
      queryClient.setQueryData<UserProfile | null>(userQueryKeys.me, (previous) =>
        previous
          ? {
              ...previous,
              userId: profile.userId,
              nickname: profile.userName,
              profileImage: profile.profileImageUrl,
            }
          : previous,
      );
      void queryClient.invalidateQueries({ queryKey: homeQueryKeys.interestsRoot });
      void queryClient.invalidateQueries({ queryKey: homeQueryKeys.recommendPatternsRoot });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.wallet });
      window.sessionStorage.setItem(SIGNUP_WELCOME_SESSION_KEY, "true");
      router.replace("/onboarding");
    },
    onError: (error) => {
      showToast(
        isApiError(error, 401)
          ? "인증이 만료되었어요. 다시 로그인해 주세요."
          : "회원가입 정보를 저장하지 못했어요. 다시 시도해 주세요.",
      );
    },
  });

  const allAgreed = agreements.terms && agreements.privacy;
  const isNicknameAvailable =
    debouncedNickname === normalizedNickname && nicknameCheckQuery.data === true;
  const isSubmitDisabled =
    !isNicknameFormatValid ||
    !isNicknameAvailable ||
    !allAgreed ||
    generateNicknameMutation.isPending ||
    uploadMutation.isPending ||
    signupMutation.isPending;
  const profileImageSrc = previewImageUrl ?? DEFAULT_PROFILE_IMAGE_URL;

  const handleImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setProfileImage(null);
    setPreviewImageUrl((previous) => {
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((previous) => {
      if (previous.includes(interest)) return previous.filter((item) => item !== interest);
      if (previous.length >= MAX_SIGNUP_INTEREST_COUNT) return previous;
      return [...previous, interest];
    });
  };

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSubmitDisabled) signupMutation.mutate();
  };

  if (meQuery.isPending) {
    return (
      <MobileShell>
        <StateBlock type="loading" title="회원 정보를 준비하고 있어요." />
      </MobileShell>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <MobileShell surfaceClassName="flex items-center px-6">
        <StateBlock
          type="error"
          title="회원 정보를 불러오지 못했어요."
          description="로그인 후 다시 시도해 주세요."
          actionLabel="로그인으로 이동"
          onAction={() => router.replace("/login")}
        />
      </MobileShell>
    );
  }

  const nicknameStatus = !normalizedNickname
    ? "닉네임을 입력해 주세요."
    : !isNicknameFormatValid
      ? "한글, 영문, 숫자로 2~20자까지 입력해 주세요."
      : nicknameCheckQuery.isPending || debouncedNickname !== normalizedNickname
        ? "닉네임을 확인하고 있어요."
        : nicknameCheckQuery.isError
          ? "중복 확인에 실패했어요. 잠시 후 다시 입력해 주세요."
          : isNicknameAvailable
            ? "사용할 수 있는 닉네임이에요."
            : "이미 사용 중인 닉네임이에요.";

  return (
    <>
      <MobileShell surfaceClassName="pb-8">
        <TopBar left="logo" leftHref="/" title="회원가입" showBottomBorder />
        <section className="px-6 pb-5 pt-7">
          <p className="text-sm font-semibold text-ufo-brand">UFO 시작하기</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">뜨친 프로필을 만들어 주세요</h1>
          <p className="mt-2 text-sm leading-6 text-ufo-text-secondary">
            나중에 마이페이지에서 언제든 수정할 수 있어요.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="px-6 pt-7">
          <section aria-labelledby="profile-title">
            <h2 id="profile-title" className="text-base font-semibold">프로필 설정</h2>
            <div className="mt-5 flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="relative h-28 w-28 overflow-hidden rounded-full bg-ufo-brand-pale shadow-[0_2px_10px_rgba(0,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="프로필 이미지 선택"
              >
                {profileImageSrc ? (
                  <Image
                    src={profileImageSrc}
                    loader={({ src }) => src}
                    unoptimized
                    width={112}
                    height={112}
                    alt="프로필 이미지 미리보기"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-3xl font-bold text-ufo-brand">
                    {normalizedNickname.charAt(0) || "U"}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-ufo-brand py-2 text-xs font-semibold text-white">
                  {uploadMutation.isPending ? "업로드 중" : "변경"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                onChange={handleImageChange}
                className="sr-only"
                aria-label="프로필 이미지 파일"
              />
            </div>

            <div className="mt-7">
              <label htmlFor="signup-nickname" className="text-sm font-semibold text-ufo-text-secondary">
                닉네임
              </label>
              <p className="mt-1.5 text-xs text-ufo-text-subtle">
                자동 생성 닉네임을 사용하거나 직접 입력할 수 있습니다.
              </p>
              <div className="mt-2 flex items-center rounded-xl border border-ufo-border-light px-4 focus-within:border-ufo-brand">
                <input
                  id="signup-nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  maxLength={20}
                  autoComplete="nickname"
                  className="h-12 min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
                  aria-describedby="nickname-status"
                />
                <button
                  type="button"
                  onClick={() => generateNicknameMutation.mutate()}
                  disabled={generateNicknameMutation.isPending}
                  className="ml-3 shrink-0 text-xs font-semibold text-ufo-brand disabled:cursor-wait disabled:text-ufo-text-dim"
                  aria-label="랜덤 닉네임 다시 만들기"
                >
                  {generateNicknameMutation.isPending ? "생성 중" : "다시 만들기"}
                </button>
              </div>
              <p
                id="nickname-status"
                className={`mt-2 text-xs ${isNicknameAvailable ? "text-ufo-text-secondary" : "text-ufo-error"}`}
                aria-live="polite"
              >
                {nicknameStatus}
              </p>
            </div>
          </section>

          <section className="mt-9 border-t border-ufo-divider pt-7" aria-labelledby="interest-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="interest-title" className="text-base font-semibold">관심사 설정 <span className="font-normal text-ufo-text-subtle">(선택)</span></h2>
                <p className="mt-1 text-xs text-ufo-text-secondary">취향에 맞는 도안을 추천해 드려요.</p>
              </div>
              <span className="text-xs text-ufo-text-subtle">{selectedInterests.length}/{MAX_SIGNUP_INTEREST_COUNT}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SIGNUP_INTEREST_OPTIONS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                const disabled = !selected && selectedInterests.length >= MAX_SIGNUP_INTEREST_COUNT;
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    disabled={disabled}
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-ufo-brand bg-ufo-brand-pale font-semibold text-ufo-text"
                        : "border-ufo-border-light bg-ufo-surface text-ufo-text-secondary disabled:opacity-40"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-9 border-t border-ufo-divider pt-7" aria-labelledby="agreement-title">
            <h2 id="agreement-title" className="text-base font-semibold">약관 동의</h2>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-ufo-brand-soft bg-ufo-brand-pale px-4 py-3.5 transition-colors hover:bg-ufo-brand-soft/60">
              <Checkbox
                checked={allAgreed}
                onChange={(checked) => setAgreements({ terms: checked, privacy: checked })}
                ariaLabel="필수 약관 전체 동의"
              />
              <button
                type="button"
                onClick={() => setAgreements({ terms: !allAgreed, privacy: !allAgreed })}
                className="flex-1 text-left text-sm font-semibold"
              >
                필수 약관 전체 동의
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <AgreementRow
                checked={agreements.terms}
                label="이용약관 동의 (필수)"
                href={TERMS_OF_SERVICE_URL}
                external
                onChange={() => toggleAgreement("terms")}
              />
              <AgreementRow
                checked={agreements.privacy}
                label="개인정보처리방침 동의 (필수)"
                href={PRIVACY_POLICY_URL}
                external
                onChange={() => toggleAgreement("privacy")}
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`mt-9 h-12 w-full rounded-xl text-base font-semibold text-white transition ${
              isSubmitDisabled ? "bg-ufo-border text-ufo-text-dim" : "bg-ufo-brand"
            }`}
          >
            {signupMutation.isPending ? "저장 중..." : "UFO 시작하기"}
          </button>
        </form>
      </MobileShell>
      <ToastMessage message={toastMessage} />
    </>
  );
}

function AgreementRow({
  checked,
  label,
  href,
  external = false,
  onChange,
}: {
  checked: boolean;
  label: string;
  href: string;
  external?: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-ufo-brand-pale">
      <Checkbox
        checked={checked}
        onChange={onChange}
        ariaLabel={label}
      />
      <span className="min-w-0 flex-1 text-sm text-ufo-text-secondary">{label}</span>
      <Link
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="shrink-0 text-xs text-ufo-text-subtle underline underline-offset-2 transition-colors hover:text-ufo-brand"
        aria-label={`${label} 내용 보기`}
      >
        보기
      </Link>
    </div>
  );
}
