import { Badge, Button, Card, Disclaimer } from "../components/ui";

export function Welcome({
  onStart,
  onRunDemo,
  onAbout,
  onInsights,
  onAdmin,
  onValidationStudy,
  onValidationReport,
  caseCount,
  onTrack,
}: {
  onStart: () => void;
  onRunDemo?: (scenarioId: string) => void;
  onAbout: () => void;
  onInsights: () => void;
  onAdmin?: () => void;
  onValidationStudy?: () => void;
  onValidationReport?: () => void;
  caseCount: number;
  onTrack: () => void;
}) {
  return (
    <div className="animate-fade-up">
      {/* Railway-inspired hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-rail-900 px-6 pb-8 pt-9 text-white shadow-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #f2b705 0 14px, transparent 14px 34px)",
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
        <div className="relative">
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-signal uppercase border border-amber-signal/30 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Indian Railways TDR Assistance · AI Fact Understanding
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            TDR Sahayak
          </h1>
          <p className="mt-2 text-lg font-bold leading-snug text-amber-signal">
            Turn your railway disruption story into a clear next step.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-rail-100/90 sm:text-sm">
            Describe what happened in everyday language, check what we understood, correct anything that is wrong, and see why a particular next step was recommended.
          </p>

          {/* Core Principle Callout */}
          <div className="mt-4 rounded-2xl bg-white/10 p-3.5 border border-white/15 backdrop-blur-sm text-xs">
            <div className="flex items-center gap-2 font-black text-amber-signal tracking-wide uppercase text-[11px] mb-1">
              <span>⚡ AI interprets · Passenger corrects · Rules decide</span>
            </div>
            <p className="text-rail-100 leading-relaxed text-[11px]">
              A wrong AI interpretation can lead to an incorrect railway claim. TDR Sahayak puts the passenger in control to correct facts before deterministic rules evaluate the outcome.
            </p>
          </div>

          {/* Quick Demo Hero Shortcut */}
          {onRunDemo && (
            <div className="mt-4 rounded-2xl bg-amber-signal/15 p-3 border border-amber-signal/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-amber-signal uppercase tracking-wider text-[10px]">
                  ⚡ Recommended Demo Shortcut
                </span>
                <span className="text-[10px] text-rail-100 font-medium">
                  Partial Journey · 1-Tap Rehearsal
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRunDemo("partial-journey")}
                className="w-full flex items-center justify-between rounded-xl bg-amber-signal px-3.5 py-2.5 text-left text-xs font-black text-rail-950 shadow-md transition-all hover:bg-amber-400 active:scale-[0.99]"
              >
                <span>Try the partial-journey example (Hyderabad → Vijayawada)</span>
                <span aria-hidden className="text-sm font-bold ml-2 shrink-0">→</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Button onClick={onStart} className="w-full text-base py-3.5 font-extrabold shadow-md">
          Start My Journey Inquiry
        </Button>

        {caseCount > 0 && (
          <button
            type="button"
            onClick={onTrack}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-rail-200 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:border-rail-600 hover:bg-rail-50/50"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rail-900 text-amber-signal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M3 6h18M3 12h18M3 18h12" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-bold text-rail-950">
                  Track your saved inquiry ({caseCount})
                </span>
                <span className="block text-xs font-medium text-stone-500">
                  {caseCount} claim summary saved in this browser
                </span>
              </span>
            </span>
            <span aria-hidden className="text-lg font-bold text-rail-800">›</span>
          </button>
        )}

        {/* Research Study / Judge Validation Banner */}
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wide">
              <span>🔬</span> Usability Study & Validation
            </span>
            <Badge tone="green">Empirical Testing</Badge>
          </div>
          <p className="mt-1 text-xs text-emerald-900/90 leading-relaxed">
            Participate in structured before-and-after testing or view the live judge-facing accuracy report.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {onValidationStudy && (
              <button
                type="button"
                onClick={onValidationStudy}
                className="flex-1 rounded-xl bg-emerald-700 px-3 py-2 text-center text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
              >
                🧪 Take Usability Test
              </button>
            )}
            {onValidationReport && (
              <button
                type="button"
                onClick={onValidationReport}
                className="flex-1 rounded-xl bg-white px-3 py-2 text-center text-xs font-bold text-rail-950 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                📋 View Validation Report
              </button>
            )}
          </div>
        </div>

        {/* 4 Feature Pillars: Describe -> Check -> Correct -> Next Step */}
        <Card className="border-rail-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-rail-800">
              The 4-Stage Citizen Journey
            </h2>
            <span className="text-[10px] font-bold text-stone-500 uppercase">
              How it works
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              {
                num: "1",
                title: "Describe",
                body: "Type, speak in 6 Indian languages, or upload a ticket/TDR photo.",
              },
              {
                num: "2",
                title: "Check",
                body: "System extracts structured facts: delays, boarding status, and route completion.",
              },
              {
                num: "3",
                title: "Correct",
                body: "Passenger reviews and adjusts facts before any recommendation is made.",
              },
              {
                num: "4",
                title: "Next Step",
                body: "Deterministic rules provide an actionable checklist and statutory claim window.",
              },
            ].map((p) => (
              <div
                key={p.num}
                className="flex items-start gap-2.5 rounded-xl bg-rail-50/60 p-3 border border-rail-100/80"
              >
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rail-900 text-xs font-bold text-amber-signal"
                >
                  {p.num}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-rail-950">{p.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer Navigation Bar - Clearly Secondary & Labelled Demonstration Only */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Badge tone="amber">Civic Tech Prototype · Offline Safe</Badge>
          <div className="flex flex-wrap items-center gap-1.5">
            {onAdmin && (
              <button
                type="button"
                onClick={onAdmin}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                🛠️ Admin View <span className="text-[10px] text-stone-400">(Demo)</span>
              </button>
            )}
            {onValidationReport && (
              <button
                type="button"
                onClick={onValidationReport}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 transition-colors border border-emerald-300"
              >
                📋 Judge Report
              </button>
            )}
            <button
              type="button"
              onClick={onInsights}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              📊 Insights <span className="text-[10px] text-stone-400">(Synthetic)</span>
            </button>
            <button
              type="button"
              onClick={onAbout}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-rail-950 underline underline-offset-4"
            >
              About
            </button>
          </div>
        </div>

        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
