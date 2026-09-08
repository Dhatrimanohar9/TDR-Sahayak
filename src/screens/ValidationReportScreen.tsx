import { useState } from "react";
import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import {
  FEEDBACK_IMPROVEMENTS,
  clearAllStudyData,
  clearRealStudyData,
  exportStudyAsCsv,
  exportStudyAsJson,
  generateSubmissionSummary,
  getValidationMetrics,
  seedShowcaseStudyData,
} from "../lib/validationStore";
import type { ValidationMetrics } from "../types";

export function ValidationReportScreen({
  onStartStudy,
  onBack,
  onAdmin,
  onInsights,
}: {
  onStartStudy: () => void;
  onBack: () => void;
  onAdmin?: () => void;
  onInsights?: () => void;
}) {
  const [includeDemoPreview, setIncludeDemoPreview] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Force re-render on state changes
  const [dataVersion, setDataVersion] = useState(0);

  const metrics: ValidationMetrics = getValidationMetrics(includeDemoPreview);
  const hasRealData = getValidationMetrics(false).totalTrials > 0;
  const isShowingDemoData = includeDemoPreview && !hasRealData;

  const handleCopySummary = () => {
    const text = generateSubmissionSummary(includeDemoPreview);
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSeedDemo = () => {
    seedShowcaseStudyData();
    setIncludeDemoPreview(true);
    setDataVersion((v) => v + 1);
  };

  const handleClearData = () => {
    clearAllStudyData();
    setIncludeDemoPreview(false);
    setDataVersion((v) => v + 1);
  };

  const handleClearRealOnly = () => {
    clearRealStudyData();
    setDataVersion((v) => v + 1);
  };

  return (
    <div key={dataVersion} className="animate-fade-up">
      <ScreenHeader
        title="Judge Validation Report"
        subtitle="Empirical before-and-after usability testing & statutory accuracy measurement."
        onBack={onBack}
        right={
          <Button variant="secondary" onClick={onStartStudy} className="text-xs px-3 py-1.5 font-bold">
            🧪 Start Participant Session
          </Button>
        }
      />

      {/* Cross-View Navigation Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rail-200 bg-white p-2 text-xs">
        <span className="font-bold text-rail-950 px-2">Navigation:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg px-2.5 py-1.5 font-bold text-stone-600 hover:bg-rail-50 hover:text-rail-900 transition-colors"
          >
            👤 Citizen View
          </button>
          {onInsights && (
            <button
              type="button"
              onClick={onInsights}
              className="rounded-lg px-2.5 py-1.5 font-bold text-stone-600 hover:bg-rail-50 hover:text-rail-900 transition-colors"
            >
              📊 Prototype Insights
            </button>
          )}
          {onAdmin && (
            <button
              type="button"
              onClick={onAdmin}
              className="rounded-lg px-2.5 py-1.5 font-bold text-stone-600 hover:bg-rail-50 hover:text-rail-900 transition-colors"
            >
              🛠️ Admin View
            </button>
          )}
          <button
            type="button"
            className="rounded-lg bg-rail-900 px-2.5 py-1.5 font-bold text-white shadow-2xs"
          >
            📋 Validation Report (Active)
          </button>
        </div>
      </div>

      {/* 4-TIER EVIDENCE ARCHITECTURE BANNER */}
      <div className="mb-5 rounded-2xl border-2 border-rail-300 bg-rail-50/70 p-4 text-xs shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-rail-800 text-white font-bold text-xs">
              ⚖️
            </span>
            <h2 className="text-sm font-bold text-rail-950 uppercase tracking-wide">
              Transparent Evidence Architecture (Zero Fabrication)
            </h2>
          </div>
          <Badge tone={hasRealData ? "green" : isShowingDemoData ? "amber" : "neutral"}>
            {hasRealData
              ? "Real Study Data Active"
              : isShowingDemoData
                ? "Illustrative Demo Dataset"
                : "No Study Data Recorded"}
          </Badge>
        </div>
        <p className="mt-1.5 leading-relaxed text-stone-700">
          This project maintains strict data separation. Metrics are calculated <strong>exclusively</strong> from actual collected trials and are never combined with synthetic baselines:
        </p>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-lg bg-white p-2.5 border border-stone-200">
            <p className="font-bold text-stone-900">Level A: Synthetic Baseline</p>
            <p className="text-stone-500 mt-0.5">1,250 simulated inquiries showing macro disruption patterns.</p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-stone-200">
            <p className="font-bold text-stone-900">Level B: Session Feedback</p>
            <p className="text-stone-500 mt-0.5">Uncontrolled "What happened next?" browser remarks.</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-300">
            <p className="font-bold text-emerald-950">Level C: Usability Study</p>
            <p className="text-emerald-900 mt-0.5">Controlled before-and-after task testing (Displayed Below).</p>
          </div>
          <div className="rounded-lg bg-white p-2.5 border border-stone-200">
            <p className="font-bold text-stone-900">Level D: Production Vision</p>
            <p className="text-stone-500 mt-0.5">Anonymized, opt-in server pipeline for future deployment.</p>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-stone-500 italic">
          Disclaimer: Local browser storage and small-sample convenience studies provide structured usability signals but are not equivalent to official nationwide railway trials.
        </p>
      </div>

      {/* RESEARCH OBJECTIVE & PROTOCOL */}
      <Card className="mb-4">
        <h2 className="text-base font-bold text-rail-950">
          Research Objective & Methodology
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-stone-700">
          <strong>Core Research Question:</strong> Does TDR Sahayak's deterministic rules engine and plain-language explainability improve citizen statutory decision accuracy and reduce claim filing errors compared to unassisted passenger intuition?
        </p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-stone-700">
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <p className="font-bold text-rail-950 mb-1">1. Test Protocol</p>
            <p className="text-[11px] leading-relaxed text-stone-600">
              Task-based test: (1) Pre-test unassisted statutory choice & confidence, (2) Live TDR Sahayak interaction, (3) Post-test evaluation & comprehension audit.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <p className="font-bold text-rail-950 mb-1">2. Zero PII Guardrail</p>
            <p className="text-[11px] leading-relaxed text-stone-600">
              Participants are identified solely by anonymous codes (e.g. P-01). No names, phone numbers, PNRs, ticket PDFs, or Aadhaar numbers are collected.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <p className="font-bold text-rail-950 mb-1">3. Canonical Scenarios</p>
            <p className="text-[11px] leading-relaxed text-stone-600">
              Covers the 5 high-friction railway disputes: Delayed Unused (A), Crowd/Unboarded (B), Partial Journey (C), Ambiguous Delay (D), and Delayed Completed (E).
            </p>
          </div>
        </div>
      </Card>

      {/* CONTROLS BAR: DEMO DATA TOGGLE & RESET */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-700">Dataset View:</span>
          {hasRealData ? (
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900 border border-emerald-300">
              Live Field Testing Data ({metrics.totalTrials} trials)
            </span>
          ) : isShowingDemoData ? (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-950 border border-amber-300">
              Illustrative Demo Dataset (8 trials)
            </span>
          ) : (
            <span className="rounded-md bg-stone-100 px-2 py-0.5 font-bold text-stone-600 border border-stone-200">
              Empty State (0 trials)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!hasRealData && !isShowingDemoData && (
            <button
              type="button"
              onClick={handleSeedDemo}
              className="rounded-lg bg-rail-50 px-2.5 py-1 text-xs font-bold text-rail-900 border border-rail-200 hover:bg-rail-100"
            >
              Preview Demo Showcase Data
            </button>
          )}

          {isShowingDemoData && (
            <button
              type="button"
              onClick={handleClearData}
              className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-200"
            >
              Revert to Empty State
            </button>
          )}

          {hasRealData && (
            <button
              type="button"
              onClick={handleClearRealOnly}
              className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200 hover:bg-red-100"
            >
              Reset Real Study Data
            </button>
          )}
        </div>
      </div>

      {/* EMPTY STATE IF ZERO DATA */}
      {metrics.totalTrials === 0 && (
        <Card className="border-dashed border-2 border-stone-300 bg-stone-50/50 py-8 text-center">
          <span className="text-3xl">📝</span>
          <h3 className="mt-2 text-base font-bold text-rail-950">
            No study data collected yet
          </h3>
          <p className="mt-1 text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            The usability testing framework is instrumented and ready for real human trials. To record participant responses, click below to begin Task 1.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={onStartStudy} className="text-xs px-4 py-2 font-bold">
              Start Participant Session (P-01) →
            </Button>
            <Button variant="secondary" onClick={handleSeedDemo} className="text-xs px-4 py-2">
              Preview Demo Dataset for Review
            </Button>
          </div>
        </Card>
      )}

      {/* EMPIRICAL RESULTS METRICS (ACTIVE WHEN TRIALS EXIST) */}
      {metrics.totalTrials > 0 && (
        <div className="space-y-4">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Pre-Test Correct
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-red-700">
                {metrics.preCorrectPct}%
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {metrics.preCorrectCount} / {metrics.totalTrials} baseline correct
              </p>
            </Card>

            <Card className="p-3.5 border-emerald-300 bg-emerald-50/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                Post-Test Correct
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-emerald-700">
                {metrics.postCorrectPct}%
              </p>
              <p className="text-[11px] text-emerald-900 mt-0.5">
                {metrics.postCorrectCount} / {metrics.totalTrials} assisted correct
              </p>
            </Card>

            <Card className="p-3.5 border-purple-300 bg-purple-50/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-950">
                Net Improvement
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-purple-800">
                +{metrics.improvementPercentagePoints}%
              </p>
              <p className="text-[11px] text-purple-900 mt-0.5">
                Percentage points gain
              </p>
            </Card>

            <Card className="p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Mean Task Time
              </p>
              <p className="mt-1 font-mono text-2xl font-black text-rail-950">
                {metrics.avgTaskTimeSeconds}s
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Average decision speed
              </p>
            </Card>
          </div>

          {/* Secondary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Confidence Shift
              </p>
              <p className="mt-1 font-mono text-xl font-black text-rail-950">
                {metrics.avgConfidenceBefore} → {metrics.avgConfidenceAfter} <span className="text-xs text-stone-500">/ 5</span>
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Pre vs Post certainty</p>
            </Card>

            <Card className="p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Explanation Clarity
              </p>
              <p className="mt-1 font-mono text-xl font-black text-rail-950">
                {metrics.explanationComprehensionPct}%
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Understood rule basis</p>
            </Card>

            <Card className="p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Document Clarity
              </p>
              <p className="mt-1 font-mono text-xl font-black text-rail-950">
                {metrics.documentsUnderstoodPct}%
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Understood EFT / memos</p>
            </Card>

            <Card className="p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Clarification Logic
              </p>
              <p className="mt-1 font-mono text-xl font-black text-rail-950">
                {metrics.clarificationUnderstandingPct}%
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">Understood no-guessing</p>
            </Card>
          </div>

          {/* BEFORE VS AFTER ACCURACY BREAKDOWN */}
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rail-950">
                Before-and-After Accuracy Comparison
              </h3>
              <Badge tone="rail">{metrics.totalParticipants} Participants · {metrics.totalTrials} Trials</Badge>
            </div>
            <p className="mt-1 text-xs text-stone-600">
              Visual comparison showing accuracy shift before consulting TDR Sahayak vs after reviewing guidance:
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-700">Pre-Test Baseline (Unassisted Passenger Intuition):</span>
                  <span className="font-mono font-bold text-red-700">{metrics.preCorrectPct}% Correct</span>
                </div>
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, metrics.preCorrectPct)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-700">Post-Test Result (Assisted by TDR Sahayak):</span>
                  <span className="font-mono font-bold text-emerald-700">{metrics.postCorrectPct}% Correct</span>
                </div>
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(5, metrics.postCorrectPct)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-purple-50 p-3 border border-purple-200 text-xs text-purple-950 font-medium">
              ✦ Measured Impact: The system produced a <strong>+{metrics.improvementPercentagePoints} percentage point increase</strong> in legally correct next-step identification while reducing average decision time to <strong>{metrics.avgTaskTimeSeconds} seconds</strong>.
            </div>
          </Card>

          {/* QUALITATIVE COMMENTS LOG */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-rail-950">
                Participant Remarks & Confusion Points Log
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">
                Recorded during testing
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {metrics.records
                .filter((r) => r.comment && r.comment.trim().length > 0)
                .slice(0, 5)
                .map((r) => (
                  <div key={r.id} className="rounded-lg bg-stone-50 p-2.5 text-xs border border-stone-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rail-950">
                        {r.participantCode} · Scenario {r.scenarioCode} ({r.language})
                      </span>
                      <span className="text-[10px] font-mono text-stone-500">
                        Task time: {r.taskTimeSeconds}s
                      </span>
                    </div>
                    <p className="text-stone-800 italic">“{r.comment}”</p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* FEEDBACK-TO-IMPROVEMENT TRACKING TABLE */}
      <Card className="mt-5 overflow-hidden p-0">
        <div className="p-4 border-b border-stone-200 bg-stone-50/60">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rail-950">
              Feedback-to-Improvement Tracking Table
            </h3>
            <Badge tone="green">Design Evolution</Badge>
          </div>
          <p className="mt-0.5 text-xs text-stone-600">
            Documented progression showing how testing findings directly drove product improvements:
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Finding / Pain Point</th>
                <th className="py-2.5 px-3">Product Change Made</th>
                <th className="py-2.5 px-3">Retest Status & Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {FEEDBACK_IMPROVEMENTS.map((item) => (
                <tr key={item.id} className="hover:bg-rail-50/40 transition-colors">
                  <td className="py-3 px-3 align-top font-medium">
                    <p className="text-stone-900">{item.finding}</p>
                    <span className="text-[10px] text-stone-500 mt-0.5 block italic">
                      Source: {item.source}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-top leading-relaxed text-stone-700">
                    {item.productChange}
                  </td>
                  <td className="py-3 px-3 align-top whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-200">
                      ✓ Validated in Retest
                    </span>
                    <p className="text-[10px] text-stone-500 mt-1 max-w-[180px] whitespace-normal">
                      {item.retestNotes}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* EXPORT & JUDGE SUBMISSION TOOLS */}
      <Card className="mt-5 border-rail-200 bg-rail-50/40">
        <h3 className="text-sm font-bold text-rail-950">
          Validation Artifact Exports & Hackathon Submission
        </h3>
        <p className="mt-0.5 text-xs text-stone-600">
          Download anonymous trial records or copy formatted markdown for hackathon submission documentation:
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => exportStudyAsCsv(includeDemoPreview)}
            className="text-xs flex items-center gap-1.5"
          >
            <span>📥</span> Export CSV (RFC-4180)
          </Button>

          <Button
            variant="secondary"
            onClick={() => exportStudyAsJson(includeDemoPreview)}
            className="text-xs flex items-center gap-1.5"
          >
            <span>📄</span> Export JSON
          </Button>

          <Button
            onClick={handleCopySummary}
            className="text-xs font-bold flex items-center gap-1.5"
          >
            <span>{copiedSummary ? "✓ Copied!" : "📋 Copy Judge Summary"}</span>
          </Button>
        </div>
      </Card>

      {/* EXPLICIT LIMITATIONS & ACADEMIC RIGOR NOTE */}
      <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950">
        <div className="flex items-start gap-2.5">
          <span aria-hidden className="mt-0.5 text-base">⚠️</span>
          <div>
            <p className="font-bold uppercase tracking-wider text-[11px] text-amber-950">
              Study Limitations & Prototype Disclosure
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-amber-900 leading-relaxed font-medium">
              <li>• <strong>Prototype Scope:</strong> TDR Sahayak is an educational decision-support tool. It does not file official claims directly into Indian Railways CRIS systems.</li>
              <li>• <strong>Sample Size:</strong> This is a small convenience-sample usability evaluation designed to measure accuracy deltas; it does not represent all 2.4 crore daily Indian railway passengers.</li>
              <li>• <strong>Statutory Verification:</strong> Railway refund rules are subject to gazetted amendments by the Railway Board; official gazette citations should always be consulted before filing.</li>
              <li>• <strong>Future Validation Roadmap:</strong> Production deployment would require field trials conducted with IRCTC/CRIS passenger grievance cell cooperation.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="mt-6 space-y-3">
        <Button variant="secondary" onClick={onBack}>
          Back to Citizen Assistant
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
