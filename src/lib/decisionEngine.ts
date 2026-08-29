import type { CaseFacts, DecisionResult, RiskLevel } from "../types";
import { DELAY_LABELS, DISRUPTION_LABELS } from "../data/scenarios";

/**
 * Deterministic decision engine.
 *
 * Receives structured facts and returns a scenario classification with a
 * fixed recommendation. No LLM involvement — the same facts always produce
 * the same result. The wording below is prototype guidance, not official
 * IRCTC rules or legal advice.
 */

/**
 * Prototype rule (clearly labelled as such in the UI):
 * A "TDR-style" claim is generally expected to be considered soon after the
 * journey incident. This prototype treats the first 72 hours as the
 * comfortable window and 10 days as the outer demo limit.
 */
export const PROTOTYPE_WINDOW_HOURS = 72;
export const PROTOTYPE_OUTER_HOURS = 24 * 10;

export function decide(facts: CaseFacts): DecisionResult {
  switch (facts.incidentType) {
    case "delay_not_travelled":
      return scenarioA(facts);
    case "could_not_board":
      return scenarioB(facts);
    case "travelled_disrupted":
      return scenarioC(facts);
    default:
      return scenarioD(facts);
  }
}

function riskFor(base: RiskLevel, facts: CaseFacts): RiskLevel {
  const hours = hoursSince(facts.journeyDateTime);
  if (hours === null) return base;
  if (hours > PROTOTYPE_OUTER_HOURS) return "high";
  if (hours > PROTOTYPE_WINDOW_HOURS && base === "low") return "medium";
  return base;
}

export function hoursSince(journeyDateTime: string): number | null {
  const then = new Date(journeyDateTime).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, (Date.now() - then) / 3_600_000);
}

/* ------------------------------------------------------------------ */
/* Scenario A — significant delay, passenger did not travel            */
/* ------------------------------------------------------------------ */
function scenarioA(facts: CaseFacts): DecisionResult {
  const delayText =
    facts.delayDuration === "gt6h"
      ? "more than 6 hours"
      : facts.delayDuration === "3to6h"
        ? "3 to 6 hours"
        : facts.delayDuration === "lt3h"
          ? "less than 3 hours"
          : "an unconfirmed duration";

  const longDelay = facts.delayDuration === "gt6h" || facts.delayDuration === "3to6h";
  const cancelled = facts.cancelledBeforeDeparture === true;

  return {
    scenario: "A",
    scenarioTitle: "Delayed train — did not travel",
    classification: "Train delayed significantly and you did not travel.",
    recommendedAction: cancelled
      ? "Review your cancellation record and confirm the refund already processed covers the delay reason."
      : "Review the applicable TDR/refund reason for a delayed train before filing, and keep the ticket unused.",
    riskLevel: riskFor(longDelay ? "low" : "medium", facts),
    riskNote: longDelay
      ? "A delay of this length is usually the clearest situation to explain — acting soon keeps it that way."
      : "For shorter delays, refund outcomes depend on the exact delay duration, so note down everything you remember.",
    missingInformation: collectMissing(facts, [
      facts.delayDuration === "unsure" ? "The approximate delay duration" : null,
      facts.cancelledBeforeDeparture === "unknown"
        ? "Whether the ticket was cancelled before departure"
        : null,
      facts.journeyDateMentioned ? null : "The exact journey date and train number",
    ]),
    explanation: `Your train was delayed by ${delayText}, and you told us you did not travel. In this prototype, that points to a “delayed train — did not travel” refund path. Based on the information provided, the key factors are the delay length and whether the ticket remained unused.`,
    checklist: [
      "Confirm the delay duration from station announcements or news reports",
      "Check whether your ticket is still marked as untravelled",
      "Note the train number and scheduled departure time",
      "Keep any screenshots of delay announcements",
    ],
    deadlineKnown: facts.journeyDateTime !== "",
  };
}

/* ------------------------------------------------------------------ */
/* Scenario B — could not board / journey disrupted before travel      */
/* ------------------------------------------------------------------ */
function scenarioB(facts: CaseFacts): DecisionResult {
  return {
    scenario: "B",
    scenarioTitle: "Could not board the train",
    classification: "You reached the station but could not complete boarding.",
    recommendedAction:
      "Gather proof of the boarding disruption (station announcement, staff statement, or photo) before choosing a refund reason.",
    riskLevel: riskFor("medium", facts),
    riskNote:
      "Boarding disruptions often need supporting evidence, and evidence is easiest to collect on the day of travel.",
    missingInformation: collectMissing(facts, [
      facts.disruptionMentioned ? null : "What exactly blocked you from boarding",
      facts.journeyDateMentioned ? null : "The exact journey date and train number",
      facts.passengerBoarded === "unknown"
        ? "Whether anyone in your booking boarded"
        : null,
    ]),
    explanation:
      "You told us you could not board the train due to a disruption. In this prototype, that points to gathering evidence of the disruption first, because a boarding-related claim is stronger when the cause is documented. Based on the information provided, this is the recommended next step.",
    checklist: [
      "Write down exactly what happened at the station, with times",
      "Save any photos, announcements, or staff statements",
      "Note the train number and your coach/berth details",
      "Check if fellow passengers reported the same issue",
    ],
    deadlineKnown: facts.journeyDateTime !== "",
  };
}

/* ------------------------------------------------------------------ */
/* Scenario C — travelled but journey was disrupted                    */
/* ------------------------------------------------------------------ */
function scenarioC(facts: CaseFacts): DecisionResult {
  return {
    scenario: "C",
    scenarioTitle: "Travelled with a disrupted journey",
    classification: "You travelled, but the journey itself was disrupted.",
    recommendedAction:
      "Check whether a partial refund or travel disruption claim applies to the portion of the journey that failed.",
    riskLevel: riskFor("medium", facts),
    riskNote:
      "Partial-journey claims depend on where the disruption happened, so record the station and time it occurred.",
    missingInformation: collectMissing(facts, [
      facts.disruptionMentioned ? null : "The type of disruption you faced",
      facts.journeyDateMentioned ? null : "The exact journey date and train number",
      "The station where the disruption occurred",
    ]),
    explanation:
      "You told us you travelled but the journey was disrupted. In this prototype, that points to a partial-journey claim: what matters most is where and how the disruption happened. Based on the information provided, documenting the disruption point is the recommended next step.",
    checklist: [
      "Note the station and time where the disruption happened",
      "Keep your ticket and any boarding records",
      "Record how much of the journey you completed",
      "Save announcements or messages about the disruption",
    ],
    deadlineKnown: facts.journeyDateTime !== "",
  };
}

/* ------------------------------------------------------------------ */
/* Scenario D — not enough information                                 */
/* ------------------------------------------------------------------ */
function scenarioD(facts: CaseFacts): DecisionResult {
  return {
    scenario: "D",
    scenarioTitle: "Needs more information",
    classification:
      "We could not confidently match your situation to a specific refund path.",
    recommendedAction:
      "Answer the remaining questions so we can point you to the right path — no claim should be filed yet.",
    riskLevel: riskFor("medium", facts),
    riskNote:
      "While the situation is unclear, time may still be passing. Answering a few more questions protects your options.",
    missingInformation: collectMissing(facts, [
      facts.passengerTravelled === "unknown" ? "Whether you travelled" : null,
      facts.passengerBoarded === "unknown" ? "Whether you boarded" : null,
      "What kind of disruption occurred",
      facts.journeyDateMentioned ? null : "The exact journey date and train number",
    ]),
    explanation:
      "Based on the information provided, we could not confidently match your situation to a refund path. In this prototype, that means the honest recommendation is to clarify the facts first — filing with unclear details usually leads to rejection. Please verify against the official process once the facts are clear.",
    checklist: [
      "Re-read your ticket to confirm the journey details",
      "Check your booking history for the journey date",
      "Note down, step by step, what actually happened",
      "Come back and answer the remaining questions",
    ],
    deadlineKnown: false,
  };
}

function collectMissing(facts: CaseFacts, items: (string | null)[]): string[] {
  void facts;
  return items.filter((i): i is string => i !== null);
}

/** Small helper for screens that show facts as chips. */
export function delayLabel(value: string): string {
  return DELAY_LABELS[value] ?? "Not confirmed";
}

export function disruptionLabel(value: string | null): string {
  return value ? (DISRUPTION_LABELS[value] ?? value) : "Not recorded";
}
