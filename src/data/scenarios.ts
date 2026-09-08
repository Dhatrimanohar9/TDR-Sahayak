import type { DemoScenario, FollowUpQuestion, MissingFactKey, MultilingualPrompt, SampleDocument } from "../types";

/** Synthetic demo scenarios for the "Try a sample scenario" shortcut. */
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "delay-not-travelled",
    shortLabel: "Train delayed and I did not travel",
    text: "My train was delayed for several hours. I decided not to travel because I would miss an important event.",
  },
  {
    id: "could-not-board",
    shortLabel: "I could not board the train",
    text: "I reached the station on time but could not board the train because of a serious disruption on the platform.",
  },
  {
    id: "travelled-disrupted",
    shortLabel: "My journey was disrupted",
    text: "I travelled, but my journey was disrupted midway and the train was terminated early. I am confused about what I can do now.",
  },
  {
    id: "partial-journey",
    shortLabel: "Boarded but disrupted halfway",
    text: "I boarded the train but the journey got disrupted halfway.",
  },
  {
    id: "hinglish-partial-journey",
    shortLabel: "Train mein chadh gaya tha, aadhe raste me ruka",
    text: "Main train mein chadh gaya tha, lekin aadhe raste mein journey complete nahi hui.",
  },
  {
    id: "partial-route-incomplete",
    shortLabel: "Travelled part of route, could not complete",
    text: "I travelled part of the route but could not complete the journey.",
  },
  {
    id: "refund-confusion",
    shortLabel: "I need help understanding a refund situation",
    text: "I am not sure which refund option applies to my situation. My trip did not go as planned and I still have my ticket.",
  },
  {
    id: "ambiguous-situation",
    shortLabel: "I'm confused about my situation",
    text: "Something went wrong with my trip. I'm not sure what to do about it. I still have my ticket.",
  },
];

/**
 * Follow-up question bank. The AI layer picks the next question based on
 * which facts are still missing, so citizens only answer what matters.
 */
export const FOLLOW_UP_QUESTIONS: Record<MissingFactKey, FollowUpQuestion> = {
  passengerTravelled: {
    id: "passengerTravelled",
    prompt: "Did you travel on this ticket?",
    options: [
      { value: "yes", label: "Yes, I travelled" },
      { value: "no", label: "No, I did not travel" },
    ],
  },
  passengerBoarded: {
    id: "passengerBoarded",
    prompt: "Were you able to board the train?",
    options: [
      { value: "yes", label: "Yes, I boarded" },
      { value: "no", label: "No, I could not board" },
    ],
  },
  journeyCompleted: {
    id: "journeyCompleted",
    prompt: "Did you complete the entire journey to your destination?",
    options: [
      { value: "yes", label: "Yes, I completed the journey" },
      { value: "no", label: "No, journey was disrupted / ended halfway" },
    ],
  },
  delayDuration: {
    id: "delayDuration",
    prompt: "Approximately how long was the train delayed?",
    options: [
      { value: "lt3h", label: "Less than 3 hours" },
      { value: "3to6h", label: "3–6 hours" },
      { value: "gt6h", label: "More than 6 hours" },
      { value: "unsure", label: "I’m not sure" },
    ],
  },
  cancelledBeforeDeparture: {
    id: "cancelledBeforeDeparture",
    prompt: "Did you cancel the ticket before the train departed?",
    options: [
      { value: "yes", label: "Yes, I cancelled before departure" },
      { value: "no", label: "No, I did not cancel" },
      { value: "unsure", label: "I don’t remember" },
    ],
  },
  disruptionType: {
    id: "disruptionType",
    prompt: "What kind of disruption best describes what happened?",
    options: [
      { value: "train_cancelled", label: "The train was cancelled" },
      { value: "terminated_early", label: "The train terminated early / I was diverted" },
      { value: "missed_connection", label: "I missed a connecting journey" },
      { value: "other", label: "Something else" },
    ],
  },
  journeyDate: {
    id: "journeyDate",
    prompt: "When was this journey scheduled?",
    options: [
      { value: "past_3d", label: "Within the last 3 days" },
      { value: "past_week", label: "4–10 days ago" },
      { value: "past_month", label: "More than 10 days ago" },
      { value: "upcoming", label: "The journey is still upcoming" },
    ],
  },
};

/** Label lookups used when displaying collected facts back to the citizen. */
export const DELAY_LABELS: Record<string, string> = {
  lt3h: "Less than 3 hours",
  "3to6h": "3–6 hours",
  gt6h: "More than 6 hours",
  unsure: "Not confirmed",
};

export const DISRUPTION_LABELS: Record<string, string> = {
  train_cancelled: "Train cancelled",
  terminated_early: "Train terminated early or diverted",
  missed_connection: "Missed a connecting journey",
  other: "Other disruption",
};

/** Multilingual prompt examples for testing and demonstration. */
export const MULTILINGUAL_PROMPTS: MultilingualPrompt[] = [
  {
    lang: "English",
    langCode: "en",
    label: "English (Partial journey)",
    prompt:
      "My train was delayed. I travelled part of the route, but I could not complete my journey.",
  },
  {
    lang: "हिन्दी",
    langCode: "hi",
    label: "Hindi / हिन्दी",
    prompt:
      "मेरी ट्रेन 4 घंटे लेट थी। मैंने आधा सफर तय किया, लेकिन यात्रा पूरी नहीं हो सकी और ट्रेन बीच में रुक गई।",
  },
  {
    lang: "తెలుగు",
    langCode: "te",
    label: "Telugu / తెలుగు",
    prompt:
      "నా రైలు 4 గంటలకు పైగా ఆలస్యమైంది. నేను సగం దూరం ప్రయాణించాను, కానీ మధ్యలోనే ప్రయాణం ఆగిపోయింది.",
  },
  {
    lang: "தமிழ்",
    langCode: "ta",
    label: "Tamil / தமிழ்",
    prompt:
      "என் ரயில் பல மணி நேரம் தாமதமானது. நான் பாதி தூரம் பயணம் செய்தேன், ஆனால் பயணம் பாதியிலேயே நின்றது.",
  },
  {
    lang: "മലയാളം",
    langCode: "ml",
    label: "Malayalam / മലയാളം",
    prompt:
      "എന്റെ ട്രെയിൻ 4 മണിക്കൂറിലധികം വൈകി. ഞാൻ പകുതി ദൂരം യാത്ര ചെയ്തു, പക്ഷെ യാത്ര പൂർത്തിയാക്കാൻ സാധിച്ചില്ല.",
  },
  {
    lang: "ಕನ್ನಡ",
    langCode: "kn",
    label: "Kannada / ಕನ್ನಡ",
    prompt:
      "ನನ್ನ ರೈಲು 4 ಗಂಟೆಗಳಿಗೂ ಹೆಚ್ಚು ತಡವಾಯಿತು. ನಾನು ಅರ್ಧ ದಾರಿ ಪ್ರಯಾಣಿಸಿದೆ, ಆದರೆ ಪ್ರಯಾಣ ಮಧ್ಯದಲ್ಲೇ ಸ್ಥಗಿತಗೊಂಡಿತು.",
  },
];

/** Built-in realistic sample documents for testing the document upload pipeline without an API key or local files. */
export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: "partial-journey-eticket",
    title: "IRCTC E-Ticket (Partial Journey)",
    subtitle: "12723 Telangana Exp · HYB → BZA · Deboarded at Kazipet",
    type: "ticket",
    fileName: "irctc_eticket_12723_partial.png",
    extracted: {
      trainNumber: "12723 (Telangana Express)",
      journeyDate: "2026-09-05",
      fromStation: "HYB (Hyderabad Deccan)",
      toStation: "BZA (Vijayawada Jn)",
      ticketNumber: "PNR 4521-892140",
      passengerTravelled: true,
      journeyCompleted: false,
      delayDuration: "3to6h",
      disruptionType: "terminated_early",
      narrativeSummary:
        "Boarded 12723 at Hyderabad. Train was delayed over 3 hours and terminated early at Kazipet; unable to complete journey to Vijayawada.",
    },
  },
  {
    id: "delayed-train-counter",
    title: "Counter Ticket (Delayed 6h+ · Did Not Travel)",
    subtitle: "12952 Rajdhani Exp · NDLS → MMCT · Not Travelled",
    type: "ticket",
    fileName: "railway_counter_ticket_12952.png",
    extracted: {
      trainNumber: "12952 (Rajdhani Express)",
      journeyDate: "2026-09-06",
      fromStation: "NDLS (New Delhi)",
      toStation: "MMCT (Mumbai Central)",
      ticketNumber: "UTS 2981-401928",
      passengerTravelled: false,
      journeyCompleted: false,
      delayDuration: "gt6h",
      disruptionType: "other",
      narrativeSummary:
        "Train 12952 from New Delhi was running more than 6 hours late. Decided not to travel as purpose of trip was lost; ticket left untravelled.",
    },
  },
  {
    id: "station-deboard-slip",
    title: "Station TDR / Deboarding Slip",
    subtitle: "Kazipet Junction TTE Deboarding Memo",
    type: "certificate",
    fileName: "station_deboard_cert_kazipet.png",
    extracted: {
      trainNumber: "12723 (Telangana Express)",
      journeyDate: "2026-09-05",
      fromStation: "KZJ (Kazipet Jn)",
      toStation: "BZA (Vijayawada Jn)",
      ticketNumber: "EFT CERT-88219",
      passengerTravelled: true,
      journeyCompleted: false,
      delayDuration: "3to6h",
      disruptionType: "terminated_early",
      narrativeSummary:
        "Station Master issued Excess Fare Ticket (EFT) certificate acknowledging train terminated short of destination at Kazipet. Claiming refund for untravelled route.",
    },
  },
];
