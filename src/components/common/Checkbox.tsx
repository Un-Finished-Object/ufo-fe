type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
};

export default function Checkbox({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
}: CheckboxProps) {
  return (
    <label className="group relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-md border border-ufo-border-light bg-ufo-surface transition-colors group-hover:border-ufo-brand peer-checked:border-ufo-brand peer-checked:bg-ufo-brand peer-focus-visible:ring-2 peer-focus-visible:ring-ufo-brand-soft peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        <svg
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 text-white transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m3.25 8.1 3.05 3.05 6.45-6.45"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
