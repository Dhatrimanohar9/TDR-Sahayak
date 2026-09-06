import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechInputControlsProps {
  onTranscriptCaptured: (text: string) => void;
}

// Browser Web Speech API type definitions for TypeScript compatibility
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function SpeechInputControls({
  onTranscriptCaptured,
}: SpeechInputControlsProps) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>("");
  const [capturedInSession, setCapturedInSession] = useState<boolean>(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechConstructor = getSpeechRecognitionConstructor();
    setIsSupported(!!SpeechConstructor);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setStatusMessage(null);
    setInterimText("");

    const SpeechConstructor = getSpeechRecognitionConstructor();
    if (!SpeechConstructor) {
      setErrorMessage("Speech recognition is not supported in your current browser. You can type your description manually.");
      return;
    }

    try {
      const recognition = new SpeechConstructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage("Listening… Speak your problem clearly into your microphone.");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }

        if (interimChunk.trim()) {
          setInterimText(interimChunk.trim());
        }

        if (finalChunk.trim()) {
          setInterimText("");
          onTranscriptCaptured(finalChunk.trim());
          setCapturedInSession(true);
          setStatusMessage("Speech captured! Review your text before continuing.");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setInterimText("");
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setErrorMessage("Microphone access was denied. Please allow microphone access or type your problem manually.");
        } else if (event.error === "no-speech") {
          setStatusMessage("No speech was detected. Tap 'Speak your problem' to try again or type manually.");
        } else {
          setErrorMessage(`Speech recognition error (${event.error}). You can type your problem manually.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setInterimText("");
      setErrorMessage("Failed to start speech recognition. Please type your problem manually.");
    }
  }, [selectedLang, onTranscriptCaptured]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setStatusMessage("Listening stopped. Review your text before continuing.");
    } else {
      startListening();
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-rail-100 bg-rail-50/50 p-3 text-sm">
      {/* Top row: Button & Language selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            aria-label={isListening ? "Stop listening to speech" : "Speak your problem using microphone"}
            className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
              isListening
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                : "bg-rail-900 text-white hover:bg-rail-800"
            }`}
          >
            <span aria-hidden className="text-sm">
              {isListening ? "🔴" : "🎙️"}
            </span>
            <span>{isListening ? "Listening… (Tap to stop)" : "Speak your problem"}</span>
          </button>

          {capturedInSession && !isListening && (
            <button
              type="button"
              onClick={startListening}
              aria-label="Try speaking your problem again"
              className="flex min-h-[44px] items-center gap-1 rounded-xl border border-rail-200 bg-white px-3 py-2 text-xs font-bold text-rail-800 hover:bg-rail-50"
            >
              🔄 Try again
            </button>
          )}
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="font-semibold text-stone-500">Lang:</span>
          <button
            type="button"
            onClick={() => setSelectedLang("en-IN")}
            aria-label="Set speech recognition language to English (India)"
            className={`rounded-lg px-2 py-1 text-xs font-bold transition-colors ${
              selectedLang === "en-IN"
                ? "bg-rail-900 text-white"
                : "bg-white text-stone-700 border border-rail-200 hover:bg-rail-50"
            }`}
          >
            English (IN)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang("hi-IN")}
            aria-label="Set speech recognition language to Hindi (India)"
            className={`rounded-lg px-2 py-1 text-xs font-bold transition-colors ${
              selectedLang === "hi-IN"
                ? "bg-rail-900 text-white"
                : "bg-white text-stone-700 border border-rail-200 hover:bg-rail-50"
            }`}
          >
            Hindi (IN)
          </button>
        </div>
      </div>

      {/* Dynamic Status / Feedback Banner */}
      <div aria-live="polite" className="mt-2.5">
        {isListening && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-rail-900">
              <span className="inline-block h-2 w-2 rounded-full bg-red-600 animate-ping" />
              <span>Listening… Speak clearly in {selectedLang === "en-IN" ? "English / Hinglish" : "Hindi"}.</span>
            </div>
            {interimText && (
              <p className="text-xs italic text-stone-600 bg-white/70 p-1.5 rounded border border-rail-100">
                “{interimText}…”
              </p>
            )}
          </div>
        )}

        {statusMessage && !isListening && !errorMessage && (
          <p className="text-xs font-medium text-rail-800">
            ✓ {statusMessage}
          </p>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-800 border border-red-200">
            ⚠ {errorMessage}
          </div>
        )}

        {!isSupported && !errorMessage && (
          <p className="text-xs text-amber-900 font-medium">
            ℹ️ Speech recognition is unavailable on this browser or device. You can type your description in the box above.
          </p>
        )}
      </div>

      {/* Mandatory accuracy & device support note */}
      <p className="mt-2 text-[11px] text-stone-500">
        Speech recognition depends on browser and device support. If it is unavailable, you can type your description manually. Supported options: English (IN) & Hindi (IN). Recognition accuracy is not guaranteed.
      </p>
    </div>
  );
}
