import type { AnalysisResult } from "../../types";
import {
  computeMissingFacts,
  fallbackAnalyze,
  pickNextQuestion,
} from "./fallbackParser";

/**
 * AI interpretation layer.
 *
 * `analyzeIncident(text)` is the single entry point the app uses. It posts to
 * the server-side proxy at /api/analyze, which injects the OPENAI_API_KEY from
 * the server environment — the key never reaches frontend code. If the proxy
 * is not configured or fails for any reason, the deterministic fallback parser
 * takes over so the demo always works.
 */

const ANALYZE_ENDPOINT = "/api/analyze";

export async function analyzeIncident(text: string): Promise<AnalysisResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      ...fallbackAnalyze(trimmed),
      error: "empty-input",
    };
  }

  try {
    const res = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    const data = await res.json();

    // 503 with configured:false means the demo runs without an API key —
    // fall back silently so the UI never suggests anything went wrong.
    if (
      data &&
      typeof data === "object" &&
      (data as { configured?: boolean }).configured === false
    ) {
      return fallbackAnalyze(trimmed);
    }

    if (!res.ok) throw new Error(`proxy returned ${res.status}`);

    const result = validateAnalysis(data);
    if (!result) throw new Error("proxy returned an unusable analysis");

    // Merge the deterministic missing-fact computation so follow-up questions
    // stay consistent no matter which engine ran.
    const missingFacts = computeMissingFacts(result.facts);
    return {
      ...result,
      missingFacts,
      suggestedQuestion: pickNextQuestion(result.facts, missingFacts),
    };
  } catch {
    // AI was attempted but failed — fall back deterministically and let the
    // UI show a gentle "let's clarify" note. Never surface technical errors.
    return { ...fallbackAnalyze(trimmed), error: "ai-failed" };
  }
}

/** Defensive validation: any malformed AI output degrades to the fallback. */
function validateAnalysis(data: unknown): AnalysisResult | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const factsObj = (d.facts && typeof d.facts === "object" ? d.facts : d) as Record<string, unknown>;

  const allowedIncidentTypes = [
    "delay_not_travelled",
    "could_not_board",
    "travelled_disrupted",
    "ambiguous",
  ];
  if (!allowedIncidentTypes.includes(factsObj.incidentType as string)) return null;

  const tri = (v: unknown) =>
    typeof v === "boolean" ? v : "unknown";

  return {
    facts: {
      incidentType: factsObj.incidentType as AnalysisResult["facts"]["incidentType"],
      passengerTravelled: tri(factsObj.passengerTravelled),
      passengerBoarded: tri(factsObj.passengerBoarded),
      delayDuration: (["lt3h", "3to6h", "gt6h"].includes(
        factsObj.delayDuration as string,
      )
        ? factsObj.delayDuration
        : "unsure") as AnalysisResult["facts"]["delayDuration"],
      cancelledBeforeDeparture: tri(factsObj.cancelledBeforeDeparture),
      disruptionMentioned:
        typeof factsObj.disruptionMentioned === "string"
          ? factsObj.disruptionMentioned
          : null,
      journeyDateMentioned:
        typeof factsObj.journeyDateMentioned === "string"
          ? factsObj.journeyDateMentioned
          : null,
    },
    confidence:
      typeof d.confidence === "number"
        ? Math.min(1, Math.max(0, d.confidence))
        : 0.8,
    missingFacts: [],
    suggestedQuestion: null,
    summary:
      typeof d.summary === "string" && d.summary.length > 0
        ? d.summary
        : "We have noted your description.",
    source: "openai",
  };
}
