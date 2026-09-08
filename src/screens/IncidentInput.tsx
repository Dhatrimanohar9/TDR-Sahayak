import { useState, useMemo } from "react";
import { Badge, Button, Card, Disclaimer, ScreenHeader, StepProgress } from "../components/ui";
import { SpeechInputControls } from "../components/SpeechInputControls";
import { DocumentUpload } from "../components/DocumentUpload";
import { DEMO_SCENARIOS, MULTILINGUAL_PROMPTS } from "../data/scenarios";
import { extractKeywordChips } from "../lib/ai/fallbackParser";
import type { ExtractedDocumentData } from "../types";

export type InputMode = "describe" | "speak" | "upload";

interface IncidentInputProps {
  value: string;
  onChange: (text: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onDocumentConfirmed?: (
    extracted: ExtractedDocumentData,
    narrative: string,
  ) => void;
}

export function IncidentInput({
  value,
  onChange,
  onContinue,
  onBack,
  onDocumentConfirmed,
}: IncidentInputProps) {
  const [mode, setMode] = useState<InputMode>("describe");
  const [touched, setTouched] = useState(false);
  const [selectedLangPrompt, setSelectedLangPrompt] = useState<string>("en");

  const empty = value.trim().length === 0;
  const showError = touched && empty && mode !== "upload";

  const chips = useMemo(() => extractKeywordChips(value), [value]);

  const handleTranscriptCaptured = (transcript: string) => {
    setTouched(false);
    onChange(value ? `${value} ${transcript}` : transcript);
  };

  const handlePromptSelect = (promptText: string, langCode: string) => {
    setSelectedLangPrompt(langCode);
    setTouched(false);
    onChange(promptText);
  };

  const handleDocConfirmed = (
    extracted: ExtractedDocumentData,
    narrative: string,
  ) => {
    if (onDocumentConfirmed) {
      onDocumentConfirmed(extracted, narrative);
    } else {
      onChange(narrative);
      onContinue();
    }
  };

  return (
    <div className="animate-fade-up">
      <ScreenHeader
        title="Describe your journey incident"
        subtitle="Choose how you’d like to provide information: type, speak, or upload a ticket photo."
        onBack={onBack}
      />
      <StepProgress step={1} />

      {/* Segmented Mode Selector: Describe | Speak | Upload Document */}
      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-rail-100/70 p-1 text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setMode("describe")}
          className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl transition-all ${
            mode === "describe"
              ? "bg-white text-rail-950 shadow-sm"
              : "text-stone-600 hover:text-rail-950"
          }`}
        >
          <span>✍️ Describe</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("speak")}
          className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl transition-all ${
            mode === "speak"
              ? "bg-white text-rail-950 shadow-sm"
              : "text-stone-600 hover:text-rail-950"
          }`}
        >
          <span>🎙️ Speak</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl transition-all ${
            mode === "upload"
              ? "bg-white text-rail-950 shadow-sm"
              : "text-stone-600 hover:text-rail-950"
          }`}
        >
          <span>📄 Upload Photo</span>
        </button>
      </div>

      {/* MODE 1: DESCRIBE (Type) */}
      {mode === "describe" && (
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="incident"
              className="block text-sm font-bold text-rail-950"
            >
              What happened during your journey?
            </label>
            <span className="text-[11px] text-stone-500">
              {value.length > 0 ? `${value.length} characters` : "1–2 sentences is plenty"}
            </span>
          </div>

          <textarea
            id="incident"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={4}
            aria-invalid={showError}
            aria-describedby={showError ? "incident-error" : undefined}
            placeholder="My train was delayed. I travelled part of the route, but I could not complete my journey."
            className="mt-2 w-full rounded-xl border-2 border-rail-100 bg-rail-50/40 px-4 py-3 text-base leading-relaxed text-ink placeholder:text-stone-400 focus:border-rail-600 focus:outline-none"
          />

          {showError && (
            <p
              id="incident-error"
              className="mt-1.5 text-xs font-semibold text-red-700"
            >
              Please describe what happened, or tap a sample scenario below.
            </p>
          )}

          {/* Multilingual Quick Example Prompts */}
          <div className="mt-3.5 pt-3 border-t border-rail-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Language prompts (tap to try):
              </span>
              <span className="text-[10px] text-stone-400">6 Indian languages</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MULTILINGUAL_PROMPTS.map((p) => (
                <button
                  key={p.langCode}
                  type="button"
                  onClick={() => handlePromptSelect(p.prompt, p.langCode)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    selectedLangPrompt === p.langCode && value === p.prompt
                      ? "bg-rail-900 text-white"
                      : "bg-rail-50 text-stone-700 hover:bg-rail-100 border border-rail-200"
                  }`}
                >
                  {p.lang}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Keyword Chips */}
          {chips.length > 0 && (
            <div className="mt-3.5 animate-fade-up">
              <p className="mb-1.5 text-[11px] font-bold text-stone-500 uppercase tracking-wide">
                Detected by rule engine:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip, idx) => (
                  <Badge key={idx} tone={chip.tone}>
                    {chip.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* MODE 2: SPEAK (Voice Dictation) */}
      {mode === "speak" && (
        <Card className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-rail-950">
              Voice Dictation
            </h3>
            <Badge tone="rail">Microphone</Badge>
          </div>
          <p className="text-xs text-stone-600 mb-3">
            Speak your problem into your microphone. Your speech will be transcribed into the text box below for your review.
          </p>

          <SpeechInputControls
            onTranscriptCaptured={handleTranscriptCaptured}
          />

          <div className="mt-3">
            <label
              htmlFor="transcribed-text"
              className="block text-xs font-bold text-stone-600 mb-1"
            >
              Transcribed description (editable):
            </label>
            <textarea
              id="transcribed-text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder="Your transcribed speech will appear here. You can edit it before continuing."
              className="w-full rounded-xl border border-rail-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink focus:border-rail-600 focus:outline-none"
            />
          </div>
        </Card>
      )}

      {/* MODE 3: UPLOAD DOCUMENT */}
      {mode === "upload" && (
        <div className="mt-4">
          <DocumentUpload
            onConfirmDocumentFacts={handleDocConfirmed}
          />
        </div>
      )}

      {/* Sample Scenarios for 1-click Demo (Shown for Describe & Speak modes) */}
      {mode !== "upload" && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-rail-950">
              Or try a sample scenario
            </p>
            <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
              ⚡ Recommended: Boarded but disrupted halfway
            </span>
          </div>

          <div className="grid gap-2">
            {DEMO_SCENARIOS.slice(0, 5).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setTouched(false);
                  onChange(s.text);
                }}
                className={`flex min-h-[50px] items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left text-xs font-semibold transition-all ${
                  value === s.text
                    ? "border-rail-600 bg-rail-50 text-rail-950 shadow-2xs"
                    : "border-rail-100 bg-white text-stone-700 hover:border-rail-400 hover:bg-rail-50/50"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    value === s.text
                      ? "bg-rail-600 text-white"
                      : "bg-rail-100 text-rail-800"
                  }`}
                >
                  {value === s.text ? "✓" : s.id.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1">{s.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA for text/speech modes */}
      {mode !== "upload" && (
        <div className="mt-6 space-y-3">
          <Button
            onClick={() => {
              if (empty) {
                setTouched(true);
                return;
              }
              onContinue();
            }}
          >
            Check what we understood →
          </Button>
          <Disclaimer className="text-center" />
        </div>
      )}
    </div>
  );
}
