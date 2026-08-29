import { Badge, Button, Card, Disclaimer } from "../components/ui";

export function Welcome({
  onStart,
  onAbout,
  caseCount,
  onTrack,
}: {
  onStart: () => void;
  onAbout: () => void;
  caseCount: number;
  onTrack: () => void;
}) {
  return (
    <div className="animate-fade-up">
      {/* Railway-inspired hero: platform line motif, no copied branding. */}
      <div className="relative overflow-hidden rounded-3xl bg-rail-900 px-6 pb-8 pt-10 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #f2b705 0 14px, transparent 14px 34px)",
            maskImage: "linear-gradient(to top, black, transparent)",
            WebkitMaskImage: "linear-gradient(to top, black, transparent)",
          }}
        />
        <div className="relative">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-signal">
            <svg
              width="30"
              height="30"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden
            >
              <rect x="7" y="4" width="18" height="17" rx="5" fill="#0f2e2a" />
              <rect x="10" y="7.5" width="5" height="6" rx="1.5" fill="#f2b705" />
              <rect x="17" y="7.5" width="5" height="6" rx="1.5" fill="#f2b705" />
              <circle cx="11" cy="25" r="2.4" fill="#0f2e2a" />
              <circle cx="21" cy="25" r="2.4" fill="#0f2e2a" />
              <rect x="10" y="24.2" width="12" height="1.6" fill="#0f2e2a" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            TDR Sahayak
          </h1>
          <p className="mt-2 text-lg font-semibold leading-snug text-amber-signal">
            Know the right next step before you lose your refund.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-rail-100">
            Tell us what happened during your railway journey. We’ll help you
            understand the next step and what information matters.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Button onClick={onStart}>Tell us what happened</Button>

        {caseCount > 0 && (
          <button
            onClick={onTrack}
            className="flex w-full items-center justify-between rounded-xl border border-rail-100 bg-white px-4 py-3.5 text-left transition-colors hover:bg-rail-50"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rail-50 text-rail-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M3 6h18M3 12h18M3 18h12" />
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-rail-950">
                  Track your mock case{caseCount > 1 ? "s" : ""}
                </span>
                <span className="block text-xs text-stone-500">
                  {caseCount} case{caseCount > 1 ? "s" : ""} in this browser
                </span>
              </span>
            </span>
            <span aria-hidden className="text-rail-700">›</span>
          </button>
        )}

        <Card>
          <h2 className="text-base font-bold text-rail-950">How it works</h2>
          <ol className="mt-4 space-y-4">
            {[
              {
                title: "Tell us what happened",
                body: "Describe your journey problem in your own words.",
              },
              {
                title: "Answer a few questions",
                body: "We only ask what’s needed — nothing more.",
              },
              {
                title: "Get a clear next step",
                body: "See a recommended action, deadlines, and risks.",
              },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rail-900 text-sm font-bold text-white"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-rail-950">
                    {s.title}
                  </span>
                  <span className="block text-sm text-stone-600">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone="amber">Prototype · No sign-in needed</Badge>
          <button
            onClick={onAbout}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-rail-700 underline decoration-rail-100 underline-offset-4 hover:bg-rail-50"
          >
            How this prototype works
          </button>
        </div>

        <Disclaimer className="text-center" />
      </div>
    </div>
  );
}
