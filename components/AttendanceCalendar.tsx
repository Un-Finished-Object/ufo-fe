"use client";

import { useRef, useState } from "react";
import StarCircleIcon from "@/components/icons/StarCircleIcon";
import ToastMessage from "@/components/ToastMessage";

type AttendanceCalendarProps = {
  attendedDates?: string[]; // "YYYY-MM-DD"
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

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

export default function AttendanceCalendar({ attendedDates = [] }: AttendanceCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [checkedInToday, setCheckedInToday] = useState(attendedDates.includes(todayStr));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCheckIn = () => {
    if (checkedInToday) {
      showToast("오늘 이미 출석하셨어요!");
      return;
    }
    // TODO: call API POST /v1/events/attendance
    setCheckedInToday(true);
    showToast("출석체크 완료! 🎉");
  };

  const attendedSet = new Set([...attendedDates, ...(checkedInToday ? [todayStr] : [])]);

  const toDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const isAttended = (day: number) => attendedSet.has(toDateStr(day));

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
        <div className="rounded-xl border border-[#ffa8a8] bg-[#fff1ed] px-4 py-5">
        {/* Month navigation header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#ffaba6] hover:bg-[#fff0ef]"
            aria-label="이전 달"
          >
            <ChevronLeft />
          </button>

          <button
            type="button"
            onClick={() => { setPickerYear(viewYear); setShowPicker(true); }}
            className="text-lg font-bold tracking-tight text-[#1f1f1f]"
            aria-label="연도·월 선택"
          >
            {viewYear}년 {MONTH_LABELS[viewMonth]}
          </button>

          <button
            type="button"
            onClick={goNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#ffaba6] hover:bg-[#fff0ef]"
            aria-label="다음 달"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Day of week labels */}
        <div className="mb-3 grid grid-cols-7 text-center text-xs font-semibold text-[#a4a4a4]">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={i === 0 ? "text-[#ff8a80]" : i === 6 ? "text-[#82b1ff]" : ""}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-y-2">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;

            const attended = isAttended(day);
            const todayCell = isToday(day);
            const future = isFuture(day);
            const dayOfWeek = idx % 7;

            let textColor = "text-[#1f1f1f]";
            if (future) textColor = "text-[#d0d0d0]";
            else if (dayOfWeek === 0) textColor = "text-[#ff8a80]";
            else if (dayOfWeek === 6) textColor = "text-[#82b1ff]";

            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span
                  className={`text-sm font-medium leading-none ${
                    todayCell
                      ? "font-bold text-[#ffaba6]"
                      : future
                      ? "text-[#d0d0d0]"
                      : dayOfWeek === 0
                      ? "text-[#ff8a80]"
                      : dayOfWeek === 6
                      ? "text-[#82b1ff]"
                      : "text-[#1f1f1f]"
                  }`}
                >
                  {day}
                </span>
                {attended ? (
                  <StarCircleIcon
                    circleColor="#48eaff"
                    starColor="#ffffff"
                    className="h-6 w-6"
                  />
                ) : (
                  <span
                    className={`inline-block h-6 w-6 rounded-full border-2 ${
                      future ? "border-[#eeeeee]" : "border-[#d9d9d9]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#a4a4a4]">
          <span className="flex items-center gap-1.5">
            <StarCircleIcon circleColor="#48eaff" starColor="#ffffff" className="h-4 w-4" />
            출석 완료
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-[#d9d9d9]" />
            미출석
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#ffaba6]">15</span>
            오늘
          </span>
        </div>

        </div>{/* end bordered calendar */}

        {/* Check-in button */}
        <button
          type="button"
          onClick={handleCheckIn}
          className={`mt-6 h-14 w-full rounded-2xl text-base font-bold transition-colors ${
            checkedInToday
              ? "bg-[#f5f5f5] text-[#a4a4a4]"
              : "bg-[#ffaba6] text-white"
          }`}
        >
          {checkedInToday ? "오늘 출석 완료 ✓" : "출석체크"}
        </button>
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
            {/* Year selector */}
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPickerYear((y) => y - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#ffaba6]"
                aria-label="이전 연도"
              >
                <ChevronLeft />
              </button>
              <span className="text-lg font-bold text-[#1f1f1f]">{pickerYear}년</span>
              <button
                type="button"
                onClick={() => setPickerYear((y) => y + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#ffaba6]"
                aria-label="다음 연도"
              >
                <ChevronRight />
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-4 gap-2">
              {MONTH_LABELS.map((label, i) => {
                const isSelected = pickerYear === viewYear && i === viewMonth;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectMonth(i)}
                    className={`rounded-xl py-3 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "bg-[#ffaba6] text-white"
                        : "bg-[#f5f5f5] text-[#1f1f1f]"
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
