import { Badge, Button, Card, Disclaimer, ScreenHeader } from "../components/ui";
import type { TrackedCase } from "../types";

export function SubmissionSuccess({
  kase,
  onTrack,
  onStartOver,
}: {
  kase: TrackedCase;
  onTrack: () => void;
  onStartOver: () => void;
}) {
  const timeline = [
    "Incident reported",
    "Facts reviewed",
    "Recommended next step",
    "Mock case created",
  ];
  return (
    <div className="animate-fade-up">
      <ScreenHeader title="Your mock case has been created" />

      <div className="mt-2 overflow-hidden rounded-2xl bg-rail-900 text-white">
        <div className="px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-signal">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0f2e2a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-rail-100">
            Synthetic case ID
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-amber-signal">
            {kase.caseId}
          </p>
        </div>
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-bold text-rail-950">Case timeline</h2>
        <ul className="mt-3 space-y-2.5">
          {timeline.map((label) => (
            <li key={label} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex h-5 w-5 items-center justify-center rounded-full bg-rail-600 text-[11px] font-bold text-white"
              >
                ✓
              </span>
              <span className="text-sm font-medium text-stone-700">{label}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4 border-amber-200 bg-amber-soft">
        <div className="flex items-start gap-2">
          <Badge tone="amber">Reminder</Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-amber-900">
          This is a demonstration record only. In a real product, this is where
          you would be guided to the official claim process. Please verify
          against the official process.
        </p>
      </Card>

      <div className="mt-6 space-y-3">
        <Button onClick={onTrack}>Track my case</Button>
        <Button variant="ghost" onClick={onStartOver}>
          Start over
        </Button>
        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
