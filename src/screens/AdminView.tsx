import { useState, useMemo } from "react";
import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";

interface AdminCaseRecord {
  caseId: string;
  incidentType: string;
  scenarioCode: string;
  journeyStatus: string;
  clarificationStatus: "Resolved" | "Pending clarification" | "None required";
  recommendedNextStep: string;
  createdAt: string;
}

const SYNTHETIC_ADMIN_CASES: AdminCaseRecord[] = [
  {
    caseId: "TDR-DEMO-2026-9104",
    incidentType: "Delayed train — did not travel",
    scenarioCode: "Scenario A",
    journeyStatus: "Did not travel",
    clarificationStatus: "None required",
    recommendedNextStep: "File TDR online before train departure / chart prep",
    createdAt: "2026-09-06T10:15:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-8832",
    incidentType: "Partial journey disruption",
    scenarioCode: "Scenario C",
    journeyStatus: "Travelled part of route",
    clarificationStatus: "None required",
    recommendedNextStep: "Obtain TTE/Guard Certificate for untravelled portion fare",
    createdAt: "2026-09-06T09:40:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-7411",
    incidentType: "Could not board the train",
    scenarioCode: "Scenario B",
    journeyStatus: "Could not board",
    clarificationStatus: "None required",
    recommendedNextStep: "File TDR under untravelled / failed-to-board category",
    createdAt: "2026-09-06T08:20:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-6209",
    incidentType: "Needs more clarification",
    scenarioCode: "Scenario D",
    journeyStatus: "Unconfirmed",
    clarificationStatus: "Pending clarification",
    recommendedNextStep: "Clarify whether passenger travelled on ticket",
    createdAt: "2026-09-06T07:55:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-5120",
    incidentType: "Partial journey disruption",
    scenarioCode: "Scenario C",
    journeyStatus: "Travelled part of route",
    clarificationStatus: "Resolved",
    recommendedNextStep: "File TDR with TTE certificate details within statutory window",
    createdAt: "2026-09-05T18:30:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-4401",
    incidentType: "Delayed train — did not travel",
    scenarioCode: "Scenario A",
    journeyStatus: "Did not travel",
    clarificationStatus: "None required",
    recommendedNextStep: "File TDR for full refund due to >3h train delay",
    createdAt: "2026-09-05T16:10:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-3890",
    incidentType: "Travelled & completed journey",
    scenarioCode: "Scenario E",
    journeyStatus: "Completed destination",
    clarificationStatus: "None required",
    recommendedNextStep: "No refund applicable — completed full journey",
    createdAt: "2026-09-05T14:45:00Z",
  },
  {
    caseId: "TDR-DEMO-2026-2155",
    incidentType: "Needs more clarification",
    scenarioCode: "Scenario D",
    journeyStatus: "Unconfirmed",
    clarificationStatus: "Pending clarification",
    recommendedNextStep: "Clarify approximate delay duration",
    createdAt: "2026-09-05T11:20:00Z",
  },
];

export function AdminView({
  onCitizenView,
  onInsightsView,
}: {
  onCitizenView: () => void;
  onInsightsView: () => void;
}) {
  const [filterScenario, setFilterScenario] = useState<string>("all");
  const [filterClarification, setFilterClarification] = useState<string>("all");

  const filteredCases = useMemo(() => {
    return SYNTHETIC_ADMIN_CASES.filter((c) => {
      const scenarioMatch =
        filterScenario === "all" || c.scenarioCode === filterScenario;
      const clarificationMatch =
        filterClarification === "all" || c.clarificationStatus === filterClarification;
      return scenarioMatch && clarificationMatch;
    });
  }, [filterScenario, filterClarification]);

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Admin View"
        subtitle="Simulated railway support administration & inquiry dashboard."
        onBack={onCitizenView}
      />

      {/* Cross-View Navigation Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rail-200 bg-white p-2 text-xs">
        <span className="font-bold text-rail-950 px-2">Navigation:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onCitizenView}
            className="rounded-lg px-2.5 py-1.5 font-bold text-stone-600 hover:bg-rail-50 hover:text-rail-900 transition-colors"
          >
            👤 Citizen View
          </button>
          <button
            type="button"
            className="rounded-lg bg-rail-900 px-2.5 py-1.5 font-bold text-white shadow-2xs"
          >
            🛠️ Admin View (Active)
          </button>
          <button
            type="button"
            onClick={onInsightsView}
            className="rounded-lg px-2.5 py-1.5 font-bold text-stone-600 hover:bg-rail-50 hover:text-rail-900 transition-colors"
          >
            📊 Prototype Insights
          </button>
        </div>
      </div>

      {/* Prominent Admin Demo Notice */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-signal text-rail-950 text-xs font-bold mt-0.5"
          >
            🛠
          </span>
          <div>
            <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Demonstration Dashboard
            </p>
            <p className="mt-0.5 text-xs text-amber-900 leading-relaxed font-medium">
              Admin demonstration only — uses synthetic sample cases. No real passenger data is included.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Core Summary Metric Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Total Illustrative Cases
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-rail-950">
            1,250
          </p>
          <p className="mt-0.5 text-[10px] text-stone-500">Synthetic dataset</p>
        </Card>

        <Card className="p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Cases Needing Clarification
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-amber-800">
            140
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-amber-700">
            11.2% routed to clarify
          </p>
        </Card>

        <Card className="p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Most Common Disruption
          </p>
          <p className="mt-1 text-sm font-bold text-rail-950 leading-tight">
            Delayed Train
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-rail-700">
            Scenario A (43.2%)
          </p>
        </Card>

        <Card className="p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Partial-Journey Cases
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-rail-900">
            280
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-rail-700">
            22.4% en-route disruption
          </p>
        </Card>
      </div>

      {/* Interactive Synthetic Case Table & Filters */}
      <Card className="mt-4 p-0 overflow-hidden">
        <div className="p-4 border-b border-rail-100 bg-stone-50/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-rail-950">
                Synthetic Inquiry Log
              </h2>
              <p className="text-xs text-stone-500">
                Simulated admin review stream ({filteredCases.length} shown)
              </p>
            </div>
            <Badge tone="rail">Admin Review Stream</Badge>
          </div>

          {/* Simple Filters */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-stone-600">Scenario:</span>
              <select
                value={filterScenario}
                onChange={(e) => setFilterScenario(e.target.value)}
                className="rounded-lg border border-rail-200 bg-white px-2 py-1 text-xs text-rail-950 font-medium focus:border-rail-600 focus:outline-none"
              >
                <option value="all">All Scenarios</option>
                <option value="Scenario A">Scenario A (Delayed)</option>
                <option value="Scenario B">Scenario B (Could not board)</option>
                <option value="Scenario C">Scenario C (Partial journey)</option>
                <option value="Scenario D">Scenario D (Clarification)</option>
                <option value="Scenario E">Scenario E (Completed)</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-semibold text-stone-600">Clarification:</span>
              <select
                value={filterClarification}
                onChange={(e) => setFilterClarification(e.target.value)}
                className="rounded-lg border border-rail-200 bg-white px-2 py-1 text-xs text-rail-950 font-medium focus:border-rail-600 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="None required">None required</option>
                <option value="Pending clarification">Pending clarification</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Case Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Incident Type</th>
                <th className="py-2.5 px-3">Journey Status</th>
                <th className="py-2.5 px-3">Clarification</th>
                <th className="py-2.5 px-3">Recommended Next Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCases.map((c) => (
                <tr key={c.caseId} className="hover:bg-rail-50/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-rail-950 whitespace-nowrap">
                    {c.caseId}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-rail-950 block">
                      {c.incidentType}
                    </span>
                    <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-stone-100 text-stone-700">
                      {c.scenarioCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-700 font-medium whitespace-nowrap">
                    {c.journeyStatus}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge
                      tone={
                        c.clarificationStatus === "Pending clarification"
                          ? "amber"
                          : c.clarificationStatus === "Resolved"
                          ? "green"
                          : "neutral"
                      }
                    >
                      {c.clarificationStatus}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-stone-800 leading-snug max-w-xs">
                    {c.recommendedNextStep}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* "How This Could Help Railway Support Teams" Section */}
      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">
          How this could help railway support teams
        </h2>
        <p className="mt-1 text-xs text-stone-600 leading-relaxed">
          In a production deployment, an admin dashboard allows commercial support teams to monitor inquiry patterns and continuously optimize passenger guidance:
        </p>

        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-xl border border-rail-100 bg-stone-50/80 p-3">
            <p className="font-bold text-rail-950 flex items-center gap-1.5">
              <span>🔍</span> Identify recurring passenger confusion
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
              Pinpoint which refund categories or statutory deadlines generate the most passenger uncertainty before claims are filed.
            </p>
          </div>

          <div className="rounded-xl border border-rail-100 bg-stone-50/80 p-3">
            <p className="font-bold text-rail-950 flex items-center gap-1.5">
              <span>📈</span> Understand disruption patterns
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
              Track route-level delay spikes, en-route train terminations, and boarding issues across zonal railway networks.
            </p>
          </div>

          <div className="rounded-xl border border-rail-100 bg-stone-50/80 p-3">
            <p className="font-bold text-rail-950 flex items-center gap-1.5">
              <span>❓</span> Improve clarification questions
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
              Refine follow-up prompts to collect essential facts (such as TTE certificates) in a single step.
            </p>
          </div>

          <div className="rounded-xl border border-rail-100 bg-stone-50/80 p-3">
            <p className="font-bold text-rail-950 flex items-center gap-1.5">
              <span>💡</span> Improve passenger guidance
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
              Reduce invalid TDR filings and deflection costs by providing transparent statutory rules up front.
            </p>
          </div>
        </div>
      </Card>

      {/* Footer Navigation */}
      <div className="mt-6 space-y-3">
        <Button variant="secondary" onClick={onCitizenView}>
          Back to Citizen View
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
