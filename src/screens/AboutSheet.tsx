import { Badge } from "../components/ui";

export function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-rail-950/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="How this prototype works"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 pb-10 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-rail-950">
            How this prototype works
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-stone-700">
          <p>
            <strong>1. AI helps understand you.</strong> When you describe your
            journey problem, an AI interpretation layer reads your words and
            pulls out structured facts — what happened, whether you travelled,
            and what is unclear. If AI is unavailable, a built-in deterministic
            parser does the same job, so the demo always works.
          </p>
          <p>
            <strong>2. A decision engine does the thinking.</strong> The
            structured facts are evaluated by transparent, deterministic rules
            — the same facts always produce the same recommendation. The AI is
            never the sole authority on eligibility.
          </p>
          <p>
            <strong>3. Deadline and risk are rule-based.</strong> Timing
            warnings use clearly-labelled prototype rules, not live official
            deadlines.
          </p>
          <p>
            <strong>4. Everything is synthetic.</strong> No real passenger data
            is used. Mock cases are stored only in your own browser.
          </p>

          <div className="rounded-xl bg-rail-50 p-4">
            <Badge tone="amber">Prototype limitations</Badge>
            <ul className="mt-2 space-y-1.5">
              <li>• No real TDR is submitted and no refund is claimed.</li>
              <li>• No IRCTC systems, PNR lookups, or government APIs are connected.</li>
              <li>• No authentication, OTP, or payment is involved.</li>
              <li>• Recommendations are guidance only — please verify against the official process.</li>
            </ul>
          </div>

          <p>
            This is a demonstration of how a simpler citizen decision journey
            could work: describe → understand → clarify → decide → prepare →
            track.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 min-h-[52px] w-full rounded-xl bg-rail-900 text-base font-semibold text-white hover:bg-rail-800"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
