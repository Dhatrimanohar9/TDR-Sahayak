import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import type { CaseFacts, DecisionResult, MissingFactKey } from "../types";
import { FOLLOW_UP_QUESTIONS } from "../data/scenarios";
import { journeyStatus, keyInformation, travelledLabel } from "../lib/flow";
import { formatJourneyDateTime } from "../lib/riskEngine";

const EDITABLE: MissingFactKey[] = [
  "passengerTravelled",
  "passengerBoarded",
  "delayDuration",
  "cancelledBeforeDeparture",
  "disruptionType",
];

function factLabel(key: MissingFactKey, facts: CaseFacts): string {
  switch (key) {
    case "passengerTravelled":
      return travelledLabel(facts.passengerTravelled);
    case "passengerBoarded":
      return travelledLabel(facts.passengerBoarded);
    case "delayDuration":
      return facts.delayDuration === "gt6h"
        ? "More than 6 hours"
        : facts.delayDuration === "3to6h"
          ? "3–6 hours"
          : facts.delayDuration === "lt3h"
            ? "Less than 3 hours"
            : "Not confirmed";
    case "cancelledBeforeDeparture":
      return travelledLabel(facts.cancelledBeforeDeparture);
    case "disruptionType":
      return facts.disruptionMentioned ?? "Not recorded";
    default:
      return "—";
  }
}

export function CasePreparation({
  facts,
  decision,
  editingKey,
  onEditKey,
  onAnswerChange,
  onCreateClaim,
  onBack,
}: {
  facts: CaseFacts;
  decision: DecisionResult;
  editingKey: MissingFactKey | null;
  onEditKey: (key: MissingFactKey | null) => void;
  onAnswerChange: (key: MissingFactKey, value: string) => void;
  onCreateClaim: () => void;
  onBack: () => void;
}) {
  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Your case is ready to review"
        subtitle="Check the details below. You can correct anything before the mock claim is created."
        onBack={onBack}
      />

      <Card>
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
          Incident summary
        </h2>
        <p className="mt-2 border-l-4 border-rail-600/30 pl-3 text-sm italic leading-relaxed text-stone-700">
          “{facts.incidentText}”
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="rail">{decision.scenarioTitle}</Badge>
          <Badge tone="green">{journeyStatus(facts)}</Badge>
          <Badge tone="amber">{formatJourneyDateTime(facts.journeyDateTime)}</Badge>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-rail-950">Key facts</h2>
          {editingKey && (
            <button
              onClick={() => onEditKey(null)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-100"
            >
              Close editor
            </button>
          )}
        </div>
        <div className="mt-2 divide-y divide-rail-100">
          {EDITABLE.map((key) => (
            <div key={key} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-stone-500">
                  {questionLabel(key)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-right text-sm font-semibold text-rail-950">
                    {factLabel(key, facts)}
                  </span>
                  <button
                    onClick={() => onEditKey(editingKey === key ? null : key)}
                    aria-label={`Edit ${questionLabel(key)}`}
                    className="rounded-lg bg-rail-50 px-2.5 py-1 text-xs font-bold text-rail-800 hover:bg-rail-100"
                  >
                    {editingKey === key ? "Done" : "Edit"}
                  </button>
                </span>
              </div>
              {editingKey === key && (
                <div className="mt-2 grid gap-1.5">
                  {FOLLOW_UP_QUESTIONS[key].options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onAnswerChange(key, opt.value);
                        onEditKey(null);
                      }}
                      className="min-h-[44px] rounded-lg border-2 border-rail-100 px-3 py-2 text-left text-sm font-medium text-stone-800 hover:border-rail-600 hover:bg-rail-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-stone-500">Journey scheduled</span>
              <span className="text-right text-sm font-semibold text-rail-950">
                {formatJourneyDateTime(facts.journeyDateTime)}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-semibold">Key information: </span>
          {keyInformation(facts)}
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">
          Recommended next step
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-rail-900">
          {decision.recommendedAction}
        </p>
        {decision.missingInformation.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-bold text-rail-950">
              Information still needed
            </h3>
            <ul className="mt-1.5 space-y-1">
              {decision.missingInformation.map((m) => (
                <li key={m} className="text-sm text-stone-600">
                  • {m}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <div className="mt-6 space-y-3">
        <Button onClick={onCreateClaim}>Create mock claim</Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}

function questionLabel(key: MissingFactKey): string {
  switch (key) {
    case "passengerTravelled":
      return "Passenger travelled";
    case "passengerBoarded":
      return "Boarded the train";
    case "delayDuration":
      return "Delay duration";
    case "cancelledBeforeDeparture":
      return "Cancelled before departure";
    case "disruptionType":
      return "Disruption type";
    default:
      return key;
  }
}

/** Confirmation/review step before the mock case is created. */
export function MockConfirm({
  facts,
  decision,
  onConfirm,
  onCancel,
}: {
  facts: CaseFacts;
  decision: DecisionResult;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const items = [
    `Incident: ${decision.scenarioTitle}`,
    `Journey status: ${journeyStatus(facts)}`,
    `Next step: ${decision.recommendedAction}`,
  ];
  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Review before creating your mock claim"
        subtitle="This is a final look at what your mock case will record."
        onBack={onCancel}
      />
      <Card className="border-amber-200 bg-amber-soft">
        <p className="text-sm font-bold text-amber-900">Mock claim</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
          Nothing is sent anywhere. This prototype does not submit real TDR or
          refund claims and is not connected to IRCTC or any government system.
        </p>
      </Card>
      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">Your mock case will record</h2>
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-stone-700">
              <span aria-hidden className="mt-0.5 text-rail-600">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-6 space-y-3">
        <Button onClick={onConfirm}>Yes, create mock claim</Button>
        <Button variant="secondary" onClick={onCancel}>
          Go back and edit
        </Button>
      </div>
    </div>
  );
}
