"use client";

type SegmentedSwitchOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedSwitchProps<T extends string> = {
  options: readonly SegmentedSwitchOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
}: SegmentedSwitchProps<T>) {
  return (
    <div className="rounded-md bg-ufo-brand-soft p-1">
      <div className="flex gap-1">
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-8 flex-1 rounded-md text-xs font-semibold ${
                isActive
                  ? "bg-ufo-surface text-ufo-text"
                  : "bg-transparent text-ufo-text-muted"
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
