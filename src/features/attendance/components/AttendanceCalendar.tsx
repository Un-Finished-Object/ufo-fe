"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import StarCircleIcon from "@/components/icons/StarCircleIcon";
import StateBlock from "@/components/common/StateBlock";
import ToastMessage from "@/components/common/ToastMessage";
import { userQueryKeys } from "@/features/auth/queries/userQueries";
import { buildApiUrl } from "@/lib/api/client";
import { AUTH_REQUIRED_MESSAGE } from "@/hooks/useAuthRequiredToast";
import { useToast } from "@/hooks/useToast";
import {
  createInvalidApiResponseError,
  isApiError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";

type StatusResponse = {
  data?: { rewarded?: Record<string, boolean> };
  error?: unknown;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function extractRewardedDates(rewarded: Record<string, boolean>) {
  return Object.entries(rewarded)
    .filter(([, isRewarded]) => isRewarded === true)
    .map(([date]) => date);
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AttendanceCalendar() {
  const queryClient = useQueryClient();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [monthDates, setMonthDates] = useState<string[]>([]);
  const [isFetchingMonth, setIsFetchingMonth] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [todayChecked, setTodayChecked] = useState<boolean | null>(null);
  const { showToast, toastMessage } = useToast();

  const attendedSet = new Set(monthDates);
  const isViewingCurrentMonth = viewYear === currentYear && viewMonth === currentMonth;
  const checkedInToday = todayChecked === true;

  // Fetch attendance status whenever the viewed month changes
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;
    setIsFetchingMonth(true);
    setMonthDates([]);

    const isCurrentMonthRequest = viewYear === currentYear && viewMonth === currentMonth;
    const requestedYear = viewYear;
    const requestedMonth = viewMonth + 1;
    const requestedMonthPrefix = `${requestedYear}-${String(requestedMonth).padStart(2, "0")}-`;

    const fetchStatus = async () => {
      try {
        const params = new URLSearchParams({
          year: String(requestedYear),
          month: String(requestedMonth).padStart(2, "0"),
        });

        const response = await fetchAuthenticated({
          input: buildApiUrl(`/v1/attendance/status?${params.toString()}`),
          init: {
            signal: controller.signal,
            cache: "no-store",
          },
        });

        if (!response.ok) {
          await throwApiError(response, "Failed to load attendance status.");
        }

        if (!isMounted) {
          if (isCurrentMonthRequest) setTodayChecked(false);
          return;
        }

        const payload = (await response.json()) as StatusResponse;
        if (payload.error) {
          throwApiPayloadError(payload.error, "Failed to load attendance status.");
        }

        if (!payload.data?.rewarded) {
          throw createInvalidApiResponseError("Failed to load attendance status.");
        }

        if (!isMounted) {
          if (isCurrentMonthRequest) setTodayChecked(false);
          return;
        }

        const dates = extractRewardedDates(payload.data.rewarded).filter((date) =>
          date.startsWith(requestedMonthPrefix),
        );

        setMonthDates(dates);
        if (isCurrentMonthRequest) {
          setTodayChecked(dates.includes(todayStr));
        }
      } catch (error) {
        if (isApiError(error, 401)) {
          showToast(AUTH_REQUIRED_MESSAGE);
        }

        if (isMounted && isCurrentMonthRequest) setTodayChecked(false);
        // ignore abort / network errors
      } finally {
        if (isMounted) setIsFetchingMonth(false);
      }
    };

    void fetchStatus();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentMonth, currentYear, showToast, todayStr, viewMonth, viewYear]);

  const handleCheckIn = async () => {
    if (checkedInToday || isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const response = await fetchAuthenticated({
        input: buildApiUrl("/v1/attendance/check"),
        init: {
          method: "POST",
        },
      });

      if (!response.ok) {
        await throwApiError(response, "Failed to check attendance.");
      }

      const payload = (await response.json()) as {
        data?: { date?: string; rewarded?: boolean; rewardAmount?: number; balance?: number };
        error?: unknown;
      };

      if (payload.error) {
        throwApiPayloadError(payload.error, "Failed to check attendance.");
      }

      if (payload.data?.rewarded !== true) {
        showToast("출석체크에 실패했어요. 잠시 후 다시 시도해주세요.");
        return;
      }

      if (typeof payload.data.balance === "number") {
        queryClient.setQueryData(userQueryKeys.wallet, payload.data.balance);
      } else {
        void queryClient.invalidateQueries({ queryKey: userQueryKeys.wallet });
      }

      setTodayChecked(true);
      if (isViewingCurrentMonth) {
        setMonthDates((prev) => (prev.includes(todayStr) ? prev : [...prev, todayStr]));
      } else {
        setViewYear(currentYear);
        setViewMonth(currentMonth);
      }
      showToast("출석체크 완료! 🎉");
    } catch (error) {
      showToast(
        isApiError(error, 401)
          ? AUTH_REQUIRED_MESSAGE
          : "출석체크에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsCheckingIn(false);
    }
  };

  const toDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) =>
    viewYear === currentYear &&
    viewMonth === currentMonth &&
    day === today.getDate();

  const isAttended = (day: number) => attendedSet.has(toDateStr(day));

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(currentYear, currentMonth, today.getDate());
    return d > t;
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const selectMonth = (month: number) => {
    setViewYear(pickerYear);
    setViewMonth(month);
    setShowPicker(false);
  };

  return (
    <>
      <div className="px-4 py-6">
        <div className="rounded-xl border border-ufo-brand bg-ufo-brand-pale px-4 py-5">
          {/* Month navigation header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ufo-brand hover:bg-ufo-brand-pale"
              aria-label="이전 달"
            >
              <ChevronLeft />
            </button>

            <button
              type="button"
              onClick={() => { setPickerYear(viewYear); setShowPicker(true); }}
              className="text-lg font-bold tracking-tight text-ufo-text"
              aria-label="연도·월 선택"
            >
              {viewYear}년 {MONTH_LABELS[viewMonth]}
            </button>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ufo-brand hover:bg-ufo-brand-pale"
              aria-label="다음 달"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Day of week labels */}
          <div className="mb-3 grid grid-cols-7 text-center text-xs font-semibold text-ufo-text-muted">
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={i === 0 ? "text-red-300" : i === 6 ? "text-blue-300" : ""}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {isFetchingMonth ? (
            <StateBlock type="loading" title="출석 정보를 불러오는 중입니다." variant="plain" />
          ) : (
            <div className="grid grid-cols-7 pb-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;

                const attended = isAttended(day);
                const todayCell = isToday(day);
                const future = isFuture(day);
                const dayOfWeek = idx % 7;

                return (
                  <div
                    key={day}
                    className="flex flex-col items-center gap-1 py-1"
                  >
                    <span
                      className={`text-sm font-medium leading-none ${
                        todayCell
                          ? "font-bold text-ufo-brand"
                          : future
                          ? "text-gray-300"
                          : dayOfWeek === 0
                          ? "text-red-300"
                          : dayOfWeek === 6
                          ? "text-blue-300"
                          : "text-ufo-text"
                      }`}
                    >
                      {day}
                    </span>
                    {attended ? (
                      <StarCircleIcon
                        circleClassName="text-ufo-credit"
                        starClassName="text-ufo-surface"
                        className="h-6 w-6"
                      />
                    ) : (
                      <span
                        className={`inline-block h-6 w-6 rounded-full border-2 ${
                          future ? "border-gray-200" : "border-ufo-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-ufo-text-muted">
            <span className="flex items-center gap-1.5">
              <StarCircleIcon
                circleClassName="text-ufo-credit"
                starClassName="text-ufo-surface"
                className="h-4 w-4"
              />
              출석 완료
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-ufo-border" />
              미출석
            </span>
          </div>
        </div>{/* end bordered calendar */}

        {/* Check-in button */}
        {(() => {
          const loadingStatus = todayChecked === null;
          const disabled = checkedInToday || isCheckingIn || loadingStatus;
          const label = checkedInToday
            ? "출석 완료"
            : loadingStatus || isCheckingIn
            ? "확인 중..."
            : "출석체크";
          const style = checkedInToday
            ? "bg-gray-100 text-ufo-text-muted"
            : disabled
            ? "bg-ufo-brand/60 text-white"
            : "bg-ufo-brand text-white";

          return (
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={disabled}
              className={`mt-6 h-14 w-full rounded-2xl text-base font-bold transition-colors disabled:cursor-not-allowed ${style}`}
            >
              {label}
            </button>
          );
        })()}
      </div>
      <ToastMessage message={toastMessage} />

      {/* Year / Month picker bottom sheet */}
      {showPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="연도·월 선택"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl bg-white px-4 pb-8 pt-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPickerYear((y) => y - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ufo-brand"
                aria-label="이전 연도"
              >
                <ChevronLeft />
              </button>
              <span className="text-lg font-bold text-ufo-text">{pickerYear}년</span>
              <button
                type="button"
                onClick={() => setPickerYear((y) => y + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ufo-brand"
                aria-label="다음 연도"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MONTH_LABELS.map((label, i) => {
                const isSelected = pickerYear === viewYear && i === viewMonth;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectMonth(i)}
                    className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                      isSelected ? "bg-ufo-brand text-white" : "bg-gray-100 text-ufo-text"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
