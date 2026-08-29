import type { DemoScenario, FollowUpQuestion, MissingFactKey } from "../types";

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
    id: "refund-confusion",
    shortLabel: "I need help understanding a refund situation",
    text: "I am not sure which refund option applies to my situation. My trip did not go as planned and I still have my ticket.",
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
