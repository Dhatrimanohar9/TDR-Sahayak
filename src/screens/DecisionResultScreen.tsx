import { Badge, Button, Card, ScreenHeader, StepProgress } from "../components/ui";
import type { CaseFacts, DecisionResult } from "../types";
import { preliminaryRisk } from "../lib/riskEngine";

export function DecisionResultScreen({
  facts,
  decision,
  onCheckDeadline,
  onBack,
}: {
  facts: CaseFacts;
  decision: DecisionResult;
  onCheckDeadline: () => void;
  onBack: () => void;
}) {
  const risk = preliminaryRisk(decision.riskLevel);

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Based on what you told us"
        subtitle={`Prototype scenario ${decision.scenario} · ${decision.classification}`}
        onBack={onBack}
        right={<Badge tone="rail">{decision.scenarioTitle}</Badge>}
      />
      <StepProgress step={3} />

      {/* Result card */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-rail-900 text-white shadow-md">
        <div className="border-b border-white/10 bg-rail-800/60 px-5 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-signal">
            Recommended next step
          </p>
        </div>
        <div className="px-5 py-5">
          <p className="text-lg font-bold leading-snug">
            {decision.recommendedAction}
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-3">
            <span
              aria-hidden
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                decision.riskLevel === "low"
                  ? "bg-emerald-400"
                  : decision.riskLevel === "medium"
                    ? "bg-amber-signal"
                    : "bg-red-400"
              }`}
            />
            <p className="text-sm leading-snug text-rail-100">
              <span className="font-bold text-white">Timing risk: {risk.label}.</span>{" "}
              {risk.note}
            </p>
          </div>
        </div>
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">Why we think this</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          {decision.explanation}
        </p>
        <ul className="mt-3 space-y-1.5">
          <li className="text-sm text-stone-600">
            • Journey status: <span className="font-semibold text-rail-950">{decision.scenarioTitle}</span>
          </li>
          {facts.delayDuration !== "unsure" && (
            <li className="text-sm text-stone-600">
              • Delay reported:{" "}
              <span className="font-semibold text-rail-950">
                {facts.delayDuration === "gt6h"
                  ? "more than 6 hours"
                  : facts.delayDuration === "3to6h"
                    ? "3–6 hours"
                    : "less than 3 hours"}
              </span>
            </li>
          )}
          <li className="text-sm text-stone-600">
            • Passenger travelled:{" "}
            <span className="font-semibold text-rail-950">
              {facts.passengerTravelled === true
                ? "Yes"
                : facts.passengerTravelled === false
                  ? "No"
                  : "Not confirmed"}
            </span>
          </li>
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          Based on the information provided. This prototype does not guarantee
          eligibility — please verify against the official process.
        </p>
      </Card>

      {decision.missingInformation.length > 0 && (
        <Card className="mt-4">
          <h2 className="text-base font-bold text-rail-950">
            Information still needed
          </h2>
          <ul className="mt-2 space-y-1.5">
            {decision.missingInformation.map((m) => (
              <li key={m} className="flex items-start gap-2 text-sm text-stone-700">
                <span aria-hidden className="mt-0.5 text-amber-signal">⚠</span>
                {m}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">
          What you should check next
        </h2>
        <ul className="mt-3 space-y-2.5">
          {decision.checklist.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-rail-600/40"
              />
              <span className="text-sm leading-snug text-stone-700">{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6">
        <Button onClick={onCheckDeadline}>Check deadline and risk</Button>
      </div>
    </div>
  );
}
