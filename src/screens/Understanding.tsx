import { Badge, Button, Card, FactRow, ScreenHeader, StepProgress } from "../components/ui";
import type { AnalysisResult, CaseFacts, FollowUpQuestion } from "../types";
import { keyInformation, journeyStatus, travelledLabel } from "../lib/flow";

export function Understanding({
  facts,
  analysis,
  question,
  questionsAnswered,
  onAnswer,
  onDone,
  onBack,
}: {
  facts: CaseFacts;
  analysis: AnalysisResult;
  question: FollowUpQuestion | null;
  questionsAnswered: number;
  onAnswer: (value: string) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const ready = question === null;

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Here’s what we understood"
        subtitle={analysis.summary}
        onBack={onBack}
      />
      <StepProgress step={2} />

      {analysis.error === "ai-failed" && (
        <Card className="mt-4 border-amber-200 bg-amber-soft">
          <p className="text-sm font-medium text-amber-900">
            We couldn’t understand every detail. Let’s clarify a few things.
          </p>
        </Card>
      )}

      <Card className="mt-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Extracted facts
          </h2>
          {analysis.source === "openai" ? (
            <Badge tone="rail">AI-assisted analysis</Badge>
          ) : (
            <Badge tone="amber">Prototype fallback analysis</Badge>
          )}
        </div>
        <div className="divide-y divide-rail-100">
          <FactRow label="Journey status" value={journeyStatus(facts)} />
          <FactRow
            label="Passenger travelled"
            value={travelledLabel(facts.passengerTravelled)}
            warn={facts.passengerTravelled === "unknown"}
          />
          <FactRow label="Key information" value={keyInformation(facts)} warn={keyInformation(facts).includes("not confirmed")} />
        </div>
      </Card>

      {question ? (
        <Card className="mt-4 border-rail-600/30">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rail-700">
            Follow-up question {questionsAnswered + 1}
          </p>
          <h3 className="text-lg font-bold leading-snug text-rail-950">
            {question.prompt}
          </h3>
          <div className="mt-4 grid gap-2">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onAnswer(opt.value)}
                className="flex min-h-[56px] items-center justify-between rounded-xl border-2 border-rail-100 bg-white px-4 py-3 text-left text-base font-medium text-stone-800 transition-colors hover:border-rail-600 hover:bg-rail-50 active:bg-rail-100"
              >
                {opt.label}
                <span aria-hidden className="text-rail-600">›</span>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="mt-4 border-rail-600/30 bg-rail-50/60">
          <p className="text-sm font-medium text-rail-900">
            ✓ Thanks — we have the facts we need. Ready to see your recommended
            next step.
          </p>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        <Button onClick={onDone}>
          {ready
            ? "Check my next step"
            : "I’m not sure — check my next step anyway"}
        </Button>
        {!ready && (
          <p className="text-center text-xs text-stone-500">
            It’s okay to skip — we’ll flag what’s missing and explain your
            options.
          </p>
        )}
      </div>
    </div>
  );
}

/** Brief interstitial shown while the AI interpretation layer runs. */
export function Analyzing() {
  return (
    <div className="animate-fade-up flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-rail-600/15" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rail-900">
          <span aria-hidden className="animate-track text-2xl">🚆</span>
        </div>
      </div>
      <h2 className="text-lg font-bold text-rail-950">
        Understanding what happened…
      </h2>
      <p className="mt-2 max-w-xs text-sm text-stone-600">
        Reading your description and working out which facts matter.
      </p>
    </div>
  );
}
