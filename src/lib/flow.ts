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
export type Answers = Partial<Record<MissingFactKey, string>>;

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

  if (answers.passengerTravelled)
    facts.passengerTravelled = answers.passengerTravelled === "yes";
  if (answers.passengerBoarded)
    facts.passengerBoarded = answers.passengerBoarded === "yes";
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

  facts.incidentType = refineIncidentType(facts);
  return facts;
}

/**
 * Deterministic refinement: as the citizen answers questions, the initial
 * classification may change (e.g. "ambiguous" becomes concrete).
 */
export function refineIncidentType(f: IncidentFacts): IncidentFacts["incidentType"] {
  if (f.passengerTravelled === true || f.passengerBoarded === true) return "travelled_disrupted";
  if (f.passengerBoarded === false) {
    if (f.disruptionMentioned === "Could not board" || f.incidentType === "could_not_board") {
      return "could_not_board";
    }
    if (f.delayDuration === "gt6h" || f.delayDuration === "3to6h") {
      return "delay_not_travelled";
    }
    return "could_not_board";
  }
  if (f.passengerTravelled === false) {
    if (f.disruptionMentioned === "Could not board" || f.incidentType === "could_not_board") {
      return "could_not_board";
    }
    if (f.delayDuration === "gt6h" || f.delayDuration === "3to6h") {
      return "delay_not_travelled";
    }
    return "delay_not_travelled";
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
      return "Train delayed";
    case "could_not_board":
      return "Could not board";
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
