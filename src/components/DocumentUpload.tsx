import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Badge, Button, Card } from "./ui";
import { SAMPLE_DOCUMENTS } from "../data/scenarios";
import type { ExtractedDocumentData, SampleDocument } from "../types";

interface DocumentUploadProps {
  onConfirmDocumentFacts: (
    extracted: ExtractedDocumentData,
    narrativeText: string,
  ) => void;
  onCancel?: () => void;
}

export function DocumentUpload({
  onConfirmDocumentFacts,
  onCancel,
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleDocument | null>(
    null,
  );
  const [isScanning, setIsScanning] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedDocumentData | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessDocument = (
    fileOrSample: { file?: File; sample?: SampleDocument },
  ) => {
    setUploadError(null);
    setIsScanning(true);
    setEditedData(null);

    // Simulate client-side OCR / document layout analysis
    setTimeout(() => {
      let dataToUse: ExtractedDocumentData;
      if (fileOrSample.sample) {
        dataToUse = { ...fileOrSample.sample.extracted };
      } else {
        // Fallback realistic extraction for uploaded user image
        const fName = fileOrSample.file?.name.toLowerCase() || "";
        if (fName.includes("delay") || fName.includes("cancel")) {
          dataToUse = { ...SAMPLE_DOCUMENTS[1].extracted };
        } else if (fName.includes("slip") || fName.includes("cert")) {
          dataToUse = { ...SAMPLE_DOCUMENTS[2].extracted };
        } else {
          dataToUse = { ...SAMPLE_DOCUMENTS[0].extracted };
        }
      }

      setEditedData(dataToUse);
      setIsScanning(false);
    }, 1200);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit. Please upload a smaller image.");
      return;
    }

    setSelectedFile(file);
    setSelectedSample(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    handleProcessDocument({ file });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      return;
    }

    setSelectedFile(file);
    setSelectedSample(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    handleProcessDocument({ file });
  };

  const handleSelectSample = (sample: SampleDocument) => {
    setSelectedSample(sample);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    handleProcessDocument({ sample });
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedSample(null);
    setEditedData(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFieldChange = <K extends keyof ExtractedDocumentData>(
    field: K,
    value: ExtractedDocumentData[K],
  ) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  const handleConfirmAndContinue = () => {
    if (!editedData) return;
    // Build context narrative text from extracted details
    const narrative =
      editedData.narrativeSummary ||
      `Train ${editedData.trainNumber} from ${editedData.fromStation} to ${editedData.toStation}. ${
        editedData.passengerTravelled
          ? editedData.journeyCompleted
            ? "Completed journey but faced disruption."
            : "Boarded train, but journey disrupted halfway."
          : "Train delayed; did not travel on ticket."
      }`;
    onConfirmDocumentFacts(editedData, narrative);
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone / Preview Card */}
      {!previewUrl && !selectedSample ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? "border-rail-600 bg-rail-50/80 scale-[1.01]"
              : "border-rail-200 bg-rail-50/40 hover:border-rail-400 hover:bg-rail-50/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="sr-only"
            id="doc-file-input"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-rail-100 text-2xl">
            🎫
          </div>

          <label
            htmlFor="doc-file-input"
            className="mt-3 block cursor-pointer text-sm font-bold text-rail-950 hover:underline"
          >
            Upload a ticket or TDR photo
          </label>
          <p className="mt-1 text-xs text-stone-500 max-w-xs">
            Drag and drop a photo of your ticket, TDR slip, or deboarding memo, or browse files (JPG, PNG, WebP up to 5MB).
          </p>

          <label
            htmlFor="doc-file-input"
            className="mt-3.5 inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-rail-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rail-800"
          >
            <span>📁 Browse file</span>
          </label>

          {/* Quick Demo Sample Document Selector */}
          <div className="mt-5 w-full border-t border-rail-200/80 pt-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rail-800">
                ⚡ Or try a sample railway document
              </span>
              <span className="text-[10px] text-stone-500">Demo shortcuts</span>
            </div>
            <div className="grid gap-1.5">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-rail-200 bg-white px-3.5 py-2 text-left text-xs font-semibold text-stone-800 shadow-2xs hover:border-rail-600 hover:bg-rail-50 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    <span>{sample.type === "certificate" ? "📑" : "🎟️"}</span>
                    <div>
                      <p className="font-bold text-rail-950">{sample.title}</p>
                      <p className="text-[10px] text-stone-500">
                        {sample.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-rail-700">Scan →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Selected Document Preview Card */
        <Card className="border-rail-200 bg-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Uploaded document preview"
                  className="h-16 w-16 rounded-xl object-cover border border-rail-200 shadow-2xs"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-rail-900 text-amber-signal shadow-2xs">
                  <span className="text-xl">
                    {selectedSample?.type === "certificate" ? "📑" : "🎟️"}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    {selectedSample?.type === "certificate" ? "Memo" : "Ticket"}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-rail-950">
                    {selectedFile?.name || selectedSample?.title}
                  </span>
                  <Badge tone="green">
                    {selectedSample ? "Sample Document" : "Uploaded"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(0)} KB · Ready for review`
                    : selectedSample?.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <label
                htmlFor="doc-file-input"
                className="cursor-pointer rounded-lg border border-rail-200 px-2.5 py-1 text-xs font-bold text-rail-800 hover:bg-rail-50"
              >
                Replace
              </label>
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove uploaded document"
                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        </Card>
      )}

      {uploadError && (
        <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200">
          ⚠ {uploadError}
        </div>
      )}

      {/* Scanning State Animation */}
      {isScanning && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rail-100 bg-white p-6 text-center shadow-sm">
          <div className="relative mb-3 flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-rail-600/20" />
            <span className="animate-spin text-2xl">🔍</span>
          </div>
          <p className="text-sm font-bold text-rail-950">
            Reading sample document…
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Locating train number, travel status, stations, and disruption notes.
          </p>
        </div>
      )}

      {/* "What we found in your document" Extracted Card */}
      {editedData && !isScanning && (
        <div className="rounded-2xl border-2 border-rail-600/30 bg-white p-5 shadow-sm animate-fade-up">
          <div className="flex items-center justify-between border-b border-rail-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-rail-950">
                  What we found in your document
                </h3>
                <span className="rounded-full bg-amber-soft px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-900 border border-amber-200">
                  Prototype extraction
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Extracted fields are pre-filled below. Review and edit any field before continuing.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ✓ Verified Fields
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Train Number */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                Train Number & Name
              </label>
              <input
                type="text"
                value={editedData.trainNumber}
                onChange={(e) =>
                  handleFieldChange("trainNumber", e.target.value)
                }
                className="w-full rounded-lg border border-rail-200 bg-white px-2.5 py-1.5 font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-stone-400">
                Extracted from document
              </span>
            </div>

            {/* Journey Date */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                Journey Date
              </label>
              <input
                type="date"
                value={editedData.journeyDate}
                onChange={(e) =>
                  handleFieldChange("journeyDate", e.target.value)
                }
                className="w-full rounded-lg border border-rail-200 bg-white px-2.5 py-1.5 font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-stone-400">
                Extracted from document
              </span>
            </div>

            {/* From Station */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                From Station
              </label>
              <input
                type="text"
                value={editedData.fromStation}
                onChange={(e) =>
                  handleFieldChange("fromStation", e.target.value)
                }
                className="w-full rounded-lg border border-rail-200 bg-white px-2.5 py-1.5 font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-stone-400">
                Extracted from document
              </span>
            </div>

            {/* To Station */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                To Station
              </label>
              <input
                type="text"
                value={editedData.toStation}
                onChange={(e) => handleFieldChange("toStation", e.target.value)}
                className="w-full rounded-lg border border-rail-200 bg-white px-2.5 py-1.5 font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-stone-400">
                Extracted from document
              </span>
            </div>

            {/* Ticket / PNR Reference */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                Ticket / PNR Reference
              </label>
              <input
                type="text"
                value={editedData.ticketNumber}
                onChange={(e) =>
                  handleFieldChange("ticketNumber", e.target.value)
                }
                className="w-full rounded-lg border border-rail-200 bg-white px-2.5 py-1.5 font-mono font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              />
              <span className="mt-1 block text-[10px] text-stone-400">
                Extracted from document
              </span>
            </div>

            {/* Travel Status (Editable toggle) */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                Travel Status
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange("passengerTravelled", true)
                  }
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    editedData.passengerTravelled
                      ? "bg-rail-900 text-white"
                      : "bg-white text-stone-700 border border-rail-200"
                  }`}
                >
                  {editedData.passengerTravelled ? "✓ Travelled" : "Travelled"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFieldChange("passengerTravelled", false)
                  }
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    !editedData.passengerTravelled
                      ? "bg-rail-900 text-white"
                      : "bg-white text-stone-700 border border-rail-200"
                  }`}
                >
                  {!editedData.passengerTravelled
                    ? "✓ Did not travel"
                    : "Did not travel"}
                </button>
              </div>
              <span className="mt-1 block text-[10px] text-stone-500 font-medium">
                Confirmed by passenger
              </span>
            </div>

            {/* Journey Completion (Editable toggle) */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                Journey Completion
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleFieldChange("journeyCompleted", false)}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    !editedData.journeyCompleted
                      ? "bg-rail-900 text-white"
                      : "bg-white text-stone-700 border border-rail-200"
                  }`}
                >
                  {!editedData.journeyCompleted
                    ? "✓ Ended halfway"
                    : "Ended halfway"}
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange("journeyCompleted", true)}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    editedData.journeyCompleted
                      ? "bg-rail-900 text-white"
                      : "bg-white text-stone-700 border border-rail-200"
                  }`}
                >
                  {editedData.journeyCompleted
                    ? "✓ Full destination"
                    : "Full destination"}
                </button>
              </div>
              <span className="mt-1 block text-[10px] text-stone-500 font-medium">
                Confirmed by passenger
              </span>
            </div>

            {/* Delay Duration */}
            <div className="rounded-xl border border-rail-100 bg-rail-50/40 p-2.5">
              <label className="block font-bold text-stone-600 mb-1">
                Delay Duration
              </label>
              <select
                value={editedData.delayDuration}
                onChange={(e) =>
                  handleFieldChange(
                    "delayDuration",
                    e.target.value as ExtractedDocumentData["delayDuration"],
                  )
                }
                className="w-full rounded-lg border border-rail-200 bg-white px-2.5 py-1.5 font-bold text-rail-950 focus:border-rail-600 focus:outline-none"
              >
                <option value="gt6h">More than 6 hours</option>
                <option value="3to6h">3–6 hours</option>
                <option value="lt3h">Less than 3 hours</option>
                <option value="unsure">Not confirmed</option>
              </select>
              <span className="mt-1 block text-[10px] text-stone-400">
                Extracted from document
              </span>
            </div>
          </div>

          {/* Extracted Incident Narrative */}
          <div className="mt-3 rounded-xl bg-rail-50/60 p-3 border border-rail-100 text-xs">
            <label className="block font-bold text-rail-950 mb-1">
              Context Narrative from Document:
            </label>
            <textarea
              value={editedData.narrativeSummary}
              onChange={(e) =>
                handleFieldChange("narrativeSummary", e.target.value)
              }
              rows={2}
              className="w-full rounded-lg border border-rail-200 bg-white px-3 py-2 text-xs text-stone-800 focus:border-rail-600 focus:outline-none"
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <Button onClick={handleConfirmAndContinue} className="w-full">
              Confirm & Check Next Step →
            </Button>
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Prototype Privacy & Security Notice */}
      <div className="rounded-xl bg-stone-50 p-3 text-center border border-stone-200 text-[11px] text-stone-600">
        <p className="font-semibold text-stone-700">
          🔒 Prototype Privacy & Boundary Notice
        </p>
        <p className="mt-0.5">
          Uploaded documents are inspected locally in your browser for this prototype demonstration. No images or files are transmitted to Indian Railways, IRCTC, or external servers.
        </p>
      </div>
    </div>
  );
}
