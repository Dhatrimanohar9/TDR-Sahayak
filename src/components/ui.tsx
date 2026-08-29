import type { ReactNode } from "react";

/** Small design-system primitives shared by all screens. */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-rail-100 bg-white p-5 shadow-[0_1px_3px_rgba(12,31,27,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger-ghost";

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
}) {
  const base =
    "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-rail-900 text-white hover:bg-rail-800 active:bg-rail-950 shadow-sm",
    secondary:
      "border-2 border-rail-900 bg-white text-rail-900 hover:bg-rail-50 active:bg-rail-100",
    ghost: "text-rail-700 hover:bg-rail-50 active:bg-rail-100",
    "danger-ghost": "text-red-700 hover:bg-red-50 active:bg-red-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "amber" | "green" | "red" | "rail";
}) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700 border-stone-200",
    amber: "bg-amber-soft text-amber-900 border-amber-200",
    green: "bg-rail-50 text-rail-800 border-rail-100",
    red: "bg-red-50 text-red-800 border-red-200",
    rail: "bg-rail-900 text-white border-rail-900",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Three-step progress indicator used across the flow (Step N of 3). */
export function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Describe", "Clarify", "Decide"];
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-rail-900 text-white"
                    : done
                      ? "bg-rail-600 text-white"
                      : "bg-rail-100 text-rail-700"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`hidden text-xs font-semibold sm:block ${
                  active ? "text-rail-900" : "text-stone-500"
                }`}
              >
                {label}
              </span>
            </div>
            {n < 3 && (
              <div
                aria-hidden
                className={`h-1 flex-1 rounded-full ${done ? "bg-rail-600" : "bg-rail-100"}`}
              />
            )}
          </div>
        );
      })}
      <span className="sr-only">Step {step} of 3</span>
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-rail-800 hover:bg-rail-100 active:bg-rail-600/20"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold leading-tight text-rail-950 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm leading-snug text-stone-600">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

export function FactRow({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <span className="text-sm text-stone-500">{label}</span>
      <span
        className={`text-right text-sm font-semibold ${warn ? "text-amber-800" : "text-rail-950"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] leading-relaxed text-stone-500 ${className}`}
    >
      Prototype using synthetic data. This application does not submit real TDR
      or refund claims.
    </p>
  );
}
