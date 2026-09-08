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
  { re: /missed.{0,20}(connection|train)|train miss ho gayi|train chhut gayi|miss ho gayi|రైలు తప్పిపోయింది|ரயில் தவறவிட்டது|ട്രെയിൻ നഷ്ടപ്പെട്ടു|ರೈಲು ತಪ್ಪಿಹೋಯಿತು/i, label: "Missed train" },
  { re: /could not board|couldn.?t board|denied (boarding|entry)|not allowed to board|platform.{0,30}(crowd|block|disorder)|chadh nahi paya|ఎక్కలేకపోయాను|ஏற முடியவில்லை|കയറാൻ കഴിഞ്ഞില്ല|ಹತ್ತಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/i, label: "Could not board" },
  { re: /station (pe|par)? late|late pahuch|der se pahuch|traffic me/i, label: "Passenger arrived late at station" },
  { re: /strike|blockade|protest|signal (failure|problem)|derail/i, label: "Service disruption" },
  { re: /flood|accident|weather|cyclone|fog/i, label: "Weather or accident disruption" },
];

const dateMatch = /\b(\d{1,2}(st|nd|rd|th)?[\s-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*([\s'-]+\d{2,4})?)\b/i;
const numericDateMatch = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/;

function unknownWhenUnclear(value: boolean | undefined | null): boolean | "unknown" {
  return typeof value === "boolean" ? value : "unknown";
}

export function fallbackAnalyze(text: string): AnalysisResult {
  const t = text.toLowerCase();

  // Explicit Hinglish, regional languages & English patterns for travel status
  const travelledYes = /\b(i (travel+ed|did travel|took the train|boarded)|my journey (was|is) (completed)|completed my (journey|trip)|safarn? poora|part of the route|travel kiya|safar kiya)\b|सफर तय किया|सफर किया|ప్రయాణించాను|సగం దూరం|பயணம் செய்தேன்|பாதி தூரம்|യാത്ര ചെയ്തു|പകുതി ദൂരം|ಪ್ರಯಾಣಿಸಿದೆ|ಅರ್ಧ ದಾರಿ/i.test(t);
  const travelledNo = /\b(did not travel|didn.?t travel|not travel+ing|decided not to|no longer travel|cancelled my (trip|plan)|did not board|didn.?t board|travel nahi kiya|travel nahi ki|journey nahi ki|journey nahi kiya|safar nahi kiya|nahi travel kiya|nahi gaya)\b|यात्रा नहीं की|ప్రయాణించలేదు|పయనం చేయలేదు|பயணம் செய்யவில்லை|യാത്ര ചെയ്തില്ല|ಪ್ರಯಾಣ ಮಾಡಲಿಲ್ಲ/i.test(t);

  // Distinguish passenger arriving late vs train delay
  const passengerLateAtStation = /\b(station (pe|par)? late|late pahuch|der se pahuch|traffic me(in)?)\b/i.test(t);
  const mentionsTrainDelay = /\b(train (bahut )?late|bahut late|kaafi late|train der se|train was late|train delayed|delay+ed?|behind schedule)\b|लेट|आలస్య|ఆలస్యమైంది|தாமத|தாமதமானது|വൈകി|തಡ/i.test(t) || (!passengerLateAtStation && /\b(der se|late)\b/i.test(t));

  // Missed train or denied boarding
  const boardedNo = /(could not board|couldn.?t board|not able to board|missed the train|denied boarding|was not allowed|train miss ho gayi|train chhut gayi|miss ho gayi|chadh nahi paya|boarding nahi mili|ఎక్కలేకపోయాను|ஏற முடியவில்லை|കയറാൻ കഴിഞ്ഞില്ല|ಹತ್ತಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ)/i.test(t) || (passengerLateAtStation && /\b(miss|chhut|pahuch)\b/i.test(t));
  const boardedYes = /\b(i (boarded|got on|was on board)|managed to board|train me(in)? chadh gaya|train me(in)? chadh gayi|train me(in)? chadh gaye|chadh gaya tha|chadh gayi thi|board kiya)\b|ఎక్కాను|ஏறினேன்|കയറി|ಹತ್ತಿದೆ/i.test(t);

  // Partial journey vs completed
  const partialMatches = /(halfway|part of the route|partway|midway|could not complete|didn.?t complete|not complete|journey.*incomplet|short terminat|terminated early|dropped at|got off at|deboarded en[- ]?route|aadhe raste|beech mein|beech me|aadha rasta|journey complete nahi|poori nahi hui|beech me chhod diya|आधा सफर|बीच में रुक|సగం దూరం|మధ్యలోనే|ఆగిపోయింది|పాதியிலேயே|பாதி தூரம்|പകുതി ദൂരം|ಅರ್ಧ ದಾರಿ|ಮಧ್ಯದಲ್ಲೇ)/i.test(t);
  const completedYes = /\b(completed my (journey|trip)|reached (my )?destination|journey was completed|travelled fully|safar poora|destination pahunch)\b|यात्रा पूरी हो गई|ప్రయాణం పూర్తయింది|பயணம் முடிந்தது|യാത്ര പൂർത്തിയായി|ಪ್ರಯಾಣ ಪೂರ್ಣಗೊಂಡಿತು/i.test(t);
  const completedNo = partialMatches || /\b(could not complete|didn.?t complete|journey.*not complete|incomplete journey|complete nahi ki|complete nahi hui)\b|पूरी नहीं हो सकी|పూర్తి కాలేదు|முழு பயணம் செய்ய முடியவில்லை|പൂർത്തിയാക്കാൻ സാധിച്ചില്ല|ಪೂರ್ಣಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ/i.test(t);

  let delayDuration: IncidentFacts["delayDuration"] = "unsure";
  for (const { re, duration } of delayPatterns) {
    if (re.test(t)) {
      delayDuration = duration;
      break;
    }
  }

  let disruptionMentioned: string | null = null;
  for (const { re, label } of disruptionPhrases) {
    if (re.test(t)) {
      disruptionMentioned = label;
      break;
    }
  }
  if (partialMatches && !disruptionMentioned) {
    disruptionMentioned = "Disrupted midway / partial route";
  }

  const dateM = text.match(dateMatch) || text.match(numericDateMatch);
  const journeyDateMentioned = dateM ? dateM[0] : null;

  // Station and Train Number extraction
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

  const cancelledYes = /\b(cancel+ed? (my|the) (ticket|booking)|ticket (was )?cancel+ed?|filed? (a )?tdr|cancel+ed? before|cancel ho gayi|cancel ho gaya|train cancel|train radd|radd ho gayi)\b/i.test(t);
  const cancelledNo = /\b(did not cancel|didn.?t cancel|no cancellation|cancel nahi kiya|cancel nahi karwaya)\b/i.test(t);

  const passengerBoarded = unknownWhenUnclear(
    boardedNo ? false : (boardedYes || travelledYes || (partialMatches && completedNo)) ? true : undefined,
  );
  const passengerTravelled = unknownWhenUnclear(
    travelledYes ? true : (travelledNo || boardedNo) ? false : (passengerBoarded === true || (partialMatches && completedNo)) ? true : undefined,
  );

  let journeyCompleted: boolean | "unknown" = "unknown";
  let partialJourney: boolean | "unknown" = "unknown";

  if (completedYes && !completedNo) {
    journeyCompleted = true;
    partialJourney = false;
  } else if (completedNo) {
    journeyCompleted = false;
    partialJourney = (passengerTravelled === true || passengerBoarded === true || partialMatches) ? true : "unknown";
  }

  // Classify the incident deterministically
  let incidentType: IncidentFacts["incidentType"];
  if (partialJourney === true || (passengerBoarded === true && completedNo)) {
    incidentType = "partial_journey";
  } else if (boardedNo) {
    incidentType = "could_not_board";
  } else if (cancelledYes && (travelledNo || !boardedYes)) {
    incidentType = "delay_not_travelled";
  } else if (mentionsTrainDelay && (travelledNo || !boardedYes)) {
    incidentType = "delay_not_travelled";
  } else if (travelledYes && completedYes) {
    incidentType = "travelled_completed";
  } else if (travelledYes || (boardedYes && !boardedNo)) {
    incidentType = "travelled_disrupted";
  } else if (disruptionMentioned && boardedNo) {
    incidentType = "could_not_board";
  } else {
    incidentType = "ambiguous";
  }

  const facts: IncidentFacts = {
    incidentType,
    passengerTravelled,
    passengerBoarded,
    journeyCompleted,
    partialJourney,
    delayDuration: mentionsTrainDelay ? delayDuration : "unsure",
    cancelledBeforeDeparture: unknownWhenUnclear(
      cancelledYes ? true : cancelledNo ? false : undefined,
    ),
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

  return {
    facts,
    confidence,
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
  if (facts.incidentType !== "ambiguous" && facts.delayDuration === "unsure")
    missing.push("delayDuration");
  if (
    facts.passengerTravelled === false &&
    facts.cancelledBeforeDeparture === "unknown"
  )
    missing.push("cancelledBeforeDeparture");
  if (
    (facts.incidentType === "travelled_disrupted" ||
      facts.incidentType === "partial_journey" ||
      facts.incidentType === "could_not_board") &&
    !facts.disruptionMentioned
  )
    missing.push("disruptionType");
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
      return "It sounds like you were unable to complete your journey as planned.";
    case "partial_journey":
      return "It sounds like you boarded the train, but your journey was disrupted before reaching your destination.";
    case "travelled_completed":
      return "It sounds like you completed your journey to your destination, but faced disruption along the way.";
    case "travelled_disrupted":
      return "It sounds like you travelled but the journey did not go as planned.";
    default:
      return "We understood part of your description, but a few details are unclear.";
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

  const mentionsDelay = /\b(delay+ed?|late|behind schedule|held up|waiting|der se)\b|लेट|आలస్య|ఆలస్యమైంది|தாமத|தாமதமானது|വൈകി|തಡ/i.test(t);
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

  const partialMatches = /(halfway|part of the route|partway|midway|could not complete|didn.?t complete|not complete|journey.*incomplet|short terminat|terminated early|dropped at|got off at|deboarded en[- ]?route|aadhe raste|beech raste|aadha rasta|journey complete nahi|poori nahi hui|beech me chhod diya|आधा सफर|बीच में रुक|సగం దూరం|మధ్యలోనే|పాதியிலேயே|பாதி தூரம்|പകുതി ദൂരം|അರ್ಧ ದಾರಿ|ಮಧ್ಯದಲ್ಲೇ)/i.test(t);
  if (partialMatches) {
    chips.push({ label: "Partial journey (disrupted midway)", tone: "green" });
  }

  for (const { re, label } of disruptionPhrases) {
    if (re.test(t)) {
      chips.push({ label, tone: "green" });
      break;
    }
  }

  const travelledYes = /\b(i (travel+ed|did travel|took the train|boarded)|my journey (was|is) (completed)|completed my (journey|trip)|safarn? poora|part of the route)\b|सफर तय किया|ప్రయాణించాను|సగం దూరం|பயணம் செய்தேன்|பாதி தூரம்|യാത്ര ചെയ്തു|പകുതി ദൂരം|ಪ್ರಯಾಣಿಸಿದೆ|ಅರ್ಧ ದಾರಿ/i.test(t);
  const travelledNo = /\b(did not travel|didn.?t travel|not travel+ing|decided not to|no longer travel|cancelled my (trip|plan)|did not board|didn.?t board|safar nahi kiya)\b|यात्रा नहीं की|ప్రయాణించలేదు|பயணம் செய்யவில்லை|യാത്ര ചെയ്തില്ല|ಪ್ರಯಾಣ ಮಾಡಲಿಲ್ಲ/i.test(t);
  
  if (travelledYes) chips.push({ label: "Travelled", tone: "green" });
  else if (travelledNo) chips.push({ label: "Did not travel", tone: "green" });

  const boardedNo = /(could not board|couldn.?t board|not able to board|missed the train|denied boarding|was not allowed|chadh nahi paya|ఎక్కలేకపోయాను|ஏற முடியவில்லை|കയറാൻ കഴിഞ്ഞില്ല|ಹತ್ತಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ)/i.test(t);
  const boardedYes = /\b(i (boarded|got on|was on board)|managed to board|train me(in)? chadh|chadh gaya|chadh gaye|board kiya)\b|ఎక్కాను|ஏறினேன்|കയറി|ಹತ್ತಿದೆ/i.test(t);
  
  if (boardedNo && !chips.some(c => c.label === "Could not board")) chips.push({ label: "Could not board", tone: "green" });
  else if (boardedYes && !chips.some(c => c.label === "Boarded")) chips.push({ label: "Boarded train", tone: "green" });

  const dateM = text.match(dateMatch);
  if (dateM) chips.push({ label: dateM[0], tone: "green" });

  return chips;
}
