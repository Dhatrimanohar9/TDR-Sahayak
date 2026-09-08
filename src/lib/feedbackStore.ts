import type { FeedbackOutcome, FeedbackStats, OutcomeFeedback } from "../types";

const FEEDBACK_STORAGE_KEY = "tdr-sahayak-feedback-v1";

const OUTCOME_LABELS: Record<FeedbackOutcome, string> = {
  completed: "I completed the recommended action",
  need_help: "I need more help",
  could_not_complete: "I could not complete the action",
  different_action: "I chose a different action",
  other: "Something else",
};

export function saveFeedback(
  entry: Omit<OutcomeFeedback, "id" | "timestamp" | "outcomeLabel">,
): OutcomeFeedback {
  const all = loadFeedback();
  const feedback: OutcomeFeedback = {
    ...entry,
    id: `FB-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    outcomeLabel: OUTCOME_LABELS[entry.selectedOutcome] ?? "Feedback recorded",
  };
  all.unshift(feedback);
  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage might be unavailable in private browsing quota limits
  }
  return feedback;
}

export function listFeedback(): OutcomeFeedback[] {
  return loadFeedback();
}

export function getFeedbackStats(): FeedbackStats {
  const items = loadFeedback();
  const byOutcome: Record<FeedbackOutcome, number> = {
    completed: 0,
    need_help: 0,
    could_not_complete: 0,
    different_action: 0,
    other: 0,
  };

  let helpfulCount = 0;
  let needHelpCount = 0;
  let correctedCount = 0;

  for (const item of items) {
    if (item.selectedOutcome in byOutcome) {
      byOutcome[item.selectedOutcome]++;
    }
    if (item.selectedOutcome === "need_help" || item.selectedOutcome === "could_not_complete") {
      needHelpCount++;
    }
    if (item.recommendedActionHelpful !== false) {
      helpfulCount++;
    }
    if (item.userCorrectedInitialAnswer) {
      correctedCount++;
    }
  }

  const helpfulPct =
    items.length > 0 ? Math.round((helpfulCount / items.length) * 100) : 100;

  return {
    total: items.length,
    byOutcome,
    needHelpCount,
    correctedCount,
    helpfulCount,
    helpfulPct,
    recent: items.slice(0, 10),
  };
}

export function clearFeedback(): void {
  try {
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function loadFeedback(): OutcomeFeedback[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutcomeFeedback[]) : [];
  } catch {
    return [];
  }
}

/** Seed demo feedback for showcase if empty. */
export function seedSampleFeedbackIfEmpty(): void {
  const current = loadFeedback();
  if (current.length > 0) return;

  const samples: Omit<OutcomeFeedback, "id" | "timestamp" | "outcomeLabel">[] = [
    {
      scenario: "A",
      scenarioTitle: "Delayed train — did not travel",
      recommendedAction: "Review applicable TDR refund reason for delayed train",
      selectedOutcome: "completed",
      recommendedActionHelpful: true,
      textFeedback: "Checked the IRCTC TDR page and confirmed my ticket was unused. Filed under >3 hours delay.",
      language: "English",
      userCorrectedInitialAnswer: true,
    },
    {
      scenario: "C",
      scenarioTitle: "Partial journey disruption — travelled part of route",
      recommendedAction: "Obtain deboarding certificate at Kazipet",
      selectedOutcome: "need_help",
      recommendedActionHelpful: true,
      textFeedback: "I checked the details but I am still confused about the deadline to upload the TTE memo.",
      language: "English",
      userCorrectedInitialAnswer: false,
    },
    {
      scenario: "B",
      scenarioTitle: "Could not board the train",
      recommendedAction: "Gather proof of platform disruption",
      selectedOutcome: "could_not_complete",
      recommendedActionHelpful: false,
      textFeedback: "The website did not let me complete the process because no station memo was available.",
      language: "English",
      userCorrectedInitialAnswer: false,
    },
    {
      scenario: "E",
      scenarioTitle: "Travelled and completed journey",
      recommendedAction: "Claim difference in fare for AC failure",
      selectedOutcome: "different_action",
      recommendedActionHelpful: true,
      textFeedback: "Decided to file through RailMadad instead of filing a full fare TDR.",
      language: "English",
      userCorrectedInitialAnswer: false,
    },
  ];

  for (const s of samples) {
    saveFeedback(s);
  }
}
