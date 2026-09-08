import { useState, useRef } from "react";
import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import type { CaseFacts, DecisionResult, DeadlineAssessment } from "../types";
import { journeyStatus, travelledLabel } from "../lib/flow";
import { formatJourneyDateTime, toLocalInputValue } from "../lib/riskEngine";

function getJourneyRoute(facts: CaseFacts): string {
  const from = facts.fromStation || "Hyderabad (HYB)";
  const to = facts.toStation || "Vijayawada (BZA)";
  return `${from} → ${to}`;
}

function getTravelStatusText(facts: CaseFacts): string {
  if (facts.passengerTravelled === false) {
    return "Did not travel (stayed at origin)";
  }
  if (facts.passengerBoarded === false) {
    return "Could not board / Denied entry";
  }
  if (facts.passengerTravelled === true) {
    if (facts.journeyCompleted === false || facts.partialJourney === true) {
      return "Travelled partially";
    }
    if (facts.journeyCompleted === true) {
      return "Travelled & completed journey";
    }
    return "Travelled on train";
  }
  return "Travel status unconfirmed";
}

function getCompletionText(facts: CaseFacts): string {
  if (facts.passengerTravelled === false) {
    return "Not commenced (passenger did not travel)";
  }
  if (facts.journeyCompleted === true) {
    return "Completed full journey to destination";
  }
  if (facts.journeyCompleted === false || facts.partialJourney === true) {
    return "Journey not completed (ended halfway)";
  }
  return "Status unconfirmed";
}

function getDisruptionText(facts: CaseFacts): string {
  const parts: string[] = [];
  if (facts.delayDuration === "gt6h") {
    parts.push("Train delay > 6 hours");
  } else if (facts.delayDuration === "3to6h") {
    parts.push("Train delay 3–6 hours");
  } else if (facts.delayDuration === "lt3h") {
    parts.push("Train delay < 3 hours");
  }

  if (facts.disruptionMentioned) {
    parts.push(facts.disruptionMentioned);
  } else if (parts.length === 0) {
    parts.push("Train delay / disruption");
  }

  return parts.join(" · ");
}

export function CasePreparation({
  facts,
  decision,
  deadline,
  onAnswerChange,
  onJourneyDateTimeChange,
  onCreateClaim,
  onBack,
}: {
  facts: CaseFacts;
  decision: DecisionResult;
  deadline?: DeadlineAssessment | null;
  onAnswerChange: (key: any, value: string) => void;
  onJourneyDateTimeChange?: (value: string) => void;
  onCreateClaim: () => void;
  onBack: () => void;
}) {
  const [activeCard, setActiveCard] = useState<
    "journey" | "travelStatus" | "completion" | "disruption" | "passenger" | null
  >(null);
  const [showAllDetails, setShowAllDetails] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  const routeLabel = getJourneyRoute(facts);
  const travelStatusText = getTravelStatusText(facts);
  const completionText = getCompletionText(facts);
  const disruptionText = getDisruptionText(facts);
  const trainLabel = facts.trainNumber ? `Train ${facts.trainNumber}` : "Train 12723 (Telangana Express)";
  const ticketLabel = facts.pnrNumber || facts.ticketNumber ? `PNR ${facts.pnrNumber || facts.ticketNumber}` : "PNR 4521890123 (Sample)";
  const dateLabel = formatJourneyDateTime(facts.journeyDateTime);

  const scrollToCards = () => {
    setActiveCard("travelStatus");
    cardsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="animate-fade-up space-y-4">
      <ScreenHeader
        title="Ready to create your mock case"
        subtitle="Review your case summary below. You can tap any card to edit facts directly."
        onBack={onBack}
        right={
          <Badge tone="green">
            Ready to claim
          </Badge>
        }
      />

      {/* Hero Confirmation Card with live rule decision feedback */}
      <div className="overflow-hidden rounded-2xl bg-rail-900 text-white shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 bg-rail-800/80 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-signal">
            <span className="h-2 w-2 rounded-full bg-amber-signal animate-pulse" />
            Case Summary · Live Decision
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-rail-100">
            Scenario {decision.scenario}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {/* Key pill highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rail-200">Journey</p>
              <p className="mt-0.5 text-xs font-bold truncate text-white">{routeLabel}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rail-200">What happened</p>
              <p className="mt-0.5 text-xs font-bold truncate text-white">{journeyStatus(facts)}</p>
            </div>
            <div className="rounded-xl bg-amber-signal/20 border border-amber-signal/30 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-signal">Suggested next step</p>
              <p className="mt-0.5 text-xs font-bold truncate text-amber-signal">{decision.scenarioTitle}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-rail-100">
            <span className="font-semibold text-white">Recommended Action: </span>
            {decision.recommendedAction}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              onClick={onCreateClaim}
              className="flex-1 bg-amber-signal text-rail-950 font-bold hover:bg-amber-400 min-h-[46px]"
            >
              Create mock claim →
            </Button>
            <button
              onClick={scrollToCards}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20"
            >
              ✏️ Edit details
            </button>
          </div>

          <p className="text-center text-[11px] text-rail-200/80">
            This is a prototype case only. No real TDR is submitted to IRCTC.
          </p>
        </div>
      </div>

      {/* 5 Compact Summary Cards with Direct In-Place Editing */}
      <div ref={cardsRef} className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Journey & Case Details
          </h2>
          <span className="text-[11px] text-stone-500">
            Tap Edit on any card to modify
          </span>
        </div>

        {/* Card 1: Journey */}
        <Card className={`transition-all duration-200 ${activeCard === "journey" ? "ring-2 ring-rail-600 bg-rail-50/50" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rail-100 text-sm">
                🚉
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-500">Journey Route</p>
                <p className="text-sm font-bold text-rail-950">{routeLabel}</p>
                <p className="mt-0.5 text-xs text-stone-600">{dateLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveCard(activeCard === "journey" ? null : "journey")}
              className="rounded-lg bg-rail-50 px-2.5 py-1.5 text-xs font-bold text-rail-800 hover:bg-rail-100"
            >
              {activeCard === "journey" ? "Done" : "Edit"}
            </button>
          </div>

          {activeCard === "journey" && (
            <div className="mt-3 border-t border-rail-100 pt-3 space-y-3">
              <p className="text-xs font-semibold text-stone-600">Quick route presets:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { from: "Hyderabad (HYB)", to: "Vijayawada (BZA)" },
                  { from: "New Delhi (NDLS)", to: "Mumbai (MMCT)" },
                  { from: "Secunderabad (SC)", to: "Tirupati (TPTY)" },
                  { from: "Chennai (MAS)", to: "Bengaluru (SBC)" },
                ].map((r) => (
                  <button
                    key={`${r.from}-${r.to}`}
                    onClick={() => {
                      onAnswerChange("fromStation", r.from);
                      onAnswerChange("toStation", r.to);
                    }}
                    className="rounded-lg border border-rail-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-rail-600 hover:bg-rail-50"
                  >
                    {r.from.split(" ")[0]} → {r.to.split(" ")[0]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600">From station</label>
                  <input
                    type="text"
                    value={facts.fromStation || ""}
                    onChange={(e) => onAnswerChange("fromStation", e.target.value)}
                    placeholder="e.g. Hyderabad (HYB)"
                    className="mt-1 w-full rounded-lg border border-rail-200 px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600">To station</label>
                  <input
                    type="text"
                    value={facts.toStation || ""}
                    onChange={(e) => onAnswerChange("toStation", e.target.value)}
                    placeholder="e.g. Vijayawada (BZA)"
                    className="mt-1 w-full rounded-lg border border-rail-200 px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>
              <button
                onClick={() => setActiveCard(null)}
                className="rounded-lg bg-rail-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-rail-800"
              >
                Done editing
              </button>
            </div>
          )}
        </Card>

        {/* Card 2: Travel status */}
        <Card className={`transition-all duration-200 ${activeCard === "travelStatus" ? "ring-2 ring-rail-600 bg-rail-50/50" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm">
                🚶
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-500">Travel Status</p>
                <p className="text-sm font-bold text-rail-950">{travelStatusText}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {facts.passengerTravelled === false
                    ? "Passenger did not commence journey"
                    : "Passenger boarded the train"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveCard(activeCard === "travelStatus" ? null : "travelStatus")}
              className="rounded-lg bg-rail-50 px-2.5 py-1.5 text-xs font-bold text-rail-800 hover:bg-rail-100"
            >
              {activeCard === "travelStatus" ? "Done" : "Edit"}
            </button>
          </div>

          {activeCard === "travelStatus" && (
            <div className="mt-3 border-t border-rail-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-stone-600">Select passenger travel status:</p>
              <div className="grid gap-1.5">
                <button
                  onClick={() => {
                    onAnswerChange("passengerTravelled", "yes");
                    onAnswerChange("passengerBoarded", "yes");
                    setActiveCard(null);
                  }}
                  className={`min-h-[40px] rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    facts.passengerTravelled === true
                      ? "border-rail-600 bg-rail-50 font-bold text-rail-900"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  ✓ Yes — Travelled on train (partially or full)
                </button>
                <button
                  onClick={() => {
                    onAnswerChange("passengerTravelled", "no");
                    setActiveCard(null);
                  }}
                  className={`min-h-[40px] rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    facts.passengerTravelled === false
                      ? "border-rail-600 bg-rail-50 font-bold text-rail-900"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  ✗ No — Did not travel (Stayed at origin / Cancelled plan)
                </button>
                <button
                  onClick={() => {
                    onAnswerChange("passengerBoarded", "no");
                    onAnswerChange("passengerTravelled", "no");
                    setActiveCard(null);
                  }}
                  className={`min-h-[40px] rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    facts.passengerBoarded === false
                      ? "border-rail-600 bg-rail-50 font-bold text-rail-900"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  ⚠️ Could not board / Denied boarding at station
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Card 3: Journey completion */}
        <Card className={`transition-all duration-200 ${activeCard === "completion" ? "ring-2 ring-rail-600 bg-rail-50/50" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm">
                🏁
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-500">Journey Completion</p>
                <p className="text-sm font-bold text-rail-950">{completionText}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {facts.journeyCompleted === false
                    ? "Incomplete route / deboarded en-route"
                    : facts.journeyCompleted === true
                      ? "Reached scheduled destination"
                      : "Status unconfirmed"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveCard(activeCard === "completion" ? null : "completion")}
              className="rounded-lg bg-rail-50 px-2.5 py-1.5 text-xs font-bold text-rail-800 hover:bg-rail-100"
            >
              {activeCard === "completion" ? "Done" : "Edit"}
            </button>
          </div>

          {activeCard === "completion" && (
            <div className="mt-3 border-t border-rail-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-stone-600">Select journey completion status:</p>
              <div className="grid gap-1.5">
                <button
                  onClick={() => {
                    onAnswerChange("journeyCompleted", "no");
                    onAnswerChange("passengerTravelled", "yes");
                    setActiveCard(null);
                  }}
                  className={`min-h-[40px] rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    facts.journeyCompleted === false
                      ? "border-rail-600 bg-rail-50 font-bold text-rail-900"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  ⚠️ Incomplete — Journey ended halfway / Deboarded en-route
                </button>
                <button
                  onClick={() => {
                    onAnswerChange("journeyCompleted", "yes");
                    onAnswerChange("passengerTravelled", "yes");
                    setActiveCard(null);
                  }}
                  className={`min-h-[40px] rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition-colors ${
                    facts.journeyCompleted === true
                      ? "border-rail-600 bg-rail-50 font-bold text-rail-900"
                      : "border-stone-200 bg-white hover:bg-stone-50"
                  }`}
                >
                  ✓ Completed full journey to destination
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Card 4: Disruption */}
        <Card className={`transition-all duration-200 ${activeCard === "disruption" ? "ring-2 ring-rail-600 bg-rail-50/50" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm">
                ⚠️
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-500">Disruption Details</p>
                <p className="text-sm font-bold text-rail-950">{disruptionText}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  Delay bracket: {facts.delayDuration === "gt6h" ? ">6 hours" : facts.delayDuration === "3to6h" ? "3–6 hours" : facts.delayDuration === "lt3h" ? "<3 hours" : "Unspecified"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveCard(activeCard === "disruption" ? null : "disruption")}
              className="rounded-lg bg-rail-50 px-2.5 py-1.5 text-xs font-bold text-rail-800 hover:bg-rail-100"
            >
              {activeCard === "disruption" ? "Done" : "Edit"}
            </button>
          </div>

          {activeCard === "disruption" && (
            <div className="mt-3 border-t border-rail-100 pt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-stone-600 mb-1.5">Train delay duration:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "gt6h", label: "More than 6 hours" },
                    { id: "3to6h", label: "3 to 6 hours" },
                    { id: "lt3h", label: "Less than 3 hours" },
                    { id: "unsure", label: "No major delay / Unsure" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onAnswerChange("delayDuration", d.id)}
                      className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-medium text-left ${
                        facts.delayDuration === d.id
                          ? "border-rail-600 bg-rail-50 font-bold text-rail-900"
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-600 mb-1.5">Disruption type:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "delay", label: "Train delayed" },
                    { id: "short_terminated", label: "Terminated midway" },
                    { id: "could_not_board", label: "Could not board" },
                    { id: "ac_failure", label: "AC / coach defect" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onAnswerChange("disruptionType", t.id)}
                      className="min-h-[38px] rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-left hover:border-rail-600 hover:bg-rail-50"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveCard(null)}
                className="rounded-lg bg-rail-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-rail-800"
              >
                Done editing
              </button>
            </div>
          )}
        </Card>

        {/* Card 5: Passenger & ticket details */}
        <Card className={`transition-all duration-200 ${activeCard === "passenger" ? "ring-2 ring-rail-600 bg-rail-50/50" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm">
                🎟️
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-500">Passenger & Ticket Details</p>
                <p className="text-sm font-bold text-rail-950">{trainLabel}</p>
                <p className="mt-0.5 text-xs text-stone-600">{ticketLabel} · {dateLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveCard(activeCard === "passenger" ? null : "passenger")}
              className="rounded-lg bg-rail-50 px-2.5 py-1.5 text-xs font-bold text-rail-800 hover:bg-rail-100"
            >
              {activeCard === "passenger" ? "Done" : "Edit"}
            </button>
          </div>

          {activeCard === "passenger" && (
            <div className="mt-3 border-t border-rail-100 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600">Train Number</label>
                  <input
                    type="text"
                    value={facts.trainNumber || ""}
                    onChange={(e) => onAnswerChange("trainNumber", e.target.value)}
                    placeholder="e.g. 12723"
                    className="mt-1 w-full rounded-lg border border-rail-200 px-2.5 py-1.5 text-xs text-stone-900"
                  />
                  <div className="mt-1 flex gap-1">
                    {["12723", "12952", "12760"].map((tn) => (
                      <button
                        key={tn}
                        onClick={() => onAnswerChange("trainNumber", tn)}
                        className="rounded border border-stone-200 px-1.5 py-0.5 text-[10px] text-stone-600 hover:bg-stone-50"
                      >
                        {tn}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600">PNR / Ticket Ref</label>
                  <input
                    type="text"
                    value={facts.pnrNumber || facts.ticketNumber || ""}
                    onChange={(e) => onAnswerChange("pnrNumber", e.target.value)}
                    placeholder="e.g. 4521890123"
                    className="mt-1 w-full rounded-lg border border-rail-200 px-2.5 py-1.5 text-xs text-stone-900"
                  />
                  <button
                    onClick={() => onAnswerChange("pnrNumber", "4521890123")}
                    className="mt-1 block text-[10px] text-rail-700 hover:underline"
                  >
                    + Sample PNR
                  </button>
                </div>
              </div>

              {onJourneyDateTimeChange && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600">Journey scheduled date & time</label>
                  <input
                    type="datetime-local"
                    value={toLocalInputValue(new Date(facts.journeyDateTime))}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!Number.isNaN(d.getTime())) {
                        onJourneyDateTimeChange(d.toISOString());
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-rail-200 px-2.5 py-1.5 text-xs text-stone-900"
                  />
                </div>
              )}

              <button
                onClick={() => setActiveCard(null)}
                className="rounded-lg bg-rail-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-rail-800"
              >
                Done editing
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Expandable Section: View all details & extracted fields */}
      <div className="pt-1">
        <button
          onClick={() => setShowAllDetails(!showAllDetails)}
          className="flex w-full items-center justify-between rounded-xl border border-rail-100 bg-stone-50/80 px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
        >
          <span className="flex items-center gap-2">
            <span>{showAllDetails ? "▲" : "▼"}</span>
            <span>{showAllDetails ? "Hide secondary details" : "View all details & extracted fields"}</span>
          </span>
          <span className="text-[11px] text-stone-500">
            {showAllDetails ? "Collapse" : "Incident text & rules"}
          </span>
        </button>

        {showAllDetails && (
          <div className="mt-2.5 space-y-3 rounded-xl border border-rail-100 bg-white p-3.5 text-xs text-stone-700 animate-fade-up">
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-stone-400">
                Original Citizen Narrative
              </p>
              <p className="mt-1 border-l-2 border-rail-600/40 pl-2.5 italic text-stone-600 leading-relaxed">
                “{facts.incidentText}”
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-stone-50 p-2 border border-stone-100">
                <span className="font-bold text-[10px] text-stone-400 uppercase">Boarded Train</span>
                <p className="text-xs font-semibold text-stone-800">{travelledLabel(facts.passengerBoarded)}</p>
              </div>
              <div className="rounded-lg bg-stone-50 p-2 border border-stone-100">
                <span className="font-bold text-[10px] text-stone-400 uppercase">Cancelled Before Departure</span>
                <p className="text-xs font-semibold text-stone-800">{travelledLabel(facts.cancelledBeforeDeparture)}</p>
              </div>
            </div>

            {deadline && (
              <div className="rounded-lg bg-rail-50/60 p-2.5 border border-rail-100 text-xs">
                <span className="font-bold text-[10px] uppercase tracking-wide text-rail-800">
                  Filing Window Assessment
                </span>
                <p className="mt-0.5 font-semibold text-rail-900">{deadline.statusLabel}</p>
                <p className="mt-0.5 text-[11px] text-stone-600">{deadline.statusDetail}</p>
              </div>
            )}

            {decision.checklist.length > 0 && (
              <div className="pt-1">
                <p className="font-bold uppercase tracking-wider text-[10px] text-stone-400">
                  Claim Action Checklist
                </p>
                <ul className="mt-1 space-y-1 text-stone-600">
                  {decision.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span className="text-rail-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Final Actions */}
      <div className="pt-2 space-y-3">
        <Button
          onClick={onCreateClaim}
          className="w-full min-h-[48px] bg-rail-900 text-white font-bold hover:bg-rail-800 text-sm shadow-md"
        >
          Create mock claim
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}

/** Backwards-compatible MockConfirm component export if needed. */
export function MockConfirm({
  facts: _facts,
  decision: _decision,
  onConfirm,
  onCancel,
}: {
  facts: CaseFacts;
  decision: DecisionResult;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
      <div className="mt-6 space-y-3">
        <Button onClick={onConfirm}>Yes, create mock claim</Button>
        <Button variant="secondary" onClick={onCancel}>
          Go back and edit
        </Button>
      </div>
    </div>
  );
}
