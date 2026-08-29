import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import type { CaseFacts, DeadlineAssessment } from "../types";
import { formatJourneyDateTime, toLocalInputValue } from "../lib/riskEngine";
import { defaultJourneyDateTime } from "../lib/riskEngine";

const TIMELINE_STEPS = [
  "Journey incident",
  "Recommended action window",
  "Claim preparation",
  "Mock submission",
];

export function DeadlineRisk({
  facts,
  assessment,
  onJourneyDateTimeChange,
  onContinue,
  onBack,
}: {
  facts: CaseFacts;
  assessment: DeadlineAssessment;
  onJourneyDateTimeChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const riskTone =
    assessment.riskLevel === "low"
      ? "green"
      : assessment.riskLevel === "medium"
        ? "amber"
        : "red";

  // Which timeline node is active depends on the deadline status.
  const activeStep =
    assessment.status === "outside_window"
      ? 4
      : assessment.status === "window_closing"
        ? 2
        : 1;

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Time matters"
        subtitle="Refund-type claims are usually easiest to act on soon after the journey. Here is where you stand under the prototype’s demo rules."
        onBack={onBack}
      />

      <Card className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
              Risk level
            </p>
            <p className="mt-1 text-2xl font-extrabold capitalize text-rail-950">
              {assessment.riskLevel}
            </p>
          </div>
          <Badge tone={riskTone}>{assessment.statusLabel}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          {assessment.statusDetail}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Prototype rules — not live official deadlines. Please verify against
          the official process.
        </p>
      </Card>

      {/* Simple visual timeline */}
      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">Your claim journey</h2>
        <ol className="mt-4 space-y-0">
          {TIMELINE_STEPS.map((label, i) => {
            const done = i < activeStep - 1;
            const active = i === activeStep - 1;
            return (
              <li key={label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-rail-600 text-white"
                        : active
                          ? "bg-amber-signal text-rail-950"
                          : "bg-rail-100 text-rail-700"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className={`w-0.5 flex-1 ${done ? "bg-rail-600" : "bg-rail-100"}`}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p
                    className={`text-sm font-semibold ${active ? "text-rail-950" : done ? "text-rail-800" : "text-stone-500"}`}
                  >
                    {label}
                    {active && (
                      <span className="ml-2 rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                        You are here
                      </span>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Synthetic journey date/time selector (pre-filled) */}
      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">
          When was your journey scheduled?
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Pre-filled with synthetic data for the demo — adjust it to see how the
          risk changes.
        </p>
        <label htmlFor="journey-dt" className="sr-only">
          Journey date and time
        </label>
        <input
          id="journey-dt"
          type="datetime-local"
          value={toLocalInputValue(new Date(facts.journeyDateTime))}
          max={toLocalInputValue(new Date())}
          onChange={(e) => {
            const v = e.target.value;
            onJourneyDateTimeChange(
              v ? new Date(v).toISOString() : defaultJourneyDateTime(),
            );
          }}
          className="mt-3 w-full rounded-xl border-2 border-rail-100 bg-rail-50/40 px-4 py-3 text-base text-ink focus:border-rail-600 focus:outline-none"
        />
        <p className="mt-2 text-xs text-stone-500">
          Currently set to {formatJourneyDateTime(facts.journeyDateTime)}
          {assessment.elapsedNote && ` · about ${assessment.elapsedNote} ago`}
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        <Button onClick={onContinue}>Prepare my case</Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
