import { useState } from "react";
import { Badge, Button, Card, FactRow, ScreenHeader, StepProgress } from "../components/ui";
import type { AnalysisResult, CaseFacts, FollowUpQuestion, MissingFactKey } from "../types";
import { keyInformation, journeyStatus, travelledLabel } from "../lib/flow";
import { decide } from "../lib/decisionEngine";

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const radius = 37;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - confidence * circumference;

  let colorClass = "text-red-500";
  let labelClass = "text-red-700";
  let labelText = "More details needed";

  if (confidence >= 0.8) {
    colorClass = "text-rail-600";
    labelClass = "text-rail-700";
    labelText = "High confidence";
  } else if (confidence >= 0.55) {
    colorClass = "text-amber-signal";
    labelClass = "text-amber-800";
    labelText = "Moderate — a few details will help";
  }

  return (
    <div className="flex shrink-0 flex-col items-center text-center w-28">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            className="stroke-rail-100"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`animate-gauge transition-all duration-500 ${colorClass}`}
            style={{
              "--gauge-circumference": circumference,
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-rail-950">{percent}%</span>
        </div>
      </div>
      <span
        className={`mt-1.5 text-[10px] font-medium leading-tight ${labelClass}`}
      >
        {labelText}
      </span>
    </div>
  );
}

export function Understanding({
  facts,
  analysis,
  question,
  questionsAnswered,
  onAnswer,
  onCorrectFact,
  onDone,
  onBack,
}: {
  facts: CaseFacts;
  analysis: AnalysisResult;
  question: FollowUpQuestion | null;
  questionsAnswered: number;
  onAnswer: (value: string) => void;
  onCorrectFact?: (key: MissingFactKey, value: string) => void;
  onDone: () => void;
  onBack: () => void;
}) {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [lastChange, setLastChange] = useState<{
    factKey: string;
    factName: string;
    beforeTravelled: string;
    beforeCompleted: string;
    beforeScenarioCode: string;
    beforeScenarioTitle: string;
    beforeAction: string;
  } | null>(null);

  const isTravelUncertain = facts.passengerTravelled === "unknown";
  const ready = question === null && !isTravelUncertain;
  const currentDec = decide(facts);

  const handleCorrection = (key: MissingFactKey, value: string) => {
    const factNameMap: Record<string, string> = {
      passengerTravelled: "Travel Status",
      passengerBoarded: "Boarding Status",
      journeyCompleted: "Journey Completion",
      delayDuration: "Delay Duration",
      disruptionType: "Disruption Type",
      cancelledBeforeDeparture: "Cancellation Status",
      journeyDate: "Scheduled Journey Date",
    };
    setLastChange({
      factKey: key,
      factName: factNameMap[key] || key,
      beforeTravelled: facts.passengerTravelled === true ? "Yes" : facts.passengerTravelled === false ? "No" : "Unconfirmed",
      beforeCompleted: facts.passengerTravelled === false ? "Not applicable" : facts.journeyCompleted === true ? "Yes" : facts.journeyCompleted === false ? "No" : "Unconfirmed",
      beforeScenarioCode: currentDec.scenario,
      beforeScenarioTitle: currentDec.scenarioTitle,
      beforeAction: currentDec.recommendedAction,
    });
    if (onCorrectFact) {
      onCorrectFact(key, value);
    } else {
      onAnswer(value);
    }
  };

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Here’s what we understood"
        subtitle="Review what we extracted from your story before seeing your recommended next step."
        onBack={onBack}
        right={<ConfidenceMeter confidence={analysis.confidence} />}
      />
      <StepProgress step={showCorrection || lastChange !== null ? 3 : 2} />

      {/* Before vs After Hero Rule Comparison Card */}
      {lastChange && (
        <div className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-50/95 p-4 shadow-lg animate-fade-up">
          <div className="flex items-center justify-between border-b border-amber-300 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-700"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                Hero Correction Applied: {lastChange.factName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastChange.beforeScenarioCode !== currentDec.scenario && (
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-950 border border-amber-400">
                  Scenario {lastChange.beforeScenarioCode} → {currentDec.scenario}
                </span>
              )}
              <button
                type="button"
                onClick={() => setLastChange(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold px-1"
                aria-label="Dismiss correction comparison"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* BEFORE CORRECTION */}
            <div className="rounded-xl border border-stone-300 bg-white p-3 text-xs shadow-2xs">
              <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>BEFORE CORRECTION</span>
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold text-stone-700">Scenario {lastChange.beforeScenarioCode}</span>
              </p>
              <div className="space-y-1 text-stone-700">
                <p>• Travelled: <strong className="text-stone-950">{lastChange.beforeTravelled}</strong></p>
                <p>• Journey completed: <strong className="text-stone-950">{lastChange.beforeCompleted}</strong></p>
                <p className="mt-1.5 font-bold text-rail-950 border-t border-stone-100 pt-1 leading-snug">
                  {lastChange.beforeScenarioTitle}
                </p>
              </div>
            </div>

            {/* AFTER CORRECTION */}
            <div className="rounded-xl border-2 border-rail-800 bg-rail-900 text-white p-3 text-xs shadow-md">
              <p className="text-[10px] font-black text-amber-signal uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>AFTER CORRECTION</span>
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-signal">Scenario {currentDec.scenario}</span>
              </p>
              <div className="space-y-1 text-rail-100">
                <p>• Travelled: <strong className="text-white">{facts.passengerTravelled === true ? "Yes" : facts.passengerTravelled === false ? "No" : "Unconfirmed"}</strong></p>
                <p>• Journey completed: <strong className="text-white">{facts.passengerTravelled === false ? "Not applicable" : facts.journeyCompleted === true ? "Yes" : facts.journeyCompleted === false ? "No" : "Unconfirmed"}</strong></p>
                <p className="mt-1.5 font-bold text-amber-signal border-t border-white/15 pt-1 leading-snug">
                  {currentDec.scenarioTitle}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-amber-100/90 px-3.5 py-2.5 text-xs font-black text-amber-950 flex items-center gap-2 border border-amber-300 shadow-2xs">
            <span className="text-base">⚖️</span>
            <span className="leading-snug">
              The recommendation changed because you corrected {lastChange.factKey === "passengerTravelled" ? "whether you travelled" : `your ${lastChange.factName.toLowerCase()}`}.
            </span>
          </div>
        </div>
      )}

      {/* Primary Display: One-sentence plain-language summary first */}
      <Card className="mt-5 border-rail-600/30 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-rail-700">
            Plain-Language Summary
          </p>
          <Badge tone={analysis.source === "openai" ? "rail" : "amber"}>
            {analysis.source === "openai" ? "AI Extracted" : "Fallback Parser"}
          </Badge>
        </div>
        <p className="mt-2 text-base font-semibold leading-relaxed text-rail-950">
          “{analysis.summary}”
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Extracted from: <span className="italic">“{facts.incidentText.length > 80 ? facts.incidentText.slice(0, 77) + "…" : facts.incidentText}”</span>
        </p>
      </Card>

      {/* Uncertainty State (Requirement D): If passenger travel is unknown */}
      {isTravelUncertain && (
        <Card className="mt-4 border-amber-300 bg-amber-soft">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-signal text-xs font-extrabold text-rail-950">
              !
            </span>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                We need one more detail
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                We cannot determine which refund rule applies until we know whether you travelled on this ticket. Indian Railways has completely different procedures for passengers who did not travel versus those who experienced en-route disruption.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Active Focused Question (if missing facts exist) */}
      {question && (
        <Card className="mt-4 border-2 border-rail-600/40 bg-white">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rail-700">
            Clarification Question {questionsAnswered + 1}
          </p>
          <h3 className="text-base font-bold leading-snug text-rail-950">
            {question.prompt}
          </h3>
          <div className="mt-3 grid gap-2">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onAnswer(opt.value)}
                className="flex min-h-[52px] items-center justify-between rounded-xl border-2 border-rail-100 bg-white px-4 py-2.5 text-left text-sm font-semibold text-stone-800 transition-colors hover:border-rail-600 hover:bg-rail-50 active:bg-rail-100"
              >
                {opt.label}
                <span aria-hidden className="text-rail-600 font-bold">›</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Toggle Controls: Full Details & Fact Correction */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setShowFullDetails((prev) => !prev)}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rail-200 bg-white px-3 py-2 text-xs font-bold text-rail-800 transition-colors hover:bg-rail-50"
        >
          <span>{showFullDetails ? "Hide full details" : "See full details"}</span>
          <span aria-hidden className="text-stone-400">{showFullDetails ? "▴" : "▾"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCorrection((prev) => !prev)}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rail-200 bg-white px-3 py-2 text-xs font-bold text-rail-800 transition-colors hover:bg-rail-50"
        >
          <span>✏️ {showCorrection ? "Close corrections" : "Correct my details"}</span>
          <span aria-hidden className="text-stone-400">{showCorrection ? "▴" : "▾"}</span>
        </button>
      </div>

      {/* Hidden behind "See full details" (Requirement B) */}
      {showFullDetails && (
        <Card className="mt-3 animate-fade-up border-rail-100 bg-white">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Detailed Extracted Fields
            </h3>
            <span className="text-xs font-semibold text-stone-600">
              Confidence: {Math.round(analysis.confidence * 100)}%
            </span>
          </div>
          <div className="divide-y divide-rail-100 text-sm">
            <FactRow label="Journey status" value={journeyStatus(facts)} />
            <FactRow
              label="Travel status"
              value={travelledLabel(facts.passengerTravelled)}
              warn={facts.passengerTravelled === "unknown"}
            />
            <FactRow
              label="Journey completion"
              value={
                facts.journeyCompleted === true
                  ? "Completed full journey"
                  : facts.journeyCompleted === false
                    ? "Incomplete / Disrupted midway"
                    : "Not confirmed"
              }
              warn={facts.journeyCompleted === false}
            />
            <FactRow
              label="Partial journey"
              value={
                facts.partialJourney === true
                  ? "Yes, travelled part of route"
                  : facts.partialJourney === false
                    ? "No"
                    : "Not confirmed"
              }
            />
            <FactRow
              label="Disruption type"
              value={facts.disruptionMentioned || "None identified"}
            />
            <FactRow
              label="Delay duration"
              value={
                facts.delayDuration === "gt6h"
                  ? "More than 6 hours"
                  : facts.delayDuration === "3to6h"
                    ? "3 to 6 hours"
                    : facts.delayDuration === "lt3h"
                      ? "Less than 3 hours"
                      : "Not confirmed"
              }
              warn={facts.delayDuration === "unsure"}
            />
            <FactRow
              label="Ticket cancellation"
              value={
                facts.cancelledBeforeDeparture === true
                  ? "Cancelled before departure"
                  : facts.cancelledBeforeDeparture === false
                    ? "Not cancelled before departure"
                    : "Not recorded"
              }
            />
            <FactRow
              label="Missing information"
              value={
                analysis.missingFacts.length > 0
                  ? `${analysis.missingFacts.length} item(s) needed`
                  : "None"
              }
              warn={analysis.missingFacts.length > 0}
            />
          </div>
          <p className="mt-3 text-xs text-stone-600 font-medium">
            Key indicators: {keyInformation(facts)}
          </p>
        </Card>
      )}

      {/* "Correct my details" Interactive Panel (Requirement C) */}
      {showCorrection && (
        <Card className="mt-3 animate-fade-up border-amber-200 bg-amber-50/40">
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rail-950">
                Correct important facts before deciding
              </h3>
              <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                AI interprets · Passenger corrects · Rules decide
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-600">
              Tap any option to immediately update how the rule engine evaluates your claim.
            </p>
            <div className="mt-2 rounded-lg bg-amber-100/90 p-2.5 text-[11px] font-extrabold text-amber-950 border border-amber-300 flex items-center gap-2 shadow-2xs">
              <span className="text-sm">⚡</span>
              <span>
                <strong>Demo Shortcut:</strong> Tap <em>“No, did not travel”</em> below to see the recommendation switch from <strong>Scenario C</strong> (Partial Journey) to <strong>Scenario A</strong> (Delayed Train) in real time.
              </span>
            </div>
          </div>

          {/* Live Recalculation Summary Box */}
          <div className="mb-4 rounded-xl bg-rail-900 text-white p-3 shadow-sm border border-rail-800">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-signal uppercase tracking-wider mb-1">
              <span>⚡ Live Rule Engine Evaluation</span>
              <span>Scenario {decide(facts).scenario}</span>
            </div>
            <p className="text-xs font-extrabold text-white">
              {decide(facts).scenarioTitle}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-rail-100/90 italic">
              “{decide(facts).recommendedAction}”
            </p>
          </div>

          <div className="space-y-3.5">
            {/* 1. Did you travel? */}
            <div>
              <p className="text-xs font-semibold text-stone-700 mb-1.5">
                1. Did you travel on this ticket?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCorrection("passengerTravelled", "yes")}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    facts.passengerTravelled === true
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.passengerTravelled === true ? "✓ Yes, travelled" : "Yes, travelled"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("passengerTravelled", "no")}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    facts.passengerTravelled === false
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.passengerTravelled === false ? "✓ No, did not travel" : "No, did not travel"}
                </button>
              </div>
            </div>

            {/* 2. Journey completed / boarded? */}
            <div>
              <p className="text-xs font-semibold text-stone-700 mb-1.5">
                2. Were you able to board the train?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCorrection("passengerBoarded", "yes")}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    facts.passengerBoarded === true
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.passengerBoarded === true ? "✓ Yes, boarded" : "Yes, boarded"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("passengerBoarded", "no")}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    facts.passengerBoarded === false
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.passengerBoarded === false ? "✓ No, could not board" : "No, could not board"}
                </button>
              </div>
            </div>

            {/* Journey completion status */}
            <div>
              <p className="text-xs font-semibold text-stone-700 mb-1.5">
                3. Did you complete the entire journey to your destination?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCorrection("journeyCompleted", "yes")}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    facts.journeyCompleted === true
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.journeyCompleted === true ? "✓ Yes, completed" : "Yes, completed"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("journeyCompleted", "no")}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                    facts.journeyCompleted === false || facts.partialJourney === true
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.journeyCompleted === false || facts.partialJourney === true
                    ? "✓ No, ended halfway"
                    : "No, ended halfway"}
                </button>
              </div>
            </div>

            {/* 4. Delay duration */}
            <div>
              <p className="text-xs font-semibold text-stone-700 mb-1.5">
                4. Approximate delay duration:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCorrection("delayDuration", "gt6h")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors ${
                    facts.delayDuration === "gt6h"
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.delayDuration === "gt6h" ? "✓ > 6 hours" : "> 6 hours"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("delayDuration", "3to6h")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors ${
                    facts.delayDuration === "3to6h"
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.delayDuration === "3to6h" ? "✓ 3–6 hours" : "3–6 hours"}
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("delayDuration", "lt3h")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors ${
                    facts.delayDuration === "lt3h"
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  {facts.delayDuration === "lt3h" ? "✓ < 3 hours" : "< 3 hours"}
                </button>
              </div>
            </div>

            {/* 4. Disruption type */}
            <div>
              <p className="text-xs font-semibold text-stone-700 mb-1.5">
                4. Primary disruption:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCorrection("disruptionType", "train_cancelled")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-semibold text-left transition-colors ${
                    facts.disruptionMentioned === "Train cancelled"
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  Train cancelled
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("disruptionType", "terminated_early")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-semibold text-left transition-colors ${
                    facts.disruptionMentioned?.includes("terminated")
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  Terminated early
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("disruptionType", "missed_connection")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-semibold text-left transition-colors ${
                    facts.disruptionMentioned?.includes("Missed")
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  Missed connection
                </button>
                <button
                  type="button"
                  onClick={() => handleCorrection("disruptionType", "other")}
                  className={`min-h-[38px] rounded-lg border px-2 py-1.5 text-xs font-semibold text-left transition-colors ${
                    facts.disruptionMentioned === "Other disruption"
                      ? "border-rail-600 bg-rail-900 text-white"
                      : "border-rail-200 bg-white text-stone-800 hover:bg-rail-50"
                  }`}
                >
                  Other disruption
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Action Button */}
      <div className="mt-6 space-y-2">
        <Button onClick={onDone}>
          {ready
            ? "Your recommended next step →"
            : isTravelUncertain
              ? "Check preliminary recommendation anyway"
              : "Check my next step"}
        </Button>
        {!ready && (
          <p className="text-center text-xs text-stone-500">
            {isTravelUncertain
              ? "Recommendation will be marked as provisional until travel status is confirmed."
              : "You can skip — the deterministic engine will identify remaining missing facts."}
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
