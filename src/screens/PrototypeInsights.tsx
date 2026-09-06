import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";

interface ScenarioMetric {
  scenario: string;
  code: string;
  count: number;
  pct: number;
  avgDelay: string;
  colorClass: string;
  bgClass: string;
}

const SAMPLE_METRICS: ScenarioMetric[] = [
  {
    scenario: "Delayed train — did not travel",
    code: "Scenario A",
    count: 540,
    pct: 43.2,
    avgDelay: "4.8 hrs",
    colorClass: "bg-rail-800",
    bgClass: "text-rail-900 bg-rail-100",
  },
  {
    scenario: "Partial journey disruption",
    code: "Scenario C",
    count: 280,
    pct: 22.4,
    avgDelay: "2.5 hrs",
    colorClass: "bg-amber-600",
    bgClass: "text-amber-900 bg-amber-100",
  },
  {
    scenario: "Could not board the train",
    code: "Scenario B",
    count: 215,
    pct: 17.2,
    avgDelay: "N/A (Boarding disruption)",
    colorClass: "bg-teal-700",
    bgClass: "text-teal-900 bg-teal-100",
  },
  {
    scenario: "Needs more clarification",
    code: "Scenario D",
    count: 140,
    pct: 11.2,
    avgDelay: "Unconfirmed",
    colorClass: "bg-amber-signal",
    bgClass: "text-amber-950 bg-amber-200",
  },
  {
    scenario: "Travelled & completed journey",
    code: "Scenario E",
    count: 75,
    pct: 6.0,
    avgDelay: "3.2 hrs",
    colorClass: "bg-stone-500",
    bgClass: "text-stone-800 bg-stone-200",
  },
];

const TOTAL_CASES = 1250;

export function PrototypeInsights({
  onBack,
  onAdmin,
}: {
  onBack: () => void;
  onAdmin?: () => void;
}) {
  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Prototype Insights"
        subtitle="Synthetic distribution of railway disruption inquiries."
        onBack={onBack}
      />

      {/* Cross-View Navigation Bar */}
      {onAdmin && (
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
            <button
              type="button"
              onClick={onAdmin}
              className="rounded-lg px-2.5 py-1.5 font-bold text-stone-600 hover:bg-rail-50 hover:text-rail-900 transition-colors"
            >
              🛠️ Admin View
            </button>
            <button
              type="button"
              className="rounded-lg bg-rail-900 px-2.5 py-1.5 font-bold text-white shadow-2xs"
            >
              📊 Prototype Insights (Active)
            </button>
          </div>
        </div>
      )}

      {/* Prominent Synthetic Data Notice */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-signal text-rail-950 text-xs font-bold mt-0.5"
          >
            ℹ
          </span>
          <div>
            <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Illustrative Demo Analytics
            </p>
            <p className="mt-0.5 text-xs text-amber-900 leading-relaxed font-medium">
              Illustrative demo analytics — based on synthetic sample cases. No real passenger data is included.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Total Illustrative Cases
          </p>
          <p className="mt-1.5 font-mono text-2xl font-black text-rail-950">
            {TOTAL_CASES.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">Synthetic dataset</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Top Incident Type
          </p>
          <p className="mt-1.5 text-base font-bold text-rail-950 leading-tight">
            Delayed Train
          </p>
          <p className="mt-1 text-[11px] font-semibold text-rail-700">
            Scenario A (43.2%)
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Avg Delay Duration
          </p>
          <p className="mt-1.5 font-mono text-2xl font-black text-rail-950">
            4.2 hrs
          </p>
          <p className="mt-1 text-[11px] text-stone-500">Delayed services</p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Needs Clarification
          </p>
          <p className="mt-1.5 font-mono text-2xl font-black text-amber-800">
            140
          </p>
          <p className="mt-1 text-[11px] font-semibold text-amber-700">
            11.2% routed to clarify
          </p>
        </Card>
      </div>

      {/* Distribution CSS Bar Chart */}
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-rail-950">
            Inquiry Breakdown by Incident Type
          </h2>
          <Badge tone="amber">CSS Visualization</Badge>
        </div>
        <p className="mt-1 text-xs text-stone-600">
          Distribution across 1,250 synthetic simulated scenarios:
        </p>

        <div className="mt-4 space-y-3.5">
          {SAMPLE_METRICS.map((m) => (
            <div key={m.code}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-rail-950">
                  {m.scenario}{" "}
                  <span className="font-mono text-stone-400 font-normal">
                    ({m.code})
                  </span>
                </span>
                <span className="font-mono text-stone-600 font-semibold">
                  {m.count} ({m.pct}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${m.colorClass}`}
                  style={{ width: `${m.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Table */}
      <Card className="mt-4 overflow-hidden p-0">
        <div className="p-4 pb-2 border-b border-rail-100">
          <h2 className="text-base font-bold text-rail-950">
            Scenario Summary Table
          </h2>
          <p className="text-xs text-stone-500">
            Structured breakdown of simulated case outcomes
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-4">Scenario Type</th>
                <th className="py-2.5 px-3 text-right">Count</th>
                <th className="py-2.5 px-4 text-right">Avg Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {SAMPLE_METRICS.map((m) => (
                <tr key={m.code} className="hover:bg-rail-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-rail-950 block">
                      {m.scenario}
                    </span>
                    <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-stone-100 text-stone-700">
                      {m.code}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-stone-900 whitespace-nowrap">
                    {m.count}{" "}
                    <span className="text-[10px] text-stone-400 font-sans">
                      ({m.pct}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-stone-700 whitespace-nowrap">
                    {m.avgDelay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Local Storage & Synthetic Footnote */}
      <div className="mt-4 rounded-xl bg-rail-50 border border-rail-100 p-3.5 text-xs text-stone-600 leading-relaxed">
        <p className="font-semibold text-rail-950 mb-1">Architecture note:</p>
        <p>
          Because this prototype stores data locally in the browser, this view uses illustrative sample data rather than real cross-user analytics.
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* FUTURE INTELLIGENCE LAYER (CONCEPTUAL PRODUCTION VISION)     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-4">
        {/* Header Banner & Concept Disclaimer */}
        <Card className="border-rail-800 bg-rail-900 text-white shadow-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-signal text-rail-950 text-xs font-black">
                ⚡
              </span>
              <h2 className="text-base font-bold text-white">
                Future Intelligence Layer
              </h2>
            </div>
            <Badge tone="amber">Future Concept</Badge>
          </div>

          <div className="mt-3.5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-signal">
              Future concept — not connected to live passenger data.
            </p>
            <p className="text-xs leading-relaxed text-rail-100 font-medium">
              With user consent and anonymization, future versions could aggregate recurring disruption patterns and use them to improve the questions and recommendations shown by TDR Sahayak.
            </p>
          </div>
        </Card>

        {/* Visual Flow Diagram */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rail-950">
              System Learning Cycle
            </h3>
            <span className="text-[11px] font-semibold text-stone-500">
              Anonymized Data Pipeline
            </span>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center space-y-1.5 text-center text-xs">
            {[
              { title: "Anonymized case", desc: "Citizen submits disruption description with consent" },
              { title: "Pattern detection", desc: "System identifies recurring confusion points & terminology" },
              { title: "Better clarification questions", desc: "Targeted questions dynamically adapted to user context" },
              { title: "Better recommendations", desc: "Statutory guidance fine-tuned for edge cases" },
              { title: "Less passenger confusion", desc: "Clear, explainable, single-step citizen resolution" },
            ].map((step, idx, arr) => (
              <div key={step.title} className="w-full flex flex-col items-center">
                <div className="w-full rounded-xl border border-rail-100 bg-rail-50/60 px-4 py-2.5 shadow-2xs">
                  <p className="font-bold text-rail-950">{step.title}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{step.desc}</p>
                </div>
                {idx < arr.length - 1 && (
                  <div className="my-1 text-rail-600 font-extrabold text-sm" aria-hidden>
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* "What We Could Learn" Insight Card */}
        <Card>
          <h3 className="text-sm font-bold text-rail-950">
            What We Could Learn from Aggregated Data
          </h3>
          <p className="mt-1 text-xs text-stone-600">
            Key insights anonymized case intelligence would reveal:
          </p>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              {
                title: "Fact Correction Patterns",
                detail: "Which extracted facts passengers most often correct (e.g. travel status vs delay duration).",
              },
              {
                title: "Confusion Hotspots",
                detail: "Which incident types create the most passenger uncertainty and follow-up questions.",
              },
              {
                title: "Clarification Efficacy",
                detail: "Which clarification questions are asked most frequently and resolve missing facts best.",
              },
              {
                title: "Partial-Journey Trends",
                detail: "How many cases involve partial-journey disruption requiring TTE certificates.",
              },
              {
                title: "Language & Hinglish",
                detail: "How code-mixed Hinglish phrases map to statutory railway disruption categories.",
              },
              {
                title: "User Comprehension",
                detail: "Whether passengers understand the recommended next step and statutory timing windows.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-rail-100 bg-stone-50/80 p-3"
              >
                <p className="font-bold text-rail-950 flex items-center gap-1.5">
                  <span className="text-rail-600 font-extrabold">✦</span> {item.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy and Responsible Data Note */}
        <div className="rounded-xl border border-amber-200 bg-amber-soft p-3.5 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5 text-amber-800 font-bold">🔒</span>
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-amber-900">
                Privacy & Responsible Data Note
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/90 font-medium">
                Any future analytics system would require explicit user consent, data minimization, anonymization, secure storage, and an option to delete data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="mt-6 space-y-3">
        <Button variant="secondary" onClick={onBack}>
          Back to main application
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
