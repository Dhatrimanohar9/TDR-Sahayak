import type {
  AnalysisResult,
  FollowUpQuestion,
  IncidentFacts,
  MissingFactKey,
} from "../../types";
import { FOLLOW_UP_QUESTIONS } from "../../data/scenarios";

/**
 * Deterministic keyword-based interpreter. This is the no-API-key fallback so
 * the demo is always functional, and it also acts as the shape the OpenAI
 * path must conform to.
 */

const delayPatterns: { re: RegExp; duration: IncidentFacts["delayDuration"] }[] = [
  { re: /(more than (six|6)|6\+|several hours|whole night|overnight|many hours|entire day|bahut zyada late|6\s*घंटे|6\s*గంటలు|6\s*மணி நேரம்|6\s*മണിക്കൂർ|6\s*ಗಂಟೆ|చాలా గంటలు|பல மணி நேரம்)/i, duration: "gt6h" },
  { re: /(3|three|4|four|5|five|6|six)\s*(to|-|–)?\s*(6|six)?\s*(hours?|घंटे|గంటలు|மணி நேரம்|മണിക്കൂർ|ಗಂಟೆ)|bahut late|kaafi late|bahut der|4\s*घंटे|4\s*గంటలకు|4\s*மணி|4\s*മണിക്കൂർ|4\s*ಗಂಟೆ/i, duration: "3to6h" },
  { re: /(less than (three|3)|couple of hours|a few hours|2 hours|two hours|1 hour|one hour|an hour|thodi der|कम देरी|తక్కువ ఆలస్యం|குறைந்த தாமதம்)/i, duration: "lt3h" },
];

const disruptionPhrases: { re: RegExp; label: string }[] = [
  { re: /cancel+ed|cancel+lation|cancel ho gayi|cancel ho gaya|radd ho gayi|రద్దయింది|రద్దు|ரத்து|റദ്ദാക്കി|ರದ್ದು/i, label: "Train cancelled" },
  { re: /terminat+ed|short terminat|divert|aadhe raste|beech mein|beech me|बीच में रुक|మధ్యలోనే|ఆగిపోయింది|పాதியிலேயே|பாதி தூரம்|പകുതി ദൂരം|അರ್ಧ ದಾರಿ|ಮಧ್ಯದಲ್ಲೇ/i, label: "Train terminated early or disrupted midway" },
  { re: /could not board|couldn.?t board|denied (boarding|entry)|not allowed to board|platform.{0,30}(crowd|block|disorder)|chadh nahi paya|ఎక్కలేకపోయాను|ஏற முடியவில்லை|കയറാൻ കഴിഞ്ഞില്ല|ಹತ್ತಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/i, label: "Could not board" },
  { re: /station (pe|par)? late|late pahuch|der se pahuch|traffic me/i, label: "Passenger arrived late at station" },
  { re: /strike|blockade|protest|signal (failure|problem)|derail/i, label: "Service disruption" },
  { re: /flood|accident|weather|cyclone|fog/i, label: "Weather or accident disruption" },
];

const dateMatch = /\b(\d{1,2}(st|nd|rd|th)?[\s-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*([\s'-]+\d{2,4})?)\b/i;
const numericDateMatch = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/;

interface EvidenceResult {
  value: boolean | "unknown";
  hasConflict: boolean;
}

function resolveEvidence(positive: boolean, negative: boolean): EvidenceResult {
  if (positive && negative) {
    return { value: "unknown", hasConflict: true };
  }
  if (positive) return { value: true, hasConflict: false };
  if (negative) return { value: false, hasConflict: false };
  return { value: "unknown", hasConflict: false };
}

export function fallbackAnalyze(text: string): AnalysisResult {
  const t = text.toLowerCase();

  // 1. Independent Boarding Signals (Positive vs Negative)
  const boardedPositive = /\b(i\s+(?:boarded|got\s+on|was\s+on\s+board|took|sat\s+in)|managed\s+to\s+board|still\s+boarded|train\s+me(?:in)?\s+chadh|chadh\s+gaya|chadh\s+gayi|chadh\s+gaye|board\s+kiya|board\s+kar\s+liya)\b|ఎక్కాను|ஏறினேன்|കയറി|ಹತ್ತಿದೆ/i.test(t);
  const boardedNegative = /\b(could\s+not\s+board|couldn['’]?t\s+board|not\s+able\s+to\s+board|unable\s+to\s+board|denied\s+boarding|was\s+not\s+allowed\s+to\s+board|missed\s+the\s+train|train\s+miss\s+ho\s+gayi|train\s+chhut\s+gayi|miss\s+ho\s+gayi|chadh\s+nahi\s+paya|nahi\s+chadh\s+paya|chadh\s+nahi\s+paye|boarding\s+nahi\s+mili)\b|ఎక్కలేకపోయాను|ஏற\s*முடியவில்லை|കയറാൻ\s*കഴിഞ്ഞില്ല|ಹತ್ತಲು\s*ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/i.test(t);
  const boardingEvidence = resolveEvidence(boardedPositive, boardedNegative);

  // 2. Independent Travelled Signals (Positive vs Negative)
  const travelledPositive = /\b(i\s+(?:travel+ed|did\s+travel|went|undertook\s+the\s+journey)|travel\s+kiya|safar\s+kiya|safar\s+taya?\s+kiya|safar\s+poora|pura\s+safar|poora\s+safar|completed\s+my\s+journey|completed\s+the\s+trip|part\s+of\s+the\s+route|travelled\s+part|travelled\s+fully)\b|सफर\s*किया|सफर\s*तय\s*किया|यात्रा\s*की|ప్రయాణించాను|సగం\s*దూరం|பயணம்\s*செய்தேன்|பாதி\s*தூரம்|യാത്ര\s*ചെയ്തു|പകുതി\s*ദൂരം|ಪ್ರಯಾಣಿಸಿದೆ|ಅರ್ಧ\s*ದಾರಿ/i.test(t);
  const travelledNegative = /\b(did\s+not\s+travel|didn['’]?t\s+travel|not\s+travel+ing|decided\s+not\s+to\s+travel|decided\s+not\s+to|cancelled\s+my\s+(?:trip|plan|ticket)|did\s+not\s+go|didn['’]?t\s+go|travel\s+nahi\s+kiya|travel\s+nahi\s+ki|journey\s+nahi\s+ki|journey\s+nahi\s+kiya|safar\s+nahi\s+kiya|nahi\s+travel\s+kiya|nahi\s+gaya|nahi\s+gaye)\b|यात्रा\s*नहीं\s*की|ప్రయాణించలేదు|పయనం\s*చేయలేదు|பயணம்\s*செய்யவில்லை|യാത്ര\s*ചെയ്തില്ല|ಪ್ರಯಾಣ\s*ಮಾಡಲಿಲ್ಲ/i.test(t);
  const travelEvidence = resolveEvidence(travelledPositive, travelledNegative);

  // 3. Independent Completion Signals (Positive vs Negative)
  const completedPositive = /\b(completed\s+my\s+(?:journey|trip)|completed\s+the\s+(?:journey|trip)|reached\s+(?:my\s+)?destination|made\s+it\s+to\s+(?:my\s+)?destination|safely\s+reached|journey\s+was\s+completed|travelled\s+fully|safar\s+poora|poora\s+safar|pura\s+safar|safar\s+complete|destination\s+pahunch|destination\s+pahuch|fine\s+at\s+destination)\b|यात्रा\s*पूरी\s*हो\s*गई|पूरी\s*यात्रा|ప్రయాణం\s*పూర్తయింది|பயணம்\s*முடிந்தது|യാത്ര\s*പൂർത്തിയായി|ಪ್ರಯಾಣ\s*ಪೂರ್ಣಗೊಂಡಿತು/i.test(t);
  const completedNegative = /(halfway|part\s+of\s+the\s+route|partway|midway|could\s+not\s+complete|didn['’]?t\s+complete|not\s+complete|journey.*incomplet|short\s+terminat|terminated\s+early|dropped\s+at|got\s+off\s+at|deboarded|aadhe\s+raste|beech\s+mein|beech\s+me|aadha\s+rasta|journey\s+complete\s+nahi|poori\s+nahi\s+hui|puri\s+nahi\s+hui|beech\s+me\s+chhod\s+diya)\b|आधा\s*सफर|बीच\s*में\s*रुक|पूरी\s*नहीं\s*हो\s*सकी|పూర్తి\s*కాలేదు|ముழு\s*பயணம்\s*செய்ய\s*முடியவில்லை|പൂർത്തിയാക്കാൻ\s*സാധിച്ചില്ല|ಪೂರ್ಣಗೊಳಿಸಲು\s*ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/i.test(t);
  const completionEvidence = resolveEvidence(completedPositive, completedNegative);

  // Track whether any contradiction exists
  const hasConflict = boardingEvidence.hasConflict || travelEvidence.hasConflict || completionEvidence.hasConflict;

  // Passenger delay vs train delay
  const passengerLateAtStation = /\b(station\s+(?:pe|par)?\s*late|late\s+pahuch|der\s+se\s+pahuch|traffic\s+me(?:in)?)\b/i.test(t);
  const mentionsTrainDelay = /\b(train\s+(?:bahut\s+)?late|bahut\s+late|kaafi\s+late|train\s+der\s+se|train\s+was\s+late|train\s+delayed|delay+ed?|behind\s+schedule)\b|लेट|ఆలస్య|ఆలస్యమైంది|தாமத|தாமதமானது|വൈകി|ತಡ/i.test(t) || (!passengerLateAtStation && /\b(der\s+se|late)\b/i.test(t));

  // Ticket cancellation signals
  const cancelledYes = /\b(cancel+ed?\s+(?:my|the)\s+(?:ticket|booking)|ticket\s+(?:was\s+)?cancel+ed?|filed?\s+(?:a\s+)?tdr|cancel+ed?\s+before|cancel\s+ho\s+gayi|cancel\s+ho\s+gaya|train\s+cancel|train\s+radd|radd\s+ho\s+gayi)\b/i.test(t);
  const cancelledNo = /\b(did\s+not\s+cancel|didn['’]?t\s+cancel|no\s+cancellation|cancel\s+nahi\s+kiya|cancel\s+nahi\s+karwaya)\b/i.test(t);

  // Derive consolidated facts without guessing unknown status
  let passengerBoarded: boolean | "unknown" = boardingEvidence.value;
  let passengerTravelled: boolean | "unknown" = travelEvidence.value;
  let journeyCompleted: boolean | "unknown" = completionEvidence.value;
  let partialJourney: boolean | "unknown" = "unknown";

  // Logical inferences between signals
  if (completedPositive && !completionEvidence.hasConflict) {
    journeyCompleted = true;
    partialJourney = false;
    passengerBoarded = true;
    passengerTravelled = true;
  } else if (completedNegative && !completionEvidence.hasConflict) {
    journeyCompleted = false;
    if (passengerBoarded === true || passengerTravelled === true || completedNegative) {
      partialJourney = true;
      passengerTravelled = true;
      passengerBoarded = true;
    }
  }

  // Cross-inference between boarded and travelled
  if (passengerBoarded === false && passengerTravelled === "unknown") {
    passengerTravelled = false;
  }
  if (passengerTravelled === false && passengerBoarded === "unknown") {
    passengerBoarded = false;
  }
  if (passengerBoarded === true && passengerTravelled === "unknown") {
    passengerTravelled = true;
  }

  // Delay duration
  let delayDuration: IncidentFacts["delayDuration"] = "unsure";
  for (const { re, duration } of delayPatterns) {
    if (re.test(t)) {
      delayDuration = duration;
      break;
    }
  }

  // Disruption label
  let disruptionMentioned: string | null = null;
  for (const { re, label } of disruptionPhrases) {
    if (re.test(t)) {
      disruptionMentioned = label;
      break;
    }
  }
  if (completedNegative && !disruptionMentioned) {
    disruptionMentioned = "Disrupted midway / partial route";
  }

  // Journey date and identifiers
  const dateM = text.match(dateMatch) || text.match(numericDateMatch);
  const journeyDateMentioned = dateM ? dateM[0] : null;

  const trainM = text.match(/(?:train\s*(?:no\.?|number)?\s*|#)?\b([1-2]\d{4})\b/i);
  const trainNumber = trainM ? trainM[1] : null;

  const pnrM = text.match(/(?:pnr|ticket)(?:\s*(?:no\.?|number|#))?[:\s]*\b(\d{10})\b/i);
  const pnrNumber = pnrM ? pnrM[1] : null;

  const routeM = text.match(/\bfrom\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+to\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
  let fromStation = routeM ? routeM[1].trim() : null;
  let toStation = routeM ? routeM[2].trim() : null;
  if (toStation) {
    toStation = toStation.replace(/\s+(on|with|by|train|was|is|at|in|via)$/i, "").trim();
  }
  if (fromStation) {
    fromStation = fromStation.replace(/\s+(to|on|with|by|train|was|is|at|in|via)$/i, "").trim();
  }

  // Classify Incident Type Deterministically
  // CRITICAL RULE: Never guess eligibility if travel status is unknown.
  let incidentType: IncidentFacts["incidentType"];

  if (hasConflict) {
    incidentType = "ambiguous";
  } else if (partialJourney === true || (passengerBoarded === true && journeyCompleted === false)) {
    incidentType = "partial_journey";
  } else if (boardedNegative || (passengerBoarded === false && disruptionMentioned === "Could not board")) {
    incidentType = "could_not_board";
  } else if (passengerTravelled === true && journeyCompleted === true) {
    incidentType = "travelled_completed";
  } else if (passengerTravelled === true && journeyCompleted === "unknown") {
    incidentType = "travelled_disrupted";
  } else if (passengerTravelled === false) {
    if (disruptionMentioned === "Could not board") {
      incidentType = "could_not_board";
    } else {
      incidentType = "delay_not_travelled";
    }
  } else {
    // When passengerTravelled is unknown, NEVER guess delay_not_travelled!
    incidentType = "ambiguous";
  }

  const cancelledBeforeDeparture: boolean | "unknown" =
    cancelledYes ? true : cancelledNo ? false : "unknown";

  const facts: IncidentFacts = {
    incidentType,
    passengerTravelled,
    passengerBoarded,
    journeyCompleted,
    partialJourney,
    delayDuration: mentionsTrainDelay ? delayDuration : "unsure",
    cancelledBeforeDeparture,
    disruptionMentioned,
    journeyDateMentioned,
    fromStation,
    toStation,
    trainNumber,
    ticketNumber: pnrNumber,
    pnrNumber,
  };

  const missingFacts = computeMissingFacts(facts);
  const suggestedQuestion = pickNextQuestion(facts, missingFacts);
  const confidence = computeConfidence(facts, missingFacts.length);

  let statusLabel: AnalysisResult["statusLabel"] = "High confidence";
  let requiresClarification = false;

  if (hasConflict) {
    statusLabel = "Conflicting evidence";
    requiresClarification = true;
  } else if (facts.incidentType === "ambiguous" || missingFacts.length > 0) {
    statusLabel = "Needs clarification";
    requiresClarification = true;
  }

  return {
    facts,
    confidence,
    statusLabel,
    requiresClarification,
    missingFacts,
    suggestedQuestion,
    summary: buildSummary(facts),
    source: "fallback",
  };
}

export function computeMissingFacts(facts: IncidentFacts): MissingFactKey[] {
  const missing: MissingFactKey[] = [];
  if (facts.passengerTravelled === "unknown") missing.push("passengerTravelled");
  if (facts.passengerBoarded === "unknown") missing.push("passengerBoarded");
  if (
    (facts.passengerTravelled === true || facts.passengerBoarded === true) &&
    facts.journeyCompleted === "unknown"
  ) {
    missing.push("journeyCompleted");
  }
  if (facts.incidentType !== "ambiguous" && facts.delayDuration === "unsure") {
    missing.push("delayDuration");
  }
  if (
    facts.passengerTravelled === false &&
    facts.cancelledBeforeDeparture === "unknown"
  ) {
    missing.push("cancelledBeforeDeparture");
  }
  if (
    (facts.incidentType === "travelled_disrupted" ||
      facts.incidentType === "partial_journey" ||
      facts.incidentType === "could_not_board") &&
    !facts.disruptionMentioned
  ) {
    missing.push("disruptionType");
  }
  if (!facts.journeyDateMentioned) missing.push("journeyDate");
  return missing;
}

export function pickNextQuestion(
  facts: IncidentFacts,
  missing: MissingFactKey[],
): FollowUpQuestion | null {
  void facts; // kept in the signature so callers can pass full fact context
  if (missing.length === 0) return null;
  const key = missing[0];
  return FOLLOW_UP_QUESTIONS[key];
}

/** Confidence is a simple heuristic: more known facts and no ambiguity = higher. */
function computeConfidence(facts: IncidentFacts, missingCount: number): number {
  let score = 0.35;
  if (facts.incidentType !== "ambiguous") score += 0.25;
  if (facts.passengerTravelled !== "unknown") score += 0.15;
  if (facts.passengerBoarded !== "unknown") score += 0.1;
  if (facts.delayDuration !== "unsure") score += 0.1;
  if (facts.disruptionMentioned) score += 0.05;
  score -= missingCount * 0.05;
  return Math.min(0.95, Math.max(0.2, score));
}

function buildSummary(facts: IncidentFacts): string {
  switch (facts.incidentType) {
    case "delay_not_travelled":
      return "It sounds like your train was delayed and you did not make the journey.";
    case "could_not_board":
      return "It sounds like you were unable to board the train or complete boarding.";
    case "partial_journey":
      return "It sounds like you boarded the train, but your journey was disrupted before reaching your destination.";
    case "travelled_completed":
      return "It sounds like you completed your journey to your destination despite delay or disruption.";
    case "travelled_disrupted":
      return "It sounds like you travelled but the journey did not go as planned.";
    default:
      return "We understood part of your description, but your travel status needs confirmation.";
  }
}

export interface KeywordChip {
  label: string;
  tone: "green" | "amber";
}

export function extractKeywordChips(text: string): KeywordChip[] {
  if (!text.trim()) return [];
  const t = text.toLowerCase();
  const chips: KeywordChip[] = [];

  const mentionsDelay = /\b(delay+ed?|late|behind\s+schedule|held\s+up|waiting|der\s+se)\b|लेट|ఆలస్య|ఆలస్యమైంది|தாமத|தாமதமானது|വൈകി|തಡ/i.test(t);
  if (mentionsDelay) {
    let delayFound = false;
    for (const { re, duration } of delayPatterns) {
      if (re.test(t)) {
        chips.push({
          label: duration === "gt6h" ? "Delayed 6+ hours" : duration === "3to6h" ? "Delayed 3-6 hours" : "Delayed <3 hours",
          tone: "green"
        });
        delayFound = true;
        break;
      }
    }
    if (!delayFound) {
      chips.push({ label: "Delayed (unknown duration)", tone: "amber" });
    }
  }

  const partialMatches = /(halfway|part\s+of\s+the\s+route|partway|midway|could\s+not\s+complete|didn['’]?t\s+complete|not\s+complete|journey.*incomplet|short\s+terminat|terminated\s+early|dropped\s+at|got\s+off\s+at|deboarded|aadhe\s+raste|beech\s+mein|beech\s+me|aadha\s+rasta|journey\s+complete\s+nahi|poori\s+nahi\s+hui|puri\s+nahi\s+hui|beech\s+me\s+chhod\s+diya)\b|आधा\s*सफर|बीच\s*में\s*रुक|पूरी\s*नहीं\s*हो\s*सकी|పూర్తి\s*కాలేదు|ముழு\s*பயணம்\s*செய்ய\s*முடியவில்லை|പൂർത്തിയാക്കാൻ\s*സാധിച്ചില്ല|ಪೂರ್ಣಗೊಳಿಸಲು\s*ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/i.test(t);
  if (partialMatches) {
    chips.push({ label: "Partial journey (disrupted midway)", tone: "green" });
  }

  for (const { re, label } of disruptionPhrases) {
    if (re.test(t)) {
      chips.push({ label, tone: "green" });
      break;
    }
  }

  const completedYes = /\b(completed\s+my\s+(?:journey|trip)|reached\s+(?:my\s+)?destination|made\s+it\s+to\s+(?:my\s+)?destination|safely\s+reached|safar\s+poora|poora\s+safar|pura\s+safar|safar\s+complete)\b|यात्रा\s*पूरी|ప్రయాణం\s*పూర్తయింది|பயணம்\s*முடிந்தது|യാത്ര\s*പൂർത്തിയായി|ಪ್ರಯಾಣ\s*ಪೂರ್ಣಗೊಂಡಿತು/i.test(t);
  const travelledYes = /\b(i\s+(?:travel+ed|did\s+travel|took\s+the\s+train|boarded)|safar\s+kiya|travel\s+kiya)\b|सफर\s*किया|ప్రయాణించాను|பயணம்\s*செய்தேன்|യാത്ര\s*ചെയ്തു|ಪ್ರಯಾಣಿಸಿದೆ/i.test(t);
  const travelledNo = /\b(did\s+not\s+travel|didn['’]?t\s+travel|not\s+travel+ing|decided\s+not\s+to|cancelled\s+my\s+(?:trip|plan)|did\s+not\s+board|didn['’]?t\s+board|safar\s+nahi\s+kiya|travel\s+nahi\s+kiya)\b|यात्रा\s*नहीं\s*की|ప్రయాణించలేదు|பயணம்\s*செய்யவில்லை|യാത്ര\s*ചെയ്തില്ല|ಪ್ರಯಾಣ\s*ಮಾಡಲಿಲ್ಲ/i.test(t);

  if (completedYes && travelledYes) {
    chips.push({ label: "Completed journey to destination", tone: "green" });
  } else if (travelledYes && !partialMatches) {
    chips.push({ label: "Travelled", tone: "green" });
  } else if (travelledNo) {
    chips.push({ label: "Did not travel", tone: "green" });
  }

  const boardedNo = /(could\s+not\s+board|couldn['’]?t\s+board|not\s+able\s+to\s+board|missed\s+the\s+train|denied\s+boarding|was\s+not\s+allowed|chadh\s+nahi\s+paya|nahi\s+chadh\s+paya|ఎక్కలేకపోయాను|ஏற\s*முடியவில்லை|കയറാൻ\s*ಕഴിഞ്ഞില്ല|ಹತ್ತಲು\s*ಸಾಧ್ಯವಾಗಲಿಲ್ಲ)/i.test(t);
  const boardedYes = /\b(i\s+(?:boarded|got\s+on|was\s+on\s+board)|managed\s+to\s+board|still\s+boarded|train\s+me(?:in)?\s+chadh|chadh\s+gaya|chadh\s+gaye|board\s+kiya)\b|ఎక్కాను|ஏறினேன்|കയറി|ಹತ್ತಿದೆ/i.test(t);

  if (boardedNo && !chips.some((c) => c.label === "Could not board")) {
    chips.push({ label: "Could not board", tone: "green" });
  } else if (boardedYes && !chips.some((c) => c.label === "Boarded")) {
    chips.push({ label: "Boarded train", tone: "green" });
  }

  const dateM = text.match(dateMatch);
  if (dateM) chips.push({ label: dateM[0], tone: "green" });

  return chips;
}
