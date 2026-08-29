/**
 * Shared domain types for TDR Sahayak.
 *
 * The flow: free text → AI interpretation → structured facts →
 * deterministic decision engine → rule-based risk/deadline check →
 * AI-assisted plain-language explanation.
 */

/** Broad incident classification, derived from the citizen's description. */
export type IncidentType =
  | "delay_not_travelled"
  | "could_not_board"
  | "travelled_disrupted"
  | "ambiguous";

/** How long the train was delayed, as understood from the story. */
export type DelayDuration = "lt3h" | "3to6h" | "gt6h" | "unsure";

/** Structured facts extracted from the citizen's description. */
export interface IncidentFacts {
  incidentType: IncidentType;
  passengerTravelled: boolean | "unknown";
  passengerBoarded: boolean | "unknown";
  delayDuration: DelayDuration;
  cancelledBeforeDeparture: boolean | "unknown";
  disruptionMentioned: string | null;
  journeyDateMentioned: string | null;
}

/** Output of the AI interpretation layer. */
export interface AnalysisResult {
  facts: IncidentFacts;
  /** 0–1. How confident the interpretation is. */
  confidence: number;
  /** Fact keys that still need an answer before a decision can be made. */
  missingFacts: MissingFactKey[];
  /** The single most useful follow-up question to ask next. */
  suggestedQuestion: FollowUpQuestion | null;
  /** Short human-readable summary of the incident, in the app's voice. */
  summary: string;
  /** Which engine produced this result. */
  source: "openai" | "fallback";
  error?: string;
}

export type MissingFactKey =
  | "passengerTravelled"
  | "passengerBoarded"
  | "delayDuration"
  | "cancelledBeforeDeparture"
  | "disruptionType"
  | "journeyDate";

export interface FollowUpOption {
  value: string;
  label: string;
}

export interface FollowUpQuestion {
  id: MissingFactKey | "clarifyDisruption";
  prompt: string;
  options: FollowUpOption[];
}

/** Fully answered fact set fed into the deterministic decision engine. */
export interface CaseFacts extends IncidentFacts {
  incidentText: string;
  /** ISO date-time of the (synthetic) journey. */
  journeyDateTime: string;
}

export type RiskLevel = "low" | "medium" | "high";

export type DecisionScenario = "A" | "B" | "C" | "D";

export interface DecisionResult {
  scenario: DecisionScenario;
  scenarioTitle: string;
  classification: string;
  recommendedAction: string;
  riskLevel: RiskLevel;
  riskNote: string;
  missingInformation: string[];
  explanation: string;
  checklist: string[];
  deadlineKnown: boolean;
}

export interface DeadlineAssessment {
  riskLevel: RiskLevel;
  status: "within_window" | "window_closing" | "outside_window" | "info_needed";
  statusLabel: string;
  statusDetail: string;
  /** Human-readable hours elapsed since the (synthetic) journey time. */
  elapsedNote: string;
}

export type CaseStatus =
  | "created"
  | "under_review"
  | "next_action"
  | "outcome_pending";

export interface TrackedCase {
  caseId: string;
  createdAt: string;
  facts: CaseFacts;
  decision: DecisionResult;
  deadline: DeadlineAssessment;
  status: CaseStatus;
  timeline: { label: string; done: boolean; at: string | null }[];
}

/** One-button demo scenarios shown on the incident input screen. */
export interface DemoScenario {
  id: string;
  shortLabel: string;
  text: string;
}
