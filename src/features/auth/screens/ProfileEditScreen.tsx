"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import MobileShell from "@/components/layout/MobileShell";
import TopBar from "@/components/navigation/TopBar";
import { useMeQuery } from "@/features/auth/hooks/useMeQuery";
import { userQueryKeys, type UserProfile } from "@/features/auth/queries/userQueries";
import { updateMyProfile } from "@/features/auth/services/updateMyProfile";
import { useAuthRequiredToast } from "@/hooks/useAuthRequiredToast";
import { isApiError } from "@/lib/api/ApiError";
import {
  IMAGE_UPLOAD_ACCEPT,
  uploadImageFiles,
  type UploadedImageFile,
} from "@/services/images/uploadImageFiles";

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftNickname, setDraftNickname] = useState<string | null>(null);
  const [draftProfileImage, setDraftProfileImage] = useState<UploadedImageFile | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const { showAuthRequiredToast, showToast, toastMessage } = useAuthRequiredToast(2000);

  useEffect(() => {
    return () => {
      if (previewImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  useEffect(() => {
    if (!meQuery.isPending && !meQuery.isError && !meQuery.data) {
      showAuthRequiredToast();
    }
  }, [meQuery.data, meQuery.isError, meQuery.isPending, showAuthRequiredToast]);

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const [uploadedImage] = await uploadImageFiles({ files: [file], purpose: "PROFILE" });

      if (!uploadedImage) {
        throw new Error("프로필 이미지 업로드에 실패했어요.");
      }

      return uploadedImage;
    },
    onSuccess: (uploadedImage) => {
      setDraftProfileImage(uploadedImage);
    },
    onError: (error) => {
      setPreviewImageUrl(null);
      setDraftProfileImage(null);

      if (isApiError(error, 401)) {
        showAuthRequiredToast();
        return;
      }

      showToast(error instanceof Error ? error.message : "프로필 이미지 업로드에 실패했어요.");
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: ({
      nextNickname,
      nextProfileImage,
      shouldUpdateNickname,
      shouldUpdateProfileImage,
    }: {
      nextNickname: string;
      nextProfileImage: UploadedImageFile;
      shouldUpdateNickname: boolean;
      shouldUpdateProfileImage: boolean;
    }) =>
      updateMyProfile({
        userName: shouldUpdateNickname ? nextNickname : null,
        profileImageKey: shouldUpdateProfileImage ? nextProfileImage.imageKey : null,
      }),
    onSuccess: (result, variables) => {
      queryClient.setQueryData<UserProfile | null>(userQueryKeys.me, (previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          nickname: result.nickname ?? previous.nickname,
          profileImage:
            result.profileImage ??
            (variables.shouldUpdateProfileImage
              ? variables.nextProfileImage.imageUrl
              : previous.profileImage),
        };
      });

      router.replace("/my");
    },
    onError: (error) => {
      if (isApiError(error, 401)) {
        showAuthRequiredToast();
        return;
      }

      showToast("닉네임 저장에 실패했어요.");
    },
  });

  const nickname = draftNickname ?? meQuery.data?.nickname ?? "";
  const normalizedNickname = nickname.trim();
  const initialNickname = meQuery.data?.nickname ?? "";
  const initialProfileImage = meQuery.data?.profileImage ?? "";
  const nextProfileImage = useMemo(
    () =>
      draftProfileImage ?? {
        imageKey: "",
        imageUrl: initialProfileImage,
      },
    [draftProfileImage, initialProfileImage],
  );
  const hasNicknameChanged = normalizedNickname !== initialNickname;
  const hasProfileImageChanged = nextProfileImage.imageUrl !== initialProfileImage;
  const isSaveDisabled =
    meQuery.isPending ||
    saveProfileMutation.isPending ||
    uploadProfileImageMutation.isPending ||
    normalizedNickname.length === 0 ||
    (!hasNicknameChanged && !hasProfileImageChanged);
  const profileImageSrc =
    previewImageUrl ?? (nextProfileImage.imageUrl.trim() ? nextProfileImage.imageUrl : null);
  const profileImageAlt = `${normalizedNickname || meQuery.data?.nickname || "회원"} 프로필 이미지`;

  const handleRetry = useCallback(() => {
    void meQuery.refetch();
  }, [meQuery]);

  const handleProfileImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleProfileImageChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setDraftProfileImage(null);
    setPreviewImageUrl(URL.createObjectURL(file));
    uploadProfileImageMutation.mutate(file);
  }, [uploadProfileImageMutation]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSaveDisabled) {
        return;
      }

      saveProfileMutation.mutate({
        nextNickname: normalizedNickname,
        nextProfileImage,
        shouldUpdateNickname: hasNicknameChanged,
        shouldUpdateProfileImage: hasProfileImageChanged,
      });
    },
    [
      hasNicknameChanged,
      hasProfileImageChanged,
      isSaveDisabled,
      nextProfileImage,
      normalizedNickname,
      saveProfileMutation,
    ],
  );

  if (meQuery.isPending) {
    return (
      <MobileShell>
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            title="프로필 수정"
            showBottomBorder
          />
          <StateBlock type="loading" title="프로필 정보를 준비하고 있어요." />
      </MobileShell>
    );
  }

  if (meQuery.isError) {
    return (
      <MobileShell>
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            title="프로필 수정"
            showBottomBorder
          />
          <StateBlock
            type="error"
            title="프로필 정보를 불러오지 못했어요."
            description="잠시 후 다시 시도해 주세요."
            actionLabel="다시 시도"
            onAction={handleRetry}
          />
      </MobileShell>
    );
  }

  if (!meQuery.data) {
    return <ToastMessage message={toastMessage} />;
  }

  return (
    <>
      <MobileShell surfaceClassName="pb-8">
          <TopBar
            left="back"
            onLeftClick={() => router.back()}
            title="프로필 수정"
            showBottomBorder
          />

          <section className="px-6">
            <form onSubmit={handleSubmit} className="pt-8">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleProfileImageClick}
                  disabled={uploadProfileImageMutation.isPending}
                  aria-label="프로필 이미지 변경"
                  className="relative h-28 w-28 overflow-hidden rounded-full bg-ufo-brand-pale shadow-[0_2px_10px_rgba(0,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {profileImageSrc ? (
                    <Image
                      src={profileImageSrc}
                      loader={({ src }) => src}
                      unoptimized
                      width={112}
                      height={112}
                      alt={profileImageAlt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-ufo-brand">
                      {(normalizedNickname || meQuery.data.nickname || "회원").charAt(0)}
                    </span>
                  )}

                  <span className="absolute inset-x-0 bottom-0 bg-ufo-brand py-2 text-xs font-semibold text-white">
                    {uploadProfileImageMutation.isPending ? "업로드 중" : "변경"}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  onChange={handleProfileImageChange}
                  className="sr-only"
                  aria-label="프로필 이미지 선택"
                />
              </div>

              <div className="mt-9">
                <label htmlFor="email" className="text-sm font-semibold text-ufo-text-subtle">
                  이메일
                </label>
                <div className="mt-2 rounded-2xl border border-ufo-border bg-ufo-bg px-4 py-3">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={meQuery.data.email}
                    readOnly
                    className="w-full bg-transparent text-base font-medium text-ufo-text-secondary outline-none"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="nickname" className="text-sm font-semibold text-ufo-text-subtle">
                  닉네임
                </label>
                <div className="mt-2 rounded-2xl border border-ufo-border bg-white px-4 py-3 focus-within:border-ufo-brand">
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
              </div>

              <button
                type="submit"
                disabled={isSaveDisabled}
                className={`mt-8 w-full rounded-xl px-4 py-3.5 text-base font-semibold transition ${
                  isSaveDisabled
                    ? "bg-ufo-border text-ufo-text-dim"
                    : "bg-ufo-brand text-white"
                }`}
              >
                {saveProfileMutation.isPending ? "저장 중..." : "저장하기"}
              </button>
            </form>
          </section>
      </MobileShell>

      <ToastMessage message={toastMessage} />
    </>
  );
}
