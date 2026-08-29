import type { CaseFacts, DeadlineAssessment, RiskLevel } from "../types";
import { PROTOTYPE_WINDOW_HOURS, PROTOTYPE_OUTER_HOURS, hoursSince } from "./decisionEngine";

/**
 * Rule-based deadline/risk check.
 *
 * These are clearly-labelled PROTOTYPE rules for the demo — not live IRCTC
 * rules. They exist to show how a deadline-awareness layer would behave.
 */

export function assessDeadline(facts: CaseFacts): DeadlineAssessment {
  const hours = hoursSince(facts.journeyDateTime);

  if (hours === null) {
    return {
      riskLevel: "medium",
      status: "info_needed",
      statusLabel: "Information needed to assess timing",
      statusDetail:
        "Tell us when the journey was scheduled and we can estimate where you stand in the claim window.",
      elapsedNote: "",
    };
  }

  if (hours <= 24) {
    return {
      riskLevel: "low",
      status: "within_window",
      statusLabel: "Within prototype decision window",
      statusDetail: `About ${formatHours(hours)} have passed since your journey time. In this prototype, acting within the first day is the comfortable zone.`,
      elapsedNote: formatHours(hours),
    };
  }

  if (hours <= PROTOTYPE_WINDOW_HOURS) {
    return {
      riskLevel: "low",
      status: "within_window",
      statusLabel: "Within prototype decision window",
      statusDetail: `About ${formatHours(hours)} have passed. This is still inside the prototype's ${PROTOTYPE_WINDOW_HOURS}-hour comfort window, but earlier is always better.`,
      elapsedNote: formatHours(hours),
    };
  }

  if (hours <= PROTOTYPE_OUTER_HOURS) {
    return {
      riskLevel: "medium",
      status: "window_closing",
      statusLabel: "Window may be closing",
      statusDetail: `About ${formatHours(hours)} have passed — beyond the prototype's ${PROTOTYPE_WINDOW_HOURS}-hour comfort window. Your claim may become more difficult if you wait.`,
      elapsedNote: formatHours(hours),
    };
  }

  return {
    riskLevel: "high",
    status: "outside_window",
    statusLabel: "Outside the prototype window",
    statusDetail: `About ${formatHours(hours)} have passed. Under the prototype's demo rules, claims this old often become difficult. This prototype does not guarantee eligibility either way — please verify against the official process.`,
    elapsedNote: formatHours(hours),
  };
}

/** Risk shown on the decision screen, before the journey time is confirmed. */
export function preliminaryRisk(level: RiskLevel): { label: string; note: string } {
  switch (level) {
    case "low":
      return {
        label: "Low",
        note: "Based on what you told us, timing looks manageable — but don’t wait long.",
      };
    case "medium":
      return {
        label: "Medium",
        note: "Your claim may become more difficult if you wait.",
      };
    case "high":
      return {
        label: "High",
        note: "A lot of time appears to have passed. Act soon and verify against the official process.",
      };
  }
}

function formatHours(hours: number): string {
  if (hours < 1) return "less than an hour";
  if (hours < 48) return `${Math.round(hours)} hour${Math.round(hours) === 1 ? "" : "s"}`;
  return `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"}`;
}

/** Default synthetic journey time used when the citizen doesn't pick one. */
export function defaultJourneyDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(18, 30, 0, 0);
  return toLocalInputValue(d);
}

/** Format a datetime-local input value into something readable. */
export function formatJourneyDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
