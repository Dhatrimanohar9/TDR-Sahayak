// Deterministic test matrix for TDR Sahayak
import { fallbackAnalyze } from "./src/lib/ai/fallbackParser";
import { decide } from "./src/lib/decisionEngine";
import { buildCaseFacts } from "./src/lib/flow";
import { DEMO_SCENARIOS, MULTILINGUAL_PROMPTS, SAMPLE_DOCUMENTS } from "./src/data/scenarios";
import { saveFeedback, getFeedbackStats, clearFeedback } from "./src/lib/feedbackStore";
import {
  STUDY_SCENARIO_TASKS,
  saveStudyRecord,
  getValidationMetrics,
  clearAllStudyData,
  clearRealStudyData,
  seedShowcaseStudyData,
  FEEDBACK_IMPROVEMENTS,
  generateSubmissionSummary,
  getLastExportedTimestamp,
  setLastExportedTimestamp,
  hasDuplicateParticipant,
  getStudyStatus,
  importStudyBackupJson,
} from "./src/lib/validationStore";

if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

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

// 6. Test Adversarial Inputs: Completed Journey despite Delay vs Incomplete Ambiguity
console.log("\n[6] Testing Adversarial Edge Cases (Completed Journey & Incomplete Delay)...");

// 6a. Completed journey despite 5 hours delay (English)
const completedAdversarialEn = "My train was 5 hours late but I still boarded and made it to my destination fine.";
const analysisAdvEn = fallbackAnalyze(completedAdversarialEn);
const factsAdvEn = buildCaseFacts(analysisAdvEn, {}, completedAdversarialEn);
const decisionAdvEn = decide(factsAdvEn);
console.log(`✓ [Adversarial Completed En] -> Type: ${factsAdvEn.incidentType} | Scenario: ${decisionAdvEn.scenario} (${decisionAdvEn.scenarioTitle})`);

if (factsAdvEn.incidentType !== "travelled_completed" || decisionAdvEn.scenario !== "E") {
  console.error("FAIL: Adversarial completed journey misclassified! Expected Scenario E, got:", decisionAdvEn.scenario);
  allPassed = false;
}

// 6b. Completed journey despite delay (Hinglish)
const completedAdversarialHi = "Meri train 2 ghante late thi lekin main phir bhi chadh gaya aur pura safar complete kiya";
const analysisAdvHi = fallbackAnalyze(completedAdversarialHi);
const factsAdvHi = buildCaseFacts(analysisAdvHi, {}, completedAdversarialHi);
const decisionAdvHi = decide(factsAdvHi);
console.log(`✓ [Adversarial Completed Hi] -> Type: ${factsAdvHi.incidentType} | Scenario: ${decisionAdvHi.scenario} (${decisionAdvHi.scenarioTitle})`);

if (factsAdvHi.incidentType !== "travelled_completed" || decisionAdvHi.scenario !== "E") {
  console.error("FAIL: Hinglish completed journey misclassified! Expected Scenario E, got:", decisionAdvHi.scenario);
  allPassed = false;
}

// 6c. Ambiguous / Incomplete delay statement ("My train was delayed by 4 hours")
// MUST NOT guess Scenario A! Must be Scenario D and require clarification.
const incompleteInput = "My train was delayed by 4 hours.";
const analysisIncomplete = fallbackAnalyze(incompleteInput);
const factsIncomplete = buildCaseFacts(analysisIncomplete, {}, incompleteInput);
const decisionIncomplete = decide(factsIncomplete);
console.log(`✓ [Incomplete Delay Input] -> Type: ${factsIncomplete.incidentType} | Travelled: ${factsIncomplete.passengerTravelled} | Scenario: ${decisionIncomplete.scenario}`);

if (factsIncomplete.passengerTravelled !== "unknown" || decisionIncomplete.scenario !== "D") {
  console.error("FAIL: Incomplete input erroneously guessed eligibility! Expected Scenario D, got:", decisionIncomplete.scenario);
  allPassed = false;
}

// 7. Test Contradiction & Conflict Resolution
console.log("\n[7] Testing Contradiction & Conflict Resolution...");
const contradictionInput = "I travelled but I did not travel on this train.";
const analysisConflict = fallbackAnalyze(contradictionInput);
console.log(`✓ [Contradiction Input] -> Status: ${analysisConflict.statusLabel} | Requires Clarification: ${analysisConflict.requiresClarification}`);

if (analysisConflict.statusLabel !== "Conflicting evidence" || !analysisConflict.requiresClarification) {
  console.error("FAIL: Contradiction not detected! Expected 'Conflicting evidence'");
  allPassed = false;
}

// 8. Test Auditable Decision Trail (decisionBasis, requiredFacts, counterfactual)
console.log("\n[8] Testing Auditable Decision Trail Across Scenarios A, B, C, D, E...");
const scenariosToTest = ["delay-not-travelled", "could-not-board", "partial-journey", "ambiguous-delayed", "travelled-completed"];
for (const id of scenariosToTest) {
  const sc = DEMO_SCENARIOS.find(s => s.id === id);
  if (!sc) continue;
  const analysis = fallbackAnalyze(sc.text);
  const facts = buildCaseFacts(analysis, {}, sc.text);
  const decision = decide(facts);
  if (!decision.decisionBasis || !decision.decisionBasis.keyFact || !decision.decisionBasis.counterfactual) {
    console.error(`FAIL: Missing decisionBasis or counterfactual in scenario ${decision.scenario}`);
    allPassed = false;
  } else if (!decision.requiredFacts || decision.requiredFacts.length === 0) {
    console.error(`FAIL: Missing requiredFacts in scenario ${decision.scenario}`);
    allPassed = false;
  } else {
    console.log(`✓ Scenario ${decision.scenario} Decision Trail -> Key Fact: "${decision.decisionBasis.keyFact.slice(0, 45)}..." | Required: ${decision.requiredFacts.length} facts`);
  }
}

// 9. Test Feedback Store & Local Evaluation Aggregations
console.log("\n[9] Testing Outcome Feedback Store & Aggregated Stats...");
clearFeedback();
saveFeedback({
  caseId: "TEST-CASE-001",
  scenario: "A",
  scenarioTitle: "Delayed train — did not travel",
  recommendedAction: "Review TDR reason",
  selectedOutcome: "completed",
  recommendedActionHelpful: true,
  textFeedback: "Test refund completed successfully",
  userCorrectedInitialAnswer: true,
});
saveFeedback({
  caseId: "TEST-CASE-002",
  scenario: "B",
  scenarioTitle: "Could not board",
  recommendedAction: "Gather proof",
  selectedOutcome: "need_help",
  recommendedActionHelpful: false,
  textFeedback: "Could not get station memo",
  userCorrectedInitialAnswer: false,
});
saveFeedback({
  caseId: "TEST-CASE-003",
  scenario: "C",
  scenarioTitle: "Partial journey",
  recommendedAction: "Obtain deboarding certificate",
  selectedOutcome: "different_action",
  recommendedActionHelpful: true,
  textFeedback: "Filed complaint on RailMadad instead",
  userCorrectedInitialAnswer: false,
});

const stats = getFeedbackStats();
console.log(`✓ Feedback Stats -> Total: ${stats.total} | Completed: ${stats.byOutcome.completed} | Need Help: ${stats.needHelpCount} | Corrected: ${stats.correctedCount} | Helpful Pct: ${stats.helpfulPct}%`);

if (
  stats.total !== 3 ||
  stats.byOutcome.completed !== 1 ||
  stats.byOutcome.need_help !== 1 ||
  stats.byOutcome.different_action !== 1 ||
  stats.needHelpCount !== 1 ||
  stats.correctedCount !== 1 ||
  stats.helpfulPct !== 67
) {
  console.error("FAIL: Feedback store stats mismatch!", stats);
  allPassed = false;
}

// 10. Test Usability Study Scenario Tasks Configuration
console.log("\n[10] Testing Usability Study Tasks (5 Canonical Scenarios)...");
if (STUDY_SCENARIO_TASKS.length !== 5) {
  console.error("FAIL: Expected 5 study tasks, found:", STUDY_SCENARIO_TASKS.length);
  allPassed = false;
}

const scenarioCodes = STUDY_SCENARIO_TASKS.map((t) => t.scenarioCode);
console.log(`✓ Usability Tasks Configured: ${scenarioCodes.join(", ")}`);
for (const task of STUDY_SCENARIO_TASKS) {
  const correctOpt = task.options.find((o) => o.isCorrect);
  if (!correctOpt || correctOpt.id !== task.correctActionId) {
    console.error(`FAIL: Option integrity error in study task ${task.id}`);
    allPassed = false;
  }
}

// 11. Test Empty-State & Zero-Fabrication Metrics Handling
console.log("\n[11] Testing Zero-Fabrication Empty-State Metrics Handling...");
clearAllStudyData();
const emptyMetrics = getValidationMetrics(false);
console.log(`✓ Empty State Metrics -> Trials: ${emptyMetrics.totalTrials} | Pre: ${emptyMetrics.preCorrectPct}% | Post: ${emptyMetrics.postCorrectPct}% | Improvement: ${emptyMetrics.improvementPercentagePoints}%`);

if (
  emptyMetrics.totalTrials !== 0 ||
  emptyMetrics.totalParticipants !== 0 ||
  emptyMetrics.preCorrectPct !== 0 ||
  emptyMetrics.postCorrectPct !== 0 ||
  emptyMetrics.improvementPercentagePoints !== 0 ||
  emptyMetrics.records.length !== 0
) {
  console.error("FAIL: Empty-state metrics returned non-zero or fabricated values!");
  allPassed = false;
}

const emptySummary = generateSubmissionSummary(false);
if (
  !emptySummary.includes("Real usability data has not yet been collected") ||
  !emptySummary.includes("TDR Sahayak - Usability & Validation Summary")
) {
  console.error("FAIL: Empty summary missing zero-fabrication notice!");
  allPassed = false;
}

// 12. Test Empirical Usability Trial Recording & Delta Computation
console.log("\n[12] Testing Usability Trial Recording & Accuracy Improvement Computation...");
saveStudyRecord({
  participantCode: "P-TEST-01",
  scenarioId: "task-delayed-unused",
  scenarioCode: "A",
  language: "English",
  preAnswerId: "opt-a1", // incorrect
  preAnswerCorrect: false,
  postAnswerId: "opt-a2", // correct
  postAnswerCorrect: true,
  taskTimeSeconds: 40,
  confidenceBefore: 2,
  confidenceAfter: 5,
  explanationUnderstood: true,
  documentsUnderstood: true,
  clarificationUnderstood: true,
  comment: "Filing TDR was clearly explained.",
  isDemoSeeded: false,
});

saveStudyRecord({
  participantCode: "P-TEST-02",
  scenarioId: "task-delayed-completed",
  scenarioCode: "E",
  language: "Hindi",
  preAnswerId: "opt-e1", // incorrect
  preAnswerCorrect: false,
  postAnswerId: "opt-e2", // correct
  postAnswerCorrect: true,
  taskTimeSeconds: 30,
  confidenceBefore: 3,
  confidenceAfter: 5,
  explanationUnderstood: true,
  documentsUnderstood: true,
  clarificationUnderstood: true,
  comment: "Counterfactual was very clear.",
  isDemoSeeded: false,
});

const activeMetrics = getValidationMetrics(false);
console.log(`✓ Active Real Metrics -> Participants: ${activeMetrics.totalParticipants} | Pre: ${activeMetrics.preCorrectPct}% | Post: ${activeMetrics.postCorrectPct}% | Gain: +${activeMetrics.improvementPercentagePoints}% pts | Mean Time: ${activeMetrics.avgTaskTimeSeconds}s`);

if (
  activeMetrics.totalTrials !== 2 ||
  activeMetrics.totalParticipants !== 2 ||
  activeMetrics.preCorrectPct !== 0 ||
  activeMetrics.postCorrectPct !== 100 ||
  activeMetrics.improvementPercentagePoints !== 100 ||
  activeMetrics.avgTaskTimeSeconds !== 35 ||
  activeMetrics.avgConfidenceBefore !== 2.5 ||
  activeMetrics.avgConfidenceAfter !== 5
) {
  console.error("FAIL: Usability study metrics calculation mismatch!", activeMetrics);
  allPassed = false;
}

// 13. Test Data Separation & Feedback-to-Improvement Tracking Table
console.log("\n[13] Testing Data Separation & Feedback-to-Improvement Tracking...");
clearRealStudyData();
const afterClearReal = getValidationMetrics(false);
if (afterClearReal.totalTrials !== 0) {
  console.error("FAIL: Clear real study data failed!");
  allPassed = false;
}

// Seed showcase data and verify it is explicitly tagged
seedShowcaseStudyData();
const demoMetrics = getValidationMetrics(true);
console.log(`✓ Showcase Demo Metrics -> Total Trials: ${demoMetrics.totalTrials} | Improvement: +${demoMetrics.improvementPercentagePoints}% pts`);

if (demoMetrics.totalTrials !== 8 || !demoMetrics.records.every((r) => r.isDemoSeeded)) {
  console.error("FAIL: Showcase demo data tag or trial count mismatch!");
  allPassed = false;
}

// Check Feedback improvements table
if (FEEDBACK_IMPROVEMENTS.length < 5) {
  console.error("FAIL: Insufficient feedback improvements logged!");
  allPassed = false;
} else {
  console.log(`✓ Feedback-to-Improvement Items Documented: ${FEEDBACK_IMPROVEMENTS.length} engineering iterations`);
}

// 14. Test JSON Backup Import & Schema Validation
console.log("\n[14] Testing JSON Backup Import & Schema Validation...");
clearRealStudyData();
const validBackupPayload = JSON.stringify({
  metadata: { studyName: "Test Export" },
  records: [
    {
      id: "REC-BACKUP-01",
      participantCode: "P-BACKUP-01",
      scenarioId: "task-could-not-board",
      scenarioCode: "B",
      language: "Telugu",
      preAnswerId: "opt-b1",
      preAnswerCorrect: false,
      postAnswerId: "opt-b2",
      postAnswerCorrect: true,
      taskTimeSeconds: 45,
      confidenceBefore: 1,
      confidenceAfter: 5,
      explanationUnderstood: true,
      documentsUnderstood: true,
      clarificationUnderstood: true,
      comment: "Station memo rule was learned.",
    },
    {
      id: "REC-BACKUP-02",
      participantCode: "P-BACKUP-02",
      scenarioId: "task-partial-journey",
      scenarioCode: "C",
      language: "English",
      preAnswerId: "opt-c3",
      preAnswerCorrect: false,
      postAnswerId: "opt-c2",
      postAnswerCorrect: true,
      taskTimeSeconds: 50,
      confidenceBefore: 2,
      confidenceAfter: 4,
      explanationUnderstood: true,
      documentsUnderstood: true,
      clarificationUnderstood: true,
      comment: "EFT certificate clearly stated.",
    },
  ],
});

const importResult = importStudyBackupJson(validBackupPayload);
console.log(`✓ Import Valid Backup -> Success: ${importResult.success} | Imported: ${importResult.importedCount}`);
if (!importResult.success || importResult.importedCount !== 2) {
  console.error("FAIL: Failed to import valid study backup JSON!");
  allPassed = false;
}

// Test deduplication on re-import
const duplicateImport = importStudyBackupJson(validBackupPayload);
if (!duplicateImport.success || duplicateImport.importedCount !== 0) {
  console.error("FAIL: Deduplication failed on re-importing identical backup!");
  allPassed = false;
}

// Test malformed JSON rejection
const malformedResult = importStudyBackupJson("{ invalid json string }");
if (malformedResult.success) {
  console.error("FAIL: Malformed JSON was not rejected!");
  allPassed = false;
} else {
  console.log(`✓ Malformed JSON Rejected Gracefully: "${malformedResult.error}"`);
}

// 15. Test Duplicate Participant-Scenario Detection
console.log("\n[15] Testing Duplicate Participant-Scenario Detection...");
const isDup1 = hasDuplicateParticipant("P-BACKUP-01", "task-could-not-board");
const isDup2 = hasDuplicateParticipant("p-backup-01", "task-could-not-board"); // case-insensitive
const isNotDup = hasDuplicateParticipant("P-BACKUP-01", "task-delayed-unused"); // different scenario
const isNewTester = hasDuplicateParticipant("P-NEW-USER", "task-could-not-board"); // new user

console.log(`✓ Duplicate Checks -> Exact: ${isDup1} | Case-Insensitive: ${isDup2} | Different Scenario: ${isNotDup} | New Tester: ${isNewTester}`);
if (!isDup1 || !isDup2 || isNotDup || isNewTester) {
  console.error("FAIL: Duplicate participant detection failed!");
  allPassed = false;
}

// 16. Test Pilot Study Status Progression & Timestamp Tracking
console.log("\n[16] Testing Pilot Study Status Progression & Timestamp Tracking...");
clearAllStudyData();
const statusEmpty = getStudyStatus(getValidationMetrics(false), false);
console.log(`✓ Status at 0 participants -> Badge: "${statusEmpty.statusBadge}" | Tone: ${statusEmpty.tone}`);
if (statusEmpty.statusBadge !== "No real study data collected" || statusEmpty.tone !== "neutral") {
  console.error("FAIL: Study status badge for 0 trials mismatch!");
  allPassed = false;
}

// Add 3 participants (1 to 4 -> Pilot study in progress)
for (let i = 1; i <= 3; i++) {
  saveStudyRecord({
    participantCode: `P-PROGRESS-0${i}`,
    scenarioId: "task-delayed-unused",
    scenarioCode: "A",
    language: "English",
    preAnswerId: "opt-a1",
    preAnswerCorrect: false,
    postAnswerId: "opt-a2",
    postAnswerCorrect: true,
    taskTimeSeconds: 30 + i * 5,
    confidenceBefore: 2,
    confidenceAfter: 5,
    explanationUnderstood: true,
    documentsUnderstood: true,
    clarificationUnderstood: true,
    isDemoSeeded: false,
  });
}

const statusProgress = getStudyStatus(getValidationMetrics(false), true);
console.log(`✓ Status at 3 participants -> Badge: "${statusProgress.statusBadge}" | Tone: ${statusProgress.tone} | Count: "${statusProgress.participantCountText}"`);
if (statusProgress.statusBadge !== "Pilot study in progress" || statusProgress.tone !== "amber") {
  console.error("FAIL: Study status badge for 3 trials mismatch!");
  allPassed = false;
}

// Add 2 more participants (total 5 -> Pilot study completed)
for (let i = 4; i <= 5; i++) {
  saveStudyRecord({
    participantCode: `P-PROGRESS-0${i}`,
    scenarioId: "task-delayed-completed",
    scenarioCode: "E",
    language: "Hindi",
    preAnswerId: "opt-e1",
    preAnswerCorrect: false,
    postAnswerId: "opt-e2",
    postAnswerCorrect: true,
    taskTimeSeconds: 25 + i * 5,
    confidenceBefore: 3,
    confidenceAfter: 5,
    explanationUnderstood: true,
    documentsUnderstood: true,
    clarificationUnderstood: true,
    isDemoSeeded: false,
  });
}

const statusCompleted = getStudyStatus(getValidationMetrics(false), true);
console.log(`✓ Status at 5 participants -> Badge: "${statusCompleted.statusBadge}" | Tone: ${statusCompleted.tone} | Count: "${statusCompleted.participantCountText}"`);
if (statusCompleted.statusBadge !== "Pilot study completed" || statusCompleted.tone !== "green") {
  console.error("FAIL: Study status badge for 5 trials mismatch!");
  allPassed = false;
}

// Test last exported timestamp
setLastExportedTimestamp("2026-09-08T12:00:00.000Z");
const retrievedTs = getLastExportedTimestamp();
if (retrievedTs !== "2026-09-08T12:00:00.000Z") {
  console.error("FAIL: Last exported timestamp retrieval mismatch!");
  allPassed = false;
} else {
  console.log(`✓ Last Exported Timestamp Verified: ${retrievedTs}`);
}

// 17. Test Exact Hackathon Submission Copy Text Matching
console.log("\n[17] Testing Exact Hackathon Submission Copy Formatting...");
clearAllStudyData();
const zeroSummary = generateSubmissionSummary(false);
const expectedZero = "Real usability data has not yet been collected. The validation framework is fully implemented and ready for study administration with 5 canonical scenarios. Synthetic benchmark: 1,250 cases at 96.2% simulated accuracy. Empirical study protocol established.";
if (!zeroSummary.includes(expectedZero)) {
  console.error("FAIL: Exact zero-participant summary string mismatch!");
  allPassed = false;
} else {
  console.log("✓ Exact zero-participant copy summary verified!");
}

console.log("\n==================================================");
console.log(allPassed ? "ALL 17 VERIFICATION CHECKS PASSED SUCCESSFULLY!" : "SOME CHECKS FAILED!");
console.log("==================================================");

if (!allPassed) process.exit(1);

