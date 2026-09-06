import { Badge, Button, Card, Disclaimer } from "../components/ui";

export function Welcome({
  onStart,
  onRunDemo,
  onAbout,
  onInsights,
  onAdmin,
  caseCount,
  onTrack,
}: {
  onStart: () => void;
  onRunDemo?: (scenarioId: string) => void;
  onAbout: () => void;
  onInsights: () => void;
  onAdmin?: () => void;
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
            Describe what happened, check what we understood, correct anything that is wrong, and see why a particular next step was recommended.
          </p>

          {/* Distinctiveness Principle Box */}
          <div className="mt-4 rounded-2xl bg-white/10 p-3.5 border border-white/15 backdrop-blur-sm text-xs">
            <div className="flex items-center gap-2 font-black text-amber-signal tracking-wide uppercase text-[11px] mb-1">
              <span>⚡ AI interprets · Passenger corrects · Rules decide</span>
            </div>
            <p className="text-rail-100 leading-relaxed text-[11px]">
              A wrong interpretation can lead to a wrong next step. TDR Sahayak lets the passenger correct important facts before acting.
            </p>
          </div>

          {/* Quick Demo Hero Shortcut */}
          {onRunDemo && (
            <div className="mt-4 rounded-2xl bg-amber-signal/15 p-3 border border-amber-signal/30 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-amber-signal uppercase tracking-wider text-[10px]">
                  ⚡ Recommended Demo Shortcut
                </span>
                <span className="text-[10px] text-rail-100">Scenario C · Partial Journey</span>
              </div>
              <button
                onClick={() => onRunDemo("partial-journey")}
                className="w-full flex items-center justify-between rounded-xl bg-amber-signal px-3.5 py-2 text-left text-xs font-extrabold text-rail-950 shadow-md transition-all hover:bg-amber-400 active:scale-[0.99]"
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

        {/* 4 Feature Pillars */}
        <Card className="border-rail-100">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-rail-800">
            How TDR Sahayak Protects Your Refund
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              {
                num: "1",
                title: "Plain-English Story",
                body: "Speak or type what happened in English or Hindi. Dictation support included.",
              },
              {
                num: "2",
                title: "Fact Review & Correction",
                body: "Review extracted journey facts and correct any details before rule check.",
              },
              {
                num: "3",
                title: "Deterministic Rule Engine",
                body: "Produced by explicit decision rules based on confirmed passenger facts.",
              },
              {
                num: "4",
                title: "Actionable Guidance",
                body: "Clear next steps, statutory claim deadlines, and required document checklist.",
              },
            ].map((p) => (
              <div key={p.num} className="flex items-start gap-2.5 rounded-xl bg-rail-50/60 p-3 border border-rail-100/80">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rail-900 text-xs font-bold text-amber-signal"
                >
                  {p.num}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-rail-950">{p.title}</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-stone-600">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Badge tone="amber">Civic Tech Prototype · Offline Safe</Badge>
          <div className="flex flex-wrap items-center gap-1.5">
            {onAdmin && (
              <button
                onClick={onAdmin}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rail-800 bg-rail-100/60 hover:bg-rail-200/70 transition-colors"
              >
                📊 Support Admin
              </button>
            )}
            <button
              onClick={onInsights}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rail-800 bg-rail-100/60 hover:bg-rail-200/70 transition-colors"
            >
              🚀 Insights & Architecture
            </button>
            <button
              onClick={onAbout}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-rail-950 underline underline-offset-4"
            >
              How it works
            </button>
          </div>
        </div>

        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
