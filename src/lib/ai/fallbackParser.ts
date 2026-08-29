import type {
  AnalysisResult,
  FollowUpQuestion,
  IncidentFacts,
  MissingFactKey,
} from "../../types";
import { FOLLOW_UP_QUESTIONS } from "../../data/scenarios";

/**
 * Deterministic keyword-based interpreter. This is the no-API-key fallback so
 * the demo is always functional, and it also acts as the shape the OpenAI
 * path must conform to.
 */

const delayPatterns: { re: RegExp; duration: IncidentFacts["delayDuration"] }[] = [
  { re: /(more than (six|6)|6\+|several hours|whole night|overnight|many hours|entire day)/i, duration: "gt6h" },
  { re: /(3|three|4|four|5|five|6|six)\s*(to|-|–)?\s*(6|six)?\s*hours?/i, duration: "3to6h" },
  { re: /(less than (three|3)|couple of hours|a few hours|2 hours|two hours|1 hour|one hour|an hour)/i, duration: "lt3h" },
];

const disruptionPhrases: { re: RegExp; label: string }[] = [
  { re: /cancel+ed|cancel+lation/i, label: "Train cancelled" },
  { re: /terminat+ed|short terminat|divert/i, label: "Train terminated early or diverted" },
  { re: /missed.{0,20}(connection|train)|missed my (train|journey)/i, label: "Missed a connecting journey" },
  { re: /could not board|couldn.?t board|denied (boarding|entry)|not allowed to board|platform.{0,30}(crowd|block|disorder)/i, label: "Could not board" },
  { re: /strike|blockade|protest|signal (failure|problem)|derail/i, label: "Service disruption" },
  { re: /flood|accident|weather|cyclone|fog/i, label: "Weather or accident disruption" },
];

const dateMatch = /\b(\d{1,2}(st|nd|rd|th)?[\s-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*([\s'-]+\d{2,4})?)\b/i;

function unknownWhenUnclear(value: boolean | undefined | null): boolean | "unknown" {
  return typeof value === "boolean" ? value : "unknown";
}

export function fallbackAnalyze(text: string): AnalysisResult {
  const t = text.toLowerCase();

  const travelledYes = /\b(i (travel+ed|did travel|took the train|boarded)|my journey (was|is) (completed)|completed my (journey|trip))\b/i.test(t);
  const travelledNo = /\b(did not travel|didn.?t travel|not travel+ing|decided not to|no longer travel|cancelled my (trip|plan)|did not board|didn.?t board)\b/i.test(t);
  const boardedNo = /(could not board|couldn.?t board|not able to board|missed the train|denied boarding|was not allowed)/i.test(t);
  const boardedYes = /\b(i (boarded|got on|was on board)|managed to board)\b/i.test(t);

  let delayDuration: IncidentFacts["delayDuration"] = "unsure";
  for (const { re, duration } of delayPatterns) {
    if (re.test(t)) {
      delayDuration = duration;
      break;
    }
  }
  const mentionsDelay = /\b(delay+ed?|late|behind schedule|held up|waiting)\b/i.test(t);

  let disruptionMentioned: string | null = null;
  for (const { re, label } of disruptionPhrases) {
    if (re.test(t)) {
      disruptionMentioned = label;
      break;
    }
  }

  const dateM = text.match(dateMatch);
  const journeyDateMentioned = dateM ? dateM[0] : null;

  const cancelledYes = /\b(cancel+ed? (my|the) (ticket|booking)|ticket (was )?cancel+ed?|filed? (a )?tdr|cancel+ed? before)\b/i.test(t);
  const cancelledNo = /\b(did not cancel|didn.?t cancel|no cancellation)\b/i.test(t);

  // Classify the incident into one of the prototype's four paths.
  let incidentType: IncidentFacts["incidentType"];
  if (travelledYes || (boardedYes && !boardedNo)) {
    incidentType = "travelled_disrupted";
  } else if (boardedNo) {
    incidentType = "could_not_board";
  } else if (mentionsDelay && (travelledNo || !boardedYes)) {
    incidentType = "delay_not_travelled";
  } else if (disruptionMentioned) {
    incidentType = "could_not_board";
  } else {
    incidentType = "ambiguous";
  }

  const passengerTravelled = unknownWhenUnclear(
    travelledYes ? true : travelledNo ? false : undefined,
  );
  const passengerBoarded = unknownWhenUnclear(
    boardedNo ? false : boardedYes ? true : undefined,
  );

  const facts: IncidentFacts = {
    incidentType,
    passengerTravelled,
    passengerBoarded,
    delayDuration: mentionsDelay ? delayDuration : "unsure",
    cancelledBeforeDeparture: unknownWhenUnclear(
      cancelledYes ? true : cancelledNo ? false : undefined,
    ),
    disruptionMentioned,
    journeyDateMentioned,
  };

  const missingFacts = computeMissingFacts(facts);
  const suggestedQuestion = pickNextQuestion(facts, missingFacts);
  const confidence = computeConfidence(facts, missingFacts.length);

  return {
    facts,
    confidence,
    missingFacts,
    suggestedQuestion,
    summary: buildSummary(facts),
    source: "fallback",
  };
}

export function computeMissingFacts(facts: IncidentFacts): MissingFactKey[] {
  const missing: MissingFactKey[] = [];
  if (facts.passengerTravelled === "unknown") missing.push("passengerTravelled");
  if (facts.passengerBoarded === "unknown") missing.push("passengerBoarded");
  if (facts.incidentType !== "ambiguous" && facts.delayDuration === "unsure")
    missing.push("delayDuration");
  if (
    facts.passengerTravelled === false &&
    facts.cancelledBeforeDeparture === "unknown"
  )
    missing.push("cancelledBeforeDeparture");
  if (
    (facts.incidentType === "travelled_disrupted" ||
      facts.incidentType === "could_not_board") &&
    !facts.disruptionMentioned
  )
    missing.push("disruptionType");
  if (!facts.journeyDateMentioned) missing.push("journeyDate");
  return missing;
}

export function pickNextQuestion(
  facts: IncidentFacts,
  missing: MissingFactKey[],
): FollowUpQuestion | null {
  void facts; // kept in the signature so callers can pass full fact context
  if (missing.length === 0) return null;
  const key = missing[0];
  return FOLLOW_UP_QUESTIONS[key];
}

/** Confidence is a simple heuristic: more known facts and no ambiguity = higher. */
function computeConfidence(facts: IncidentFacts, missingCount: number): number {
  let score = 0.35;
  if (facts.incidentType !== "ambiguous") score += 0.25;
  if (facts.passengerTravelled !== "unknown") score += 0.15;
  if (facts.passengerBoarded !== "unknown") score += 0.1;
  if (facts.delayDuration !== "unsure") score += 0.1;
  if (facts.disruptionMentioned) score += 0.05;
  score -= missingCount * 0.05;
  return Math.min(0.95, Math.max(0.2, score));
}

function buildSummary(facts: IncidentFacts): string {
  switch (facts.incidentType) {
    case "delay_not_travelled":
      return "It sounds like your train was delayed and you did not make the journey.";
    case "could_not_board":
      return "It sounds like you were unable to complete your journey as planned.";
    case "travelled_disrupted":
      return "It sounds like you travelled but the journey did not go as planned.";
    default:
      return "We understood part of your description, but a few details are unclear.";
  }
}
