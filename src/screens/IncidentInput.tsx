import { useState } from "react";
import { Button, Card, Disclaimer, ScreenHeader, StepProgress } from "../components/ui";
import { DEMO_SCENARIOS } from "../data/scenarios";

export function IncidentInput({
  value,
  onChange,
  onContinue,
  onBack,
}: {
  value: string;
  onChange: (text: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [touched, setTouched] = useState(false);
  const empty = value.trim().length === 0;
  const showError = touched && empty;

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="What happened during your journey?"
        subtitle="Use your own words — a sentence or two is enough."
        onBack={onBack}
      />
      <StepProgress step={1} />

      <Card className="mt-5">
        <label
          htmlFor="incident"
          className="block text-sm font-semibold text-rail-950"
        >
          Your description
        </label>
        <textarea
          id="incident"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={5}
          aria-invalid={showError}
          aria-describedby={showError ? "incident-error" : undefined}
          placeholder="My train was delayed for several hours and I decided not to travel."
          className="mt-2 w-full rounded-xl border-2 border-rail-100 bg-rail-50/40 px-4 py-3 text-base leading-relaxed text-ink placeholder:text-stone-400 focus:border-rail-600 focus:outline-none"
        />
        {showError && (
          <p id="incident-error" className="mt-1.5 text-sm font-medium text-red-700">
            Please describe what happened, or tap a sample scenario below.
          </p>
        )}
      </Card>

      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-rail-950">
          Or try a sample scenario
        </p>
        <div className="grid gap-2">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setTouched(false);
                onChange(s.text);
              }}
              className={`flex min-h-[52px] items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                value === s.text
                  ? "border-rail-600 bg-rail-50 text-rail-950"
                  : "border-rail-100 bg-white text-stone-700 hover:border-rail-600/40 hover:bg-rail-50/60"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  value === s.text
                    ? "bg-rail-600 text-white"
                    : "bg-rail-50 text-rail-800"
                }`}
              >
                {value === s.text ? "✓" : s.id.charAt(0).toUpperCase()}
              </span>
              {s.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          onClick={() => {
            if (empty) {
              setTouched(true);
              return;
            }
            onContinue();
          }}
        >
          Continue
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
