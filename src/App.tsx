import { useMemo, useState } from "react";
import type { AnalysisResult, DecisionResult, DeadlineAssessment, MissingFactKey, TrackedCase } from "./types";
import { analyzeIncident } from "./lib/ai/analyzeIncident";
import { decide } from "./lib/decisionEngine";
import { assessDeadline, defaultJourneyDateTime } from "./lib/riskEngine";
import { buildCaseFacts, nextUnanswered, type Answers } from "./lib/flow";
import { createCase, listCases } from "./lib/caseStore";
import { DEMO_SCENARIOS, FOLLOW_UP_QUESTIONS } from "./data/scenarios";
import { Welcome } from "./screens/Welcome";
import { IncidentInput } from "./screens/IncidentInput";
import { Analyzing, Understanding } from "./screens/Understanding";
import { DecisionResultScreen } from "./screens/DecisionResultScreen";
import { DeadlineRisk } from "./screens/DeadlineRisk";
import { CasePreparation, MockConfirm } from "./screens/CasePreparation";
import { SubmissionSuccess } from "./screens/SubmissionSuccess";
import { CaseTracker } from "./screens/CaseTracker";
import { AboutSheet } from "./screens/AboutSheet";

type Screen =
  | "welcome"
  | "incident"
  | "analyzing"
  | "understanding"
  | "decision"
  | "deadline"
  | "prepare"
  | "confirm"
  | "success"
  | "tracker";

/** Sensible pre-answered facts for the one-tap demo journeys. */
const DEMO_AUTO_ANSWERS: Record<string, Answers> = {
  "delay-not-travelled": {
    passengerBoarded: "no",
    cancelledBeforeDeparture: "no",
    delayDuration: "gt6h",
    journeyDate: "past_3d",
  },
  "could-not-board": {
    passengerTravelled: "no",
    passengerBoarded: "no",
    delayDuration: "unsure",
    cancelledBeforeDeparture: "no",
    disruptionType: "other",
    journeyDate: "past_3d",
  },
  "travelled-disrupted": {
    passengerBoarded: "yes",
    delayDuration: "3to6h",
    journeyDate: "past_3d",
  },
  "refund-confusion": {
    journeyDate: "past_week",
  },
};

function journeyAnswerToDateTime(value: string): string {
  const d = new Date();
  switch (value) {
    case "past_3d":
      d.setDate(d.getDate() - 1.5);
      break;
    case "past_week":
      d.setDate(d.getDate() - 7);
      break;
    case "past_month":
      d.setDate(d.getDate() - 20);
      break;
    default:
      break; // upcoming / other → keep near "now" for the demo
  }
  return d.toISOString();
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const [incidentText, setIncidentText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [editingKey, setEditingKey] = useState<MissingFactKey | null>(null);
  const [journeyDateTime, setJourneyDateTime] = useState(defaultJourneyDateTime());
  const [currentCase, setCurrentCase] = useState<TrackedCase | null>(null);

  const trackedCases = listCases();

  const facts = useMemo(() => {
    if (!analysis) return null;
    return buildCaseFacts(analysis, answers, incidentText, journeyDateTime);
  }, [analysis, answers, incidentText, journeyDateTime]);

  const decision: DecisionResult | null = useMemo(
    () => (facts ? decide(facts) : null),
    [facts],
  );

  const deadline: DeadlineAssessment | null = useMemo(
    () => (facts ? assessDeadline(facts) : null),
    [facts],
  );

  const question = useMemo(() => {
    if (!analysis || !facts) return null;
    const key = nextUnanswered(facts, answers);
    if (!key) return null;
    return FOLLOW_UP_QUESTIONS[key];
  }, [analysis, facts, answers]);

  function resetAll() {
    setIncidentText("");
    setAnalysis(null);
    setAnswers({});
    setEditingKey(null);
    setJourneyDateTime(defaultJourneyDateTime());
    setCurrentCase(null);
    setScreen("welcome");
  }

  async function startAnalysis(text: string, presetAnswers: Answers = {}) {
    setIncidentText(text);
    setAnswers(presetAnswers);
    setScreen("analyzing");
    const started = Date.now();
    const result = await analyzeIncident(text);
    // Keep the analysis state visible long enough to read on the fast path.
    const minShow = 1400;
    const elapsed = Date.now() - started;
    if (elapsed < minShow) {
      await new Promise((r) => setTimeout(r, minShow - elapsed));
    }
    setAnalysis(result);
    setScreen("understanding");
  }

  async function runDemoJourney(scenarioId: string) {
    setDemoOpen(false);
    const scenario = DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;
    const demoAnswers = DEMO_AUTO_ANSWERS[scenarioId] ?? {};
    setAnswers(demoAnswers);
    const jd = demoAnswers.journeyDate;
    if (jd) setJourneyDateTime(journeyAnswerToDateTime(jd));
    await startAnalysis(scenario.text, demoAnswers);
  }

  function handleAnswer(key: MissingFactKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (key === "journeyDate") {
      setJourneyDateTime(journeyAnswerToDateTime(value));
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-16 pt-4 sm:max-w-xl sm:pt-8">
      {/* App bar */}
      <header className="mb-5 flex items-center justify-between">
        <button
          onClick={() => setScreen("welcome")}
          className="flex items-center gap-2.5"
          aria-label="TDR Sahayak home"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rail-900"
          >
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect x="7" y="4" width="18" height="17" rx="5" fill="#f2b705" />
              <rect x="10" y="7.5" width="5" height="6" rx="1.5" fill="#0f2e2a" />
              <rect x="17" y="7.5" width="5" height="6" rx="1.5" fill="#0f2e2a" />
              <circle cx="11" cy="25" r="2.4" fill="#f2b705" />
              <circle cx="21" cy="25" r="2.4" fill="#f2b705" />
            </svg>
          </span>
          <span className="text-base font-extrabold tracking-tight text-rail-950">
            TDR Sahayak
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setDemoOpen((o) => !o)}
              aria-expanded={demoOpen}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-rail-100 bg-white px-3 py-1.5 text-xs font-bold text-rail-800 hover:bg-rail-50"
            >
              <span aria-hidden className="h-2 w-2 rounded-full bg-amber-signal" />
              Demo Mode
            </button>
            {demoOpen && (
              <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-rail-100 bg-white p-3 shadow-lg">
                <p className="px-1 pb-2 text-xs font-semibold text-stone-500">
                  Run a complete sample journey in seconds
                </p>
                <div className="grid gap-1.5">
                  {DEMO_SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => runDemoJourney(s.id)}
                      className="min-h-[44px] rounded-xl border border-rail-100 px-3 py-2 text-left text-sm font-medium text-stone-800 hover:border-rail-600 hover:bg-rail-50"
                    >
                      ⚡ {s.shortLabel}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setDemoOpen(false)}
                  className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100"
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setAboutOpen(true)}
            aria-label="How this prototype works"
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-rail-800 hover:bg-rail-100"
          >
            ?
          </button>
        </div>
      </header>

      <main>
        {screen === "welcome" && (
          <Welcome
            onStart={() => setScreen("incident")}
            onAbout={() => setAboutOpen(true)}
            caseCount={trackedCases.length}
            onTrack={() => {
              const latest = trackedCases[0];
              if (latest) {
                setCurrentCase(latest);
                setScreen("tracker");
              }
            }}
          />
        )}

        {screen === "incident" && (
          <IncidentInput
            value={incidentText}
            onChange={setIncidentText}
            onContinue={() => startAnalysis(incidentText)}
            onBack={() => setScreen("welcome")}
          />
        )}

        {screen === "analyzing" && <Analyzing />}

        {screen === "understanding" && analysis && facts && (
          <Understanding
            facts={facts}
            analysis={analysis}
            question={question}
            questionsAnswered={Object.keys(answers).length}
            onAnswer={(value) => {
              if (question) handleAnswer(question.id as MissingFactKey, value);
            }}
            onDone={() => setScreen("decision")}
            onBack={() => setScreen("incident")}
          />
        )}

        {screen === "decision" && facts && decision && (
          <DecisionResultScreen
            facts={facts}
            decision={decision}
            onCheckDeadline={() => setScreen("deadline")}
            onBack={() => setScreen("understanding")}
          />
        )}

        {screen === "deadline" && facts && deadline && (
          <DeadlineRisk
            facts={facts}
            assessment={deadline}
            onJourneyDateTimeChange={setJourneyDateTime}
            onContinue={() => setScreen("prepare")}
            onBack={() => setScreen("decision")}
          />
        )}

        {screen === "prepare" && facts && decision && (
          <CasePreparation
            facts={facts}
            decision={decision}
            editingKey={editingKey}
            onEditKey={setEditingKey}
            onAnswerChange={handleAnswer}
            onCreateClaim={() => setScreen("confirm")}
            onBack={() => setScreen("deadline")}
          />
        )}

        {screen === "confirm" && facts && decision && (
          <MockConfirm
            facts={facts}
            decision={decision}
            onConfirm={() => {
              if (facts && decision && deadline) {
                setCurrentCase(createCase(facts, decision, deadline));
                setScreen("success");
              }
            }}
            onCancel={() => setScreen("prepare")}
          />
        )}

        {screen === "success" && currentCase && (
          <SubmissionSuccess
            kase={currentCase}
            onTrack={() => setScreen("tracker")}
            onStartOver={resetAll}
          />
        )}

        {screen === "tracker" && currentCase && (
          <CaseTracker
            kase={currentCase}
            onCaseUpdated={setCurrentCase}
            onStartOver={resetAll}
            onHome={() => setScreen("welcome")}
          />
        )}
      </main>

      {aboutOpen && <AboutSheet onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
