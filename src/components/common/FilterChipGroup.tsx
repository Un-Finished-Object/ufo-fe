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
};

export default function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  wrap = true,
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

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-7 whitespace-nowrap rounded-md px-3 text-xs font-semibold ${
                isActive
                  ? "bg-ufo-brand-soft text-ufo-text"
                  : "border border-ufo-border bg-transparent text-ufo-text-secondary"
              }`}
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
