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
    case "partial_journey":
      return scenarioPartialJourney(facts);
    case "travelled_completed":
      return scenarioTravelledCompleted(facts);
    case "travelled_disrupted":
      if (facts.journeyCompleted === true) {
        return scenarioTravelledCompleted(facts);
      }
      return scenarioPartialJourney(facts);
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
    decisionBasis: {
      keyFact: `Passenger confirmed did not travel, and train was delayed by ${delayText}.`,
      ruleApplied: "Indian Railways Refund Rule: If a train is delayed >3 hours at origin and passenger does not board, full fare is refundable on TDR before chart preparation / actual train departure without cancellation fees.",
      counterfactual: "If you had boarded and travelled to your destination despite the delay, standard ticket fare refund would be rejected under completion rules.",
      whyThisMatters: "Passengers who do not travel due to a delay exceeding 3 hours are entitled to a 100% fare refund without cancellation charges, provided the ticket remains unused and the TDR is filed before chart preparation or actual train departure.",
      fallbackAction: "If the online portal rejects filing due to chart status, approach the Chief Reservation Supervisor or Station Master to obtain a manual cancellation certificate or file a grievance on RailMadad (139).",
      officialSourceUrl: "https://www.operations.irctc.co.in/ctrs/ruleRefund.html",
    },
    requiredFacts: [
      "Confirmed non-travel status",
      "Delay verification (>3 hours for full refund)",
      "Ticket kept un-boarded / unused",
    ],
    optionalFacts: [
      "PNR / Ticket number",
      "Cancellation timestamp before train departure",
    ],
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
    decisionBasis: {
      keyFact: "Passenger was unable to board due to operational service disruption or denied boarding.",
      ruleApplied: "Indian Railways Refund Rule: Failure to board attributable to railway service failure or station conditions requires contemporaneous certification (Station Master memo or TTE endorsement).",
      counterfactual: "If the failure to board was due to arriving late after departure through passenger fault, refund is forfeited under standard no-show rules.",
      whyThisMatters: "Being unable to board due to rail service failure or extreme crowd is an involuntary disruption. Indian Railways requires official station verification (a station master memo) before granting a non-boarding refund.",
      fallbackAction: "If station staff was unavailable to issue a memo, record date-stamped photos/videos, note fellow passenger PNRs, and register an immediate ticket grievance on RailMadad (railmadad.indianrailways.gov.in or dial 139).",
      officialSourceUrl: "https://www.operations.irctc.co.in/ctrs/ruleRefund.html",
    },
    requiredFacts: [
      "Documented disruption preventing boarding",
      "Date of travel and train number",
      "Passenger non-boarding confirmation",
    ],
    optionalFacts: [
      "Station Master memo or endorsement",
      "Supporting photo/video or announcements",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Scenario C — Partial journey disruption (boarded, disrupted halfway)*/
/* ------------------------------------------------------------------ */
function scenarioPartialJourney(facts: CaseFacts): DecisionResult {
  return {
    scenario: "C",
    scenarioTitle: "Partial journey disruption — travelled part of route",
    classification: "You boarded the train and travelled part of the route, but the journey was interrupted before your destination.",
    recommendedAction:
      "Obtain a deboarding certificate or TTE endorsement at the station where your journey stopped, and file a TDR for the untravelled portion.",
    riskLevel: riskFor("medium", facts),
    riskNote:
      "Partial journey claims require proof of the deboarding station and a TTE certificate. Filing quickly before chart reconciliation is critical.",
    missingInformation: collectMissing(facts, [
      facts.disruptionMentioned ? null : "The reason the journey was terminated en-route",
      facts.journeyDateMentioned ? null : "The exact journey date and train number",
      "The station where your journey was cut short",
    ]),
    explanation:
      "You reported that you boarded and travelled part of the route, but could not complete the journey. Under Indian Railways rules, this qualifies for a refund of the untravelled distance. The crucial requirement is obtaining an Excess Fare Ticket (EFT) or certificate from the TTE or Station Master at your deboarding point.",
    checklist: [
      "Obtain an Excess Fare Ticket (EFT) or written certificate from the TTE at the deboarding station",
      "Note the exact deboarding station and scheduled arrival time",
      "Keep your original ticket copy and booking reference",
      "File a TDR under 'Train Terminated Short of Destination' or 'Passenger Deboarded En Route' within 72 hours",
      "Attach the TTE certificate number in your TDR remarks",
    ],
    deadlineKnown: facts.journeyDateTime !== "",
    decisionBasis: {
      keyFact: "Passenger boarded and travelled part of the route, but deboarded en route before the booked destination.",
      ruleApplied: "Indian Railways Refund Rule: When a journey is truncated midway due to train termination or passenger deboarding, fare for the untravelled segment is refunded upon production of a TTE Deboarding Certificate / EFT.",
      counterfactual: "If you had stayed on board until the destination, you would be classified under Scenario E (completed journey) where untravelled fare refund does not apply.",
      whyThisMatters: "When a journey is interrupted or train short-terminated, Indian Railways refunds the proportionate fare for the untravelled segment upon submission of a TTE certificate (Excess Fare Ticket memo).",
      fallbackAction: "If the TTE did not issue an EFT memo at deboarding, approach the Station Superintendent at the deboarding station to obtain an endorsement within 72 hours.",
      officialSourceUrl: "https://www.operations.irctc.co.in/ctrs/ruleRefund.html",
    },
    requiredFacts: [
      "Boarding confirmation",
      "Deboarding station where journey stopped",
      "TTE deboarding endorsement / EFT memo",
    ],
    optionalFacts: [
      "Disruption cause (derailment, flood, short termination)",
      "Connecting train details",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Scenario E — Travelled and completed journey                        */
/* ------------------------------------------------------------------ */
function scenarioTravelledCompleted(facts: CaseFacts): DecisionResult {
  return {
    scenario: "E",
    scenarioTitle: "Travelled and completed journey",
    classification: "You boarded the train and completed your journey to the destination.",
    recommendedAction:
      "Full fare refund is not applicable since travel was completed. If you suffered amenity failure (such as AC breakdown) or coach downgrade, file a difference-in-fare TDR.",
    riskLevel: riskFor("low", facts),
    riskNote:
      "Indian Railways does not refund ticket fare for arrival delay once the journey is completed to destination.",
    missingInformation: collectMissing(facts, [
      facts.disruptionMentioned ? null : "Whether any amenity or coach failure occurred",
      facts.journeyDateMentioned ? null : "The exact journey date and train number",
    ]),
    explanation:
      "You told us you completed the entire journey to your destination. Under Indian Railways refund rules, standard arrival delays do not entitle a passenger to a ticket refund after completion. However, if you were downgraded in travel class or AC failed en route, you may claim the fare difference.",
    checklist: [
      "Confirm if any coach amenity failure (like AC not working) was officially certified by TTE",
      "If downgraded in travel class, obtain a TTE Certificate for difference of fare",
      "Do not file for full refund under delay rules, as completed journeys will be rejected",
    ],
    deadlineKnown: facts.journeyDateTime !== "",
    decisionBasis: {
      keyFact: "Passenger boarded the train and travelled to the final booked destination.",
      ruleApplied: "Indian Railways Refund Rule: Delay on arrival does NOT entitle a passenger to a refund once transportation service has been delivered. Only certified amenity deficiencies (e.g. AC failure, coach downgrade) allow partial fare difference claims.",
      counterfactual: "If you had opted not to board when the train was delayed >3 hours, you would have qualified under Scenario A for a full refund.",
      whyThisMatters: "Under Indian Railways rules, arrival delay alone does not qualify for a ticket refund once transportation service is completed to destination. Attempting to file for full delay refund on a completed journey leads to automatic rejection.",
      fallbackAction: "If you experienced coach amenity failure (like AC failure) or lower-class downgrade during your trip, submit your TTE difference-in-fare certificate to claim partial fare adjustment.",
      officialSourceUrl: "https://www.operations.irctc.co.in/ctrs/ruleRefund.html",
    },
    requiredFacts: [
      "Completed travel confirmation",
    ],
    optionalFacts: [
      "TTE certificate for AC failure or coach downgrade (if claiming difference of fare)",
    ],
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
    decisionBasis: {
      keyFact: "Critical travel facts (whether passenger travelled, boarded, or completed journey) remain unconfirmed.",
      ruleApplied: "Decision Engine Integrity: To prevent erroneous or fraudulent filings, TDR Sahayak never guesses eligibility without confirmed travel and disruption status.",
      counterfactual: "Once you clarify whether you boarded and travelled, your case will immediately map to Scenario A, B, C, or E.",
      whyThisMatters: "Filing a claim without confirming whether you boarded or completed your journey risks selecting the wrong TDR code. TDR Sahayak pauses rather than guessing to protect you from an immediate claim rejection.",
      fallbackAction: "Check your IRCTC booking history or SMS confirmation to verify journey status and train timings before re-submitting.",
      officialSourceUrl: "https://www.operations.irctc.co.in/ctrs/ruleRefund.html",
    },
    requiredFacts: [
      "Travel status (Did you travel on this ticket?)",
      "Boarding status (Were you able to board?)",
      "Disruption description",
    ],
    optionalFacts: [
      "Train number and journey date",
      "PNR / Booking reference",
    ],
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
