type FilterChipOption<T extends string> = {
  label: string;
  value: T;
};

type FilterChipGroupProps<T extends string> = {
  label?: string;
  options: readonly FilterChipOption<T>[];
  value: T | null | "";
  onChange: (value: T) => void;
  wrap?: boolean;
  variant?: "primary" | "secondary";
};

export default function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  wrap = true,
  variant = "primary",
}: FilterChipGroupProps<T>) {
  return (
    <section>
      {label ? <h2 className="text-sm font-semibold text-ufo-text">{label}</h2> : null}
      <div
        className={`${label ? "mt-3" : ""} flex items-center gap-2 ${
          wrap ? "flex-wrap" : "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }`}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          const chipClassName =
            variant === "secondary"
              ? isActive
                ? "h-6 border border-ufo-brand bg-ufo-brand-soft px-2.5 text-[11px] text-ufo-text"
                : "h-6 border border-ufo-brand-soft bg-ufo-surface px-2.5 text-[11px] text-ufo-text-secondary"
              : isActive
                ? "h-7 bg-ufo-brand-soft px-3 text-xs text-ufo-text"
                : "h-7 border border-ufo-border bg-transparent px-3 text-xs text-ufo-text-secondary";

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`whitespace-nowrap rounded-md font-semibold ${chipClassName}`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
