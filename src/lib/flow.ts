import type {
  AnalysisResult,
  CaseFacts,
  IncidentFacts,
  MissingFactKey,
} from "../types";
import { DISRUPTION_LABELS } from "../data/scenarios";
import { computeMissingFacts } from "./ai/fallbackParser";
import { defaultJourneyDateTime } from "./riskEngine";

/** Answers collected from follow-up questions, keyed by fact. */
export type Answers = Partial<Record<MissingFactKey, string>> & {
  fromStation?: string;
  toStation?: string;
  trainNumber?: string;
  ticketNumber?: string;
  pnrNumber?: string;
};

/**
 * Merge AI-extracted facts with the citizen's answers into the final fact
 * set, refining the incident classification deterministically as facts land.
 */
export function buildCaseFacts(
  analysis: AnalysisResult,
  answers: Answers,
  incidentText: string,
  journeyDateTime?: string,
): CaseFacts {
  const facts: CaseFacts = {
    ...analysis.facts,
    incidentText,
    journeyDateTime: journeyDateTime || defaultJourneyDateTime(),
  };

  if (answers.passengerTravelled !== undefined) {
    facts.passengerTravelled = answers.passengerTravelled === "yes";
    if (answers.passengerTravelled === "no") {
      facts.passengerBoarded = false;
      facts.partialJourney = false;
      facts.journeyCompleted = false;
    }
  }
  if (answers.passengerBoarded !== undefined) {
    facts.passengerBoarded = answers.passengerBoarded === "yes";
    if (answers.passengerBoarded === "no") {
      facts.passengerTravelled = false;
      facts.partialJourney = false;
      facts.journeyCompleted = false;
    } else if (facts.passengerTravelled === "unknown") {
      facts.passengerTravelled = true;
    }
  }
  if (answers.journeyCompleted !== undefined) {
    facts.journeyCompleted = answers.journeyCompleted === "yes";
    facts.partialJourney = answers.journeyCompleted === "no";
    if (facts.journeyCompleted) {
      facts.passengerBoarded = true;
      facts.passengerTravelled = true;
    }
  }
  if (answers.delayDuration)
    facts.delayDuration = answers.delayDuration as CaseFacts["delayDuration"];
  if (answers.cancelledBeforeDeparture)
    facts.cancelledBeforeDeparture =
      answers.cancelledBeforeDeparture === "yes"
        ? true
        : answers.cancelledBeforeDeparture === "no"
          ? false
          : "unknown";
  if (answers.disruptionType)
    facts.disruptionMentioned = DISRUPTION_LABELS[answers.disruptionType];
  if (answers.fromStation !== undefined) facts.fromStation = answers.fromStation;
  if (answers.toStation !== undefined) facts.toStation = answers.toStation;
  if (answers.trainNumber !== undefined) facts.trainNumber = answers.trainNumber;
  if (answers.ticketNumber !== undefined) facts.ticketNumber = answers.ticketNumber;
  if (answers.pnrNumber !== undefined) facts.pnrNumber = answers.pnrNumber;

  facts.incidentType = refineIncidentType(facts);
  return facts;
}

/**
 * Deterministic refinement: as the citizen answers questions, the initial
 * classification may change (e.g. "ambiguous" becomes concrete).
 */
export function refineIncidentType(f: IncidentFacts): IncidentFacts["incidentType"] {
  // If passenger explicitly did not travel, they cannot have completed or had a partial journey
  if (f.passengerTravelled === false) {
    if (
      f.disruptionMentioned === "Could not board" ||
      f.incidentType === "could_not_board"
    ) {
      return "could_not_board";
    }
    return "delay_not_travelled";
  }

  // Check completed vs partial journey for passengers who travelled
  if (f.journeyCompleted === true) {
    return "travelled_completed";
  }
  if (
    f.partialJourney === true ||
    (f.passengerBoarded === true && f.journeyCompleted === false)
  ) {
    return "partial_journey";
  }
  if (f.passengerTravelled === true || f.passengerBoarded === true) {
    if (f.journeyCompleted === false) return "partial_journey";
    return f.incidentType === "partial_journey"
      ? "partial_journey"
      : "travelled_disrupted";
  }
  if (f.passengerBoarded === false) {
    if (
      f.disruptionMentioned === "Could not board" ||
      f.incidentType === "could_not_board"
    ) {
      return "could_not_board";
    }
    if (f.delayDuration === "gt6h" || f.delayDuration === "3to6h") {
      return "delay_not_travelled";
    }
    return "could_not_board";
  }
  return f.incidentType === "ambiguous" ? "ambiguous" : f.incidentType;
}

/** Next unanswered question, given what the citizen has already answered. */
export function nextUnanswered(
  facts: CaseFacts,
  answers: Answers,
): MissingFactKey | null {
  const missing = computeMissingFacts(facts).filter(
    (k) => !(k in answers),
  );
  return missing[0] ?? null;
}

/** Human-readable journey status for the fact cards. */
export function journeyStatus(f: CaseFacts): string {
  switch (f.incidentType) {
    case "delay_not_travelled":
      return "Train delayed (did not travel)";
    case "could_not_board":
      return "Could not board";
    case "partial_journey":
      return "Partial journey (disrupted en-route)";
    case "travelled_completed":
      return "Travelled & completed journey";
    case "travelled_disrupted":
      return "Journey disrupted";
    default:
      return "Needs clarification";
  }
}

export function travelledLabel(v: boolean | "unknown"): string {
  return v === true ? "Yes" : v === false ? "No" : "Not confirmed";
}

export function keyInformation(f: CaseFacts): string {
  const bits: string[] = [];
  if (f.incidentType === "delay_not_travelled" || f.delayDuration !== "unsure")
    bits.push(
      f.delayDuration === "unsure"
        ? "Delay duration not confirmed"
        : `Delay: ${f.delayDuration === "gt6h" ? "more than 6 hours" : f.delayDuration === "3to6h" ? "3–6 hours" : "less than 3 hours"}`,
    );
  if (f.passengerTravelled === "unknown") bits.push("Travel status not confirmed");
  if (f.disruptionMentioned) bits.push(f.disruptionMentioned);
  if (f.journeyDateMentioned) bits.push(`Journey date: ${f.journeyDateMentioned}`);
  return bits.length ? bits.join(" · ") : "Details still needed";
}
