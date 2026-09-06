import type { CaseFacts, DeadlineAssessment, DecisionResult, TrackedCase } from "../types";

/**
 * Case tracking store — local mock state persisted in localStorage.
 * Purely synthetic; nothing here reaches any external system.
 */

const STORAGE_KEY = "tdr-sahayak-cases-v1";

export function createCase(
  facts: CaseFacts,
  decision: DecisionResult,
  deadline: DeadlineAssessment,
): TrackedCase {
  const now = new Date().toISOString();
  const kase: TrackedCase = {
    caseId: generateCaseId(),
    createdAt: now,
    facts,
    decision,
    deadline,
    status: "created",
    timeline: [
      { label: "Case created", done: true, at: now },
      { label: "Under review", done: false, at: null },
      { label: "Next action identified", done: false, at: null },
      { label: "Mock outcome pending", done: false, at: null },
      { label: "Simulated outcome resolved", done: false, at: null },
    ],
  };
  saveCase(kase);
  return kase;
}

/** Simulated review progression for the tracker demo. */
export function advanceStatus(kase: TrackedCase): TrackedCase {
  const now = new Date().toISOString();
  const order: TrackedCase["status"][] = [
    "created",
    "under_review",
    "next_action",
    "outcome_pending",
    "resolved",
  ];
  const idx = Math.min(
    order.indexOf(kase.status) + 1,
    order.length - 1,
  );
  // Ensure timeline has 5 steps even for older local cases
  const baseTimeline =
    kase.timeline.length >= 5
      ? kase.timeline
      : [
          ...kase.timeline,
          { label: "Simulated outcome resolved", done: false, at: null },
        ];

  const updated: TrackedCase = {
    ...kase,
    status: order[idx],
    timeline: baseTimeline.map((step, i) =>
      i <= idx ? { ...step, done: true, at: step.at ?? now } : step,
    ),
  };
  saveCase(updated);
  return updated;
}

export function getCase(caseId: string): TrackedCase | null {
  return loadCases().find((c) => c.caseId === caseId) ?? null;
}

export function listCases(): TrackedCase[] {
  return loadCases().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function generateCaseId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TDR-DEMO-${year}-${rand}`;
}

function loadCases(): TrackedCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrackedCase[]) : [];
  } catch {
    return [];
  }
}

function saveCase(kase: TrackedCase) {
  try {
    const all = loadCases().filter((c) => c.caseId !== kase.caseId);
    all.push(kase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable (private mode) — the case lives in memory for this
    // session only. Never surface this to the user.
  }
}
