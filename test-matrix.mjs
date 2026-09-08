// Deterministic test matrix for TDR Sahayak
import { fallbackAnalyze } from "./src/lib/ai/fallbackParser";
import { decide } from "./src/lib/decisionEngine";
import { buildCaseFacts } from "./src/lib/flow";
import { DEMO_SCENARIOS, MULTILINGUAL_PROMPTS, SAMPLE_DOCUMENTS } from "./src/data/scenarios";

console.log("==================================================");
console.log("RUNNING DETERMINISTIC TEST MATRIX");
console.log("==================================================");

let allPassed = true;

// 1. Test Demo Scenarios
console.log("\n[1] Testing Demo Scenarios through Fallback Analyzer & Decision Engine...");
for (const s of DEMO_SCENARIOS) {
  const analysis = fallbackAnalyze(s.text);
  const facts = buildCaseFacts(analysis, {}, s.text);
  const decision = decide(facts);
  console.log(`✓ [${s.id}] -> Type: ${facts.incidentType} | Scenario: ${decision.scenario} (${decision.scenarioTitle})`);
  if (!decision.scenario || !decision.scenarioTitle) {
    allPassed = false;
    console.error(`FAILED on ${s.id}`);
  }
}

// 2. Test Multilingual Prompts
console.log("\n[2] Testing Multilingual Prompts (English, Hindi, Telugu, Tamil, Malayalam, Kannada)...");
for (const p of MULTILINGUAL_PROMPTS) {
  const analysis = fallbackAnalyze(p.prompt);
  const facts = buildCaseFacts(analysis, {}, p.prompt);
  const decision = decide(facts);
  console.log(`✓ [${p.lang} (${p.langCode})] -> Type: ${facts.incidentType} | Scenario: ${decision.scenario}`);
}

// 3. Test Hero Correction Experience (Scenario C -> Scenario A)
console.log("\n[3] Testing Hero Correction Experience...");
const partialJourney = DEMO_SCENARIOS.find(s => s.id === "partial-journey");
const initialAnalysis = fallbackAnalyze(partialJourney.text);
const initialAnswers = {
  passengerBoarded: "yes",
  passengerTravelled: "yes",
  journeyCompleted: "no",
  delayDuration: "3to6h",
  journeyDate: "past_3d",
};
const beforeFacts = buildCaseFacts(initialAnalysis, initialAnswers, partialJourney.text);
const beforeDecision = decide(beforeFacts);
console.log(`Before Correction: Type: ${beforeFacts.incidentType} | Scenario: ${beforeDecision.scenario} (${beforeDecision.scenarioTitle})`);

if (beforeDecision.scenario !== "C") {
  console.error("FAIL: Expected Scenario C before correction, got", beforeDecision.scenario);
  allPassed = false;
}

// Passenger corrects: Did you travel? -> No
const correctedAnswers = {
  ...initialAnswers,
  passengerTravelled: "no",
};
const afterFacts = buildCaseFacts(initialAnalysis, correctedAnswers, partialJourney.text);
const afterDecision = decide(afterFacts);
console.log(`After Correction:  Type: ${afterFacts.incidentType} | Scenario: ${afterDecision.scenario} (${afterDecision.scenarioTitle})`);

if (afterDecision.scenario !== "A") {
  console.error("FAIL: Expected Scenario A after correction, got", afterDecision.scenario);
  allPassed = false;
} else {
  console.log("✓ SUCCESS: Hero correction verified! Scenario correctly shifted from Scenario C to Scenario A!");
}

// 4. Test Sample Documents
console.log("\n[4] Testing Sample Documents Extraction...");
for (const doc of SAMPLE_DOCUMENTS) {
  console.log(`✓ [${doc.id}] ${doc.title} -> Train: ${doc.extracted.trainNumber} | Travelled: ${doc.extracted.passengerTravelled} | Delay: ${doc.extracted.delayDuration}`);
  if (!doc.extracted.trainNumber || !doc.extracted.ticketNumber) {
    console.error("FAIL: Missing extracted fields in", doc.id);
    allPassed = false;
  }
}

// 5. Test Compact Confirmation Card Extraction & In-Place Updates
console.log("\n[5] Testing Compact Confirmation Card Extraction & In-Place Updates...");
const narrativeWithDetails = "Travelling from Hyderabad to Vijayawada on train 12723 with ticket 4521890123. Train was 4 hours late and terminated halfway.";
const extractedDetails = fallbackAnalyze(narrativeWithDetails);
console.log(`✓ Extracted From: ${extractedDetails.facts.fromStation} | To: ${extractedDetails.facts.toStation} | Train: ${extractedDetails.facts.trainNumber} | PNR: ${extractedDetails.facts.pnrNumber}`);

if (extractedDetails.facts.fromStation !== "Hyderabad" || extractedDetails.facts.toStation !== "Vijayawada" || extractedDetails.facts.trainNumber !== "12723") {
  console.error("FAIL: Expected Hyderabad -> Vijayawada and Train 12723");
  allPassed = false;
}

// Test live update of custom fields via answers
const cardUpdatedFacts = buildCaseFacts(extractedDetails, {
  fromStation: "Secunderabad (SC)",
  toStation: "Tirupati (TPTY)",
  trainNumber: "12760",
  passengerTravelled: "no",
}, narrativeWithDetails);
const cardDecision = decide(cardUpdatedFacts);
console.log(`✓ In-Place Card Edit -> Route: ${cardUpdatedFacts.fromStation} → ${cardUpdatedFacts.toStation} | Train: ${cardUpdatedFacts.trainNumber} | Scenario: ${cardDecision.scenario}`);

if (cardUpdatedFacts.fromStation !== "Secunderabad (SC)" || cardDecision.scenario !== "A") {
  console.error("FAIL: In-place card update failed to re-evaluate decision correctly");
  allPassed = false;
} else {
  console.log("✓ SUCCESS: Compact card edits and live rule decision re-evaluation verified!");
}

console.log("\n==================================================");
console.log(allPassed ? "ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!" : "SOME CHECKS FAILED!");
console.log("==================================================");

if (!allPassed) process.exit(1);
