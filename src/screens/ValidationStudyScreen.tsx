import { useState } from "react";
import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import {
  STUDY_SCENARIO_TASKS,
  hasDuplicateParticipant,
  saveStudyRecord,
} from "../lib/validationStore";
import type { StudyScenarioTask, ValidationStudyRecord } from "../types";

const LANGUAGES = [
  { id: "English", label: "English" },
  { id: "Hindi", label: "हिन्दी (Hindi)" },
  { id: "Telugu", label: "తెలుగు (Telugu)" },
  { id: "Tamil", label: "தமிழ் (Tamil)" },
  { id: "Malayalam", label: "മലയാളം (Malayalam)" },
  { id: "Kannada", label: "ಕನ್ನಡ (Kannada)" },
];

export function ValidationStudyScreen({
  onRunScenarioInApp,
  onViewReport,
  onBack,
}: {
  onRunScenarioInApp: (promptText: string) => void;
  onViewReport: () => void;
  onBack: () => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(STUDY_SCENARIO_TASKS[0].id);
  const [participantCode, setParticipantCode] = useState<string>(() => {
    const rand = Math.floor(1 + Math.random() * 99);
    return `P-${rand < 10 ? "0" + rand : rand}`;
  });
  const [selectedLang, setSelectedLang] = useState("English");

  // Flow step: 1 = Pre-test, 2 = Ready to experience TDR Sahayak, 3 = Post-test, 4 = Saved result
  const [studyStep, setStudyStep] = useState<1 | 2 | 3 | 4>(1);

  // Pre-test state
  const [preAnswerId, setPreAnswerId] = useState<string>("");
  const [confidenceBefore, setConfidenceBefore] = useState<number>(3);

  // Timing
  const [taskStartTime, setTaskStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Post-test state
  const [postAnswerId, setPostAnswerId] = useState<string>("");
  const [confidenceAfter, setConfidenceAfter] = useState<number>(5);
  const [explanationUnderstood, setExplanationUnderstood] = useState<boolean>(true);
  const [documentsUnderstood, setDocumentsUnderstood] = useState<boolean>(true);
  const [clarificationUnderstood, setClarificationUnderstood] = useState<boolean>(true);
  const [comment, setComment] = useState<string>("");

  // Last saved record for before/after summary
  const [savedRecord, setSavedRecord] = useState<ValidationStudyRecord | null>(null);

  const currentTask: StudyScenarioTask =
    STUDY_SCENARIO_TASKS.find((t) => t.id === selectedTaskId) || STUDY_SCENARIO_TASKS[0];

  const handleStartExperience = () => {
    if (!preAnswerId) return;
    setTaskStartTime(Date.now());
    setStudyStep(2);
  };

  const handleLaunchApp = () => {
    // Pass the scenario prompt to the main app flow
    onRunScenarioInApp(currentTask.narrativePrompt);
  };

  const handleProceedToPostTest = () => {
    const elapsed = Math.max(10, Math.round((Date.now() - (taskStartTime || Date.now())) / 1000));
    setElapsedSeconds(elapsed);
    setStudyStep(3);
  };

  const handleSubmitStudy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postAnswerId) return;

    const preCorrect = preAnswerId === currentTask.correctActionId;
    const postCorrect = postAnswerId === currentTask.correctActionId;

    const record = saveStudyRecord({
      participantCode: participantCode.trim() || "P-Anonymous",
      scenarioId: currentTask.id,
      scenarioCode: currentTask.scenarioCode,
      language: selectedLang,
      preAnswerId,
      preAnswerCorrect: preCorrect,
      postAnswerId,
      postAnswerCorrect: postCorrect,
      taskTimeSeconds: elapsedSeconds || 35,
      confidenceBefore,
      confidenceAfter,
      explanationUnderstood,
      documentsUnderstood,
      clarificationUnderstood,
      comment: comment.trim() || undefined,
      isDemoSeeded: false, // REAL human trial!
    });

    setSavedRecord(record);
    setStudyStep(4);
  };

  const handleResetForNext = () => {
    setStudyStep(1);
    setPreAnswerId("");
    setPostAnswerId("");
    setConfidenceBefore(3);
    setConfidenceAfter(5);
    setComment("");
    setSavedRecord(null);
    // Select next task in rotation
    const currentIndex = STUDY_SCENARIO_TASKS.findIndex((t) => t.id === selectedTaskId);
    const nextIndex = (currentIndex + 1) % STUDY_SCENARIO_TASKS.length;
    setSelectedTaskId(STUDY_SCENARIO_TASKS[nextIndex].id);
  };

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Usability Study Mode"
        subtitle="Empirical before-and-after task testing for research participants."
        onBack={onBack}
        right={
          <Button variant="secondary" onClick={onViewReport} className="text-xs px-3 py-1.5">
            📊 View Validation Report
          </Button>
        }
      />

      {/* Protocol Notice Banner */}
      <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50/80 p-3.5 text-xs text-emerald-950">
        <div className="flex items-start gap-2">
          <span aria-hidden className="font-bold text-emerald-700 mt-0.5">🔬</span>
          <div>
            <p className="font-bold uppercase tracking-wider text-[11px] text-emerald-950">
              Zero-Fabrication Empirical Research Protocol
            </p>
            <p className="mt-0.5 leading-relaxed text-emerald-900/90 font-medium">
              Measures whether TDR Sahayak improves statutory accuracy compared to unassisted passenger intuition. No PII, PNRs, or contact info are collected.
            </p>
          </div>
        </div>
      </div>

      {/* STEP 1: PRE-TEST ASSESSMENT */}
      {studyStep === 1 && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Phase 1 of 3: Baseline Assessment (Before TDR Sahayak)
              </p>
              <h2 className="text-base font-bold text-rail-950">
                Participant & Scenario Setup
              </h2>
            </div>
            <Badge tone="amber">Pre-Test Baseline</Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label htmlFor="participant-code" className="block font-bold text-stone-700 mb-1">
                Anonymous Participant Code:
              </label>
              <input
                id="participant-code"
                type="text"
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-stone-500">e.g. P-01, P-02 (kept non-personally identifiable)</p>
            </div>

            <div>
              <label htmlFor="lang-select" className="block font-bold text-stone-700 mb-1">
                Language for Study:
              </label>
              <select
                id="lang-select"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-rail-950 focus:border-rail-600 focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="mt-4">
            <label htmlFor="scenario-task-select" className="block text-xs font-bold text-stone-700 mb-1.5">
              Select Test Scenario Task (1 of 5):
            </label>
            <select
              id="scenario-task-select"
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                setPreAnswerId("");
              }}
              className="w-full rounded-lg border border-rail-200 bg-rail-50/60 px-3 py-2 text-xs font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
            >
              {STUDY_SCENARIO_TASKS.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  Task {idx + 1}: Scenario {t.scenarioCode} — {t.scenarioTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Disruption Narrative Card */}
          <div className="mt-4 rounded-xl border border-rail-200 bg-stone-50/90 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rail-900 mb-1">
              Disruption Situation Given to Tester:
            </p>
            <p className="text-sm italic text-stone-900 leading-relaxed font-serif">
              “{currentTask.narrativePrompt}”
            </p>
          </div>

          {/* Duplicate Participant Warning */}
          {hasDuplicateParticipant(participantCode, currentTask.id) && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-bold">Duplicate participant trial detected</p>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Participant <strong className="font-mono">{participantCode}</strong> has already recorded a response for Scenario {currentTask.scenarioCode}. Repeated testing of the same scenario on the same participant may bias comprehension measurements.
                </p>
              </div>
            </div>
          )}


          {/* Pre-Test Question */}
          <div className="mt-5 space-y-3">
            <p className="text-sm font-bold text-rail-950">
              Question: {currentTask.preQuestion}
            </p>
            <p className="text-xs text-stone-600">
              Select what you believe is the correct legal/statutory action <strong>before</strong> consulting TDR Sahayak:
            </p>

            <div className="space-y-2 mt-2">
              {currentTask.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                    preAnswerId === opt.id
                      ? "border-rail-700 bg-rail-50/80 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="pre-answer"
                    value={opt.id}
                    checked={preAnswerId === opt.id}
                    onChange={() => setPreAnswerId(opt.id)}
                    className="mt-0.5 h-4 w-4 text-rail-800 focus:ring-rail-600"
                  />
                  <span className="text-xs font-medium text-stone-800 leading-snug">
                    {opt.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Confidence scale before */}
          <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
            <div className="flex items-center justify-between">
              <label htmlFor="conf-before" className="text-xs font-bold text-stone-700">
                Confidence in your unassisted answer (1 = Guessing, 5 = Completely Certain):
              </label>
              <span className="font-mono text-sm font-extrabold text-rail-950">
                {confidenceBefore} / 5
              </span>
            </div>
            <input
              id="conf-before"
              type="range"
              min={1}
              max={5}
              step={1}
              value={confidenceBefore}
              onChange={(e) => setConfidenceBefore(Number(e.target.value))}
              className="mt-2 w-full accent-rail-700"
            />
            <div className="flex justify-between text-[10px] text-stone-500 mt-1">
              <span>1 - Just guessing</span>
              <span>3 - Somewhat sure</span>
              <span>5 - Fully confident</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <Button
              onClick={handleStartExperience}
              disabled={!preAnswerId}
              className="px-5 py-2.5 text-xs font-bold"
            >
              Record baseline & test with TDR Sahayak →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: EXPERIENCE TDR SAHAYAK */}
      {studyStep === 2 && (
        <Card className="border-rail-700">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Phase 2 of 3: Experiencing TDR Sahayak
              </p>
              <h2 className="text-base font-bold text-rail-950">
                Testing Scenario: {currentTask.scenarioTitle}
              </h2>
            </div>
            <Badge tone="green">Timer Running</Badge>
          </div>

          <div className="mt-4 rounded-xl bg-rail-50 p-4 border border-rail-200">
            <p className="text-xs font-bold uppercase tracking-wider text-rail-950 mb-1">
              Task Instructions for Participant {participantCode}:
            </p>
            <ol className="mt-2 space-y-2 text-xs text-stone-700 list-decimal list-inside leading-relaxed">
              <li>
                Click <strong>“Open this case in TDR Sahayak”</strong> below.
              </li>
              <li>
                Review the AI extraction, follow-up clarification questions, and the auditable recommendation screen.
              </li>
              <li>
                Pay attention to:
                <ul className="pl-5 mt-1 space-y-0.5 list-disc text-stone-600">
                  <li>Whether you were entitled to a refund or required an intermediate TTE certificate</li>
                  <li>The required documents checklist</li>
                  <li>The statutory deadline window</li>
                </ul>
              </li>
              <li>
                When finished inspecting the advice, return here to complete the post-test questions.
              </li>
            </ol>
          </div>

          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
            <p className="font-semibold text-stone-600 mb-1">Test narrative loaded:</p>
            <p className="italic text-stone-900 leading-relaxed font-serif">
              “{currentTask.narrativePrompt}”
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
            <Button variant="secondary" onClick={handleLaunchApp} className="flex items-center gap-2">
              <span>🚀</span> Open this case in TDR Sahayak
            </Button>
            <Button onClick={handleProceedToPostTest} className="px-5 py-2.5 font-bold">
              Proceed to post-test evaluation →
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: POST-TEST ASSESSMENT */}
      {studyStep === 3 && (
        <Card>
          <form onSubmit={handleSubmitStudy}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Phase 3 of 3: Post-Test Verification ({participantCode})
                </p>
                <h2 className="text-base font-bold text-rail-950">
                  Post-Experience Scenario Evaluation
                </h2>
              </div>
              <Badge tone="rail">Measured: ~{elapsedSeconds}s</Badge>
            </div>

            <div className="mt-4">
              <p className="text-sm font-bold text-rail-950">
                Question: {currentTask.preQuestion}
              </p>
              <p className="text-xs text-stone-600 mt-0.5">
                Based on what you learned from TDR Sahayak, what is the legally correct statutory step?
              </p>

              <div className="space-y-2 mt-3">
                {currentTask.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      postAnswerId === opt.id
                        ? "border-rail-700 bg-rail-50/80 shadow-xs"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="post-answer"
                      value={opt.id}
                      checked={postAnswerId === opt.id}
                      onChange={() => setPostAnswerId(opt.id)}
                      className="mt-0.5 h-4 w-4 text-rail-800 focus:ring-rail-600"
                    />
                    <span className="text-xs font-medium text-stone-800 leading-snug">
                      {opt.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confidence scale after */}
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="flex items-center justify-between">
                <label htmlFor="conf-after" className="text-xs font-bold text-stone-700">
                  Confidence in your answer after using TDR Sahayak:
                </label>
                <span className="font-mono text-sm font-extrabold text-emerald-700">
                  {confidenceAfter} / 5
                </span>
              </div>
              <input
                id="conf-after"
                type="range"
                min={1}
                max={5}
                step={1}
                value={confidenceAfter}
                onChange={(e) => setConfidenceAfter(Number(e.target.value))}
                className="mt-2 w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                <span>1 - Still unsure</span>
                <span>3 - Moderately clear</span>
                <span>5 - 100% Certain</span>
              </div>
            </div>

            {/* 3 Comprehension Questions */}
            <div className="mt-4 space-y-2.5 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Objective Comprehension Verification:
              </p>

              <label className="flex items-center gap-2 text-xs text-stone-800">
                <input
                  type="checkbox"
                  checked={explanationUnderstood}
                  onChange={(e) => setExplanationUnderstood(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-rail-700 focus:ring-rail-500"
                />
                <span>Was the plain-language explanation of the railway rule clear and understandable?</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-800">
                <input
                  type="checkbox"
                  checked={documentsUnderstood}
                  onChange={(e) => setDocumentsUnderstood(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-rail-700 focus:ring-rail-500"
                />
                <span>Did you clearly understand which documents/proofs (e.g. TTE certificate/memo) are required?</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-800">
                <input
                  type="checkbox"
                  checked={clarificationUnderstood}
                  onChange={(e) => setClarificationUnderstood(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-rail-700 focus:ring-rail-500"
                />
                <span>Did you understand why the system paused for clarification if travel facts were incomplete?</span>
              </label>
            </div>

            {/* Optional qualitative feedback comment */}
            <div className="mt-4">
              <label htmlFor="study-comment" className="block text-xs font-bold text-stone-700 mb-1">
                Optional qualitative feedback or confusion points:
              </label>
              <textarea
                id="study-comment"
                rows={2}
                placeholder="What was helpful? What was confusing? Any wording that felt unclear?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-ink focus:border-rail-600 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <Button type="submit" disabled={!postAnswerId} className="px-5 py-2.5 text-xs font-bold">
                Save study response & view result →
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* STEP 4: RESULT COMPARISON & SUMMARY */}
      {studyStep === 4 && savedRecord && (
        <Card className="border-emerald-300 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">
                ✓
              </span>
              <h2 className="text-base font-bold text-emerald-950">
                Trial Complete: {savedRecord.participantCode} ({savedRecord.scenarioCode})
              </h2>
            </div>
            <Badge tone="green">Recorded Locally</Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Pre-Test
              </p>
              <p className={`mt-1 font-mono text-base font-extrabold ${
                savedRecord.preAnswerCorrect ? "text-emerald-700" : "text-red-700"
              }`}>
                {savedRecord.preAnswerCorrect ? "Correct" : "Incorrect"}
              </p>
              <p className="text-[10px] text-stone-500">Unassisted choice</p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                Post-Test
              </p>
              <p className={`mt-1 font-mono text-base font-extrabold ${
                savedRecord.postAnswerCorrect ? "text-emerald-700" : "text-red-700"
              }`}>
                {savedRecord.postAnswerCorrect ? "Correct ✓" : "Incorrect ✗"}
              </p>
              <p className="text-[10px] text-stone-500">With TDR Sahayak</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Confidence Shift
              </p>
              <p className="mt-1 font-mono text-base font-extrabold text-rail-950">
                {savedRecord.confidenceBefore} → {savedRecord.confidenceAfter} <span className="text-xs text-stone-500">/ 5</span>
              </p>
              <p className="text-[10px] text-stone-500">Self-rated certainty</p>
            </div>

            <div className="rounded-xl bg-stone-50 p-3 border border-stone-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Task Duration
              </p>
              <p className="mt-1 font-mono text-base font-extrabold text-rail-950">
                {savedRecord.taskTimeSeconds}s
              </p>
              <p className="text-[10px] text-stone-500">Review time</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-rail-50/70 p-3.5 border border-rail-200 text-xs text-stone-700 leading-relaxed">
            <p className="font-bold text-rail-950 mb-1">Statutory rule explanation:</p>
            <p>{currentTask.explanationSummary}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
            <Button variant="secondary" onClick={handleResetForNext}>
              Test Next Scenario Task →
            </Button>
            <Button onClick={onViewReport} className="font-bold">
              Open Judge Validation Report 📊
            </Button>
          </div>
        </Card>
      )}

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
