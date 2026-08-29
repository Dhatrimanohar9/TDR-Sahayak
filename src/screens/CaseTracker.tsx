import { useState } from "react";
import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import type { TrackedCase } from "../types";
import { advanceStatus, listCases } from "../lib/caseStore";
import { formatJourneyDateTime } from "../lib/riskEngine";

const STATUS_LABELS: Record<TrackedCase["status"], string> = {
  created: "Case created",
  under_review: "Under review",
  next_action: "Next action identified",
  outcome_pending: "Mock outcome pending",
};

export function CaseTracker({
  kase,
  onCaseUpdated,
  onStartOver,
  onHome,
}: {
  kase: TrackedCase;
  onCaseUpdated: (k: TrackedCase) => void;
  onStartOver: () => void;
  onHome: () => void;
}) {
  const [othersOpen, setOthersOpen] = useState(false);
  const otherCases = listCases().filter((c) => c.caseId !== kase.caseId);

  const currentIdx = kase.timeline.findIndex((s) => !s.done);

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Case tracker"
        subtitle="A local, synthetic record of your mock case."
        onBack={onHome}
      />

      <Card className="bg-rail-900 text-white" >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rail-100">
              Case ID
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wide text-amber-signal">
              {kase.caseId}
            </p>
            <p className="mt-1 text-xs text-rail-100">
              Created {formatJourneyDateTime(kase.createdAt)}
            </p>
          </div>
          <Badge tone="amber">{STATUS_LABELS[kase.status]}</Badge>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">Progress</h2>
        <ol className="mt-4">
          {kase.timeline.map((step, i) => {
            const active = i === currentIdx;
            return (
              <li key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      step.done
                        ? "bg-rail-600 text-white"
                        : active
                          ? "bg-amber-signal text-rail-950"
                          : "bg-rail-100 text-rail-700"
                    }`}
                  >
                    {step.done ? "✓" : i + 1}
                  </span>
                  {i < kase.timeline.length - 1 && (
                    <span
                      aria-hidden
                      className={`w-0.5 flex-1 ${step.done ? "bg-rail-600" : "bg-rail-100"}`}
                      style={{ minHeight: 30 }}
                    />
                  )}
                </div>
                <div className="pb-7">
                  <p
                    className={`text-sm font-semibold ${step.done ? "text-rail-950" : active ? "text-rail-950" : "text-stone-500"}`}
                  >
                    {step.label}
                  </p>
                  {step.at && (
                    <p className="text-xs text-stone-500">
                      {formatJourneyDateTime(step.at)}
                    </p>
                  )}
                  {active && (
                    <p className="mt-1 text-xs font-medium text-amber-800">
                      In progress in this demo
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {kase.status !== "outcome_pending" && (
          <Button
            variant="secondary"
            onClick={() => onCaseUpdated(advanceStatus(kase))}
            className="mt-1"
          >
            Simulate next review step (demo)
          </Button>
        )}
        {kase.status === "outcome_pending" && (
          <p className="mt-2 rounded-xl bg-rail-50 px-3.5 py-3 text-sm text-rail-900">
            Your mock case has reached the end of the demo pipeline. The mock
            outcome stays pending by design.
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">What happens next?</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">
          In a real implementation, this layer could connect to the appropriate
          official process — for example, guiding you to the official refund or
          TDR filing channel with your facts already organised. This prototype
          does not connect to government systems, and no real claim has been or
          will be filed.
        </p>
        <div className="mt-3 rounded-xl bg-rail-50 px-3.5 py-3">
          <p className="text-sm font-semibold text-rail-950">Your next action</p>
          <p className="mt-1 text-sm text-stone-700">
            {kase.decision.recommendedAction}
          </p>
        </div>
      </Card>

      {otherCases.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setOthersOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-rail-100 bg-white px-4 py-3.5 text-left text-sm font-semibold text-rail-900 hover:bg-rail-50"
          >
            Other mock cases in this browser ({otherCases.length})
            <span aria-hidden>{othersOpen ? "▾" : "▸"}</span>
          </button>
          {othersOpen && (
            <ul className="mt-2 grid gap-2">
              {otherCases.map((c) => (
                <li
                  key={c.caseId}
                  className="flex items-center justify-between rounded-xl border border-rail-100 bg-white px-4 py-3"
                >
                  <span className="font-mono text-sm text-rail-950">{c.caseId}</span>
                  <span className="text-xs text-stone-500">
                    {STATUS_LABELS[c.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <Button onClick={onStartOver}>Start over</Button>
        <Button variant="ghost" onClick={onHome}>
          Back to home
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
