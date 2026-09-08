# TDR Sahayak 🚆

> **Product Principle:** *“AI interprets · Passenger corrects · Rules decide.”*  
> **Hackathon:** Built for the *Build What Moves India* Hackathon  
> **Live Website:** [https://tdr-sahayak.vercel.app](https://tdr-sahayak.vercel.app)

An AI-assisted civic-tech prototype that helps Indian railway passengers understand the appropriate next step when a journey goes wrong, verify extracted facts, and prepare a mock TDR (Ticket Deposit Receipt) / refund case before critical statutory deadlines expire.

---

## The Problem

Every day, thousands of Indian Railway passengers face disruptions—delayed trains, cancelled services, inability to board due to platform chaos, or early train terminations. 

When things go wrong, passengers are often confused about:
- Which refund rule or TDR scenario applies to them
- What evidence or facts they need to record
- What the critical deadlines and timing risks are
- How to avoid claim rejection due to mismatched statements

**The Core Challenge:** Passengers explain disruptions in everyday language, but railway refund rules require structured legal facts. If an AI hallucinates or guesses what happened, the passenger files under the wrong clause and their refund is permanently rejected.

---

## The Solution: 5-Stage Guided Citizen Flow

```
1. Input (Describe / Speak / Upload Ticket)
       │
       ▼
2. AI Interpretation & Fact Extraction
       │
       ▼
3. Fact Verification & Hero Correction
       │  (Passenger verifies/corrects facts; rules re-evaluate live)
       ▼
4. Deterministic Rule Decision & Auditable Trail
       │  (Scenario A / B / C / D + Filing Window Assessment)
       ▼
5. Compact Card Confirmation & Mock Case Tracking
```

### Key Features

1. **Multimodal Incident Intake**:
   - **✍️ Describe**: Natural language input with real-time detection chips and prompt suggestions.
   - **🎙️ Speak**: Multilingual speech recognition across 6 Indian languages:
     - English (India) · हिन्दी (Hindi) · తెలుగు (Telugu) · தமிழ் (Tamil) · മലയാളം (Malayalam) · ಕನ್ನಡ (Kannada)
   - **📄 Upload Document**: Dropzone with drag-and-drop file upload, preview, realistic sample tickets (delayed train ticket, partial journey e-ticket, station TDR slip), and simulated client-side field extraction.

2. **Hero Correction Experience**:
   - High-impact Before vs. After comparison card.
   - Clarifying a single critical fact (e.g. *Did you travel? Yes → No*) immediately shifts the deterministic recommendation from **Scenario C** (*Partial Journey Certificate*) to **Scenario A** (*Delayed Train Full Refund Path*).
   - Proves the core principle: **Rules decide, not hallucinations.**

3. **Deterministic Rule Decision Engine**:
   - Evaluates confirmed facts against statutory railway refund principles:
     - **Scenario A**: Delayed train (>3 hours) — passenger did not travel.
     - **Scenario B**: Could not board / denied entry.
     - **Scenario C**: Partial journey disruption — deboarded midway / certificate needed.
     - **Scenario D**: Ambiguous / insufficient facts.
   - Provides an **Auditable Decision Trail** comparing citizen words against verified railway clauses.

4. **Compact Card-Based Confirmation**:
   - Replaced redundant long review pages with **5 compact summary cards**:
     1. 🚉 **Journey Route**: Origin → Destination (`Hyderabad → Vijayawada`) with quick presets.
     2. 🚶 **Travel Status**: In-place toggle (`Travelled on train` / `Did not travel`).
     3. 🏁 **Journey Completion**: Completion status (`Incomplete — ended halfway` / `Completed`).
     4. ⚠️ **Disruption Details**: Delay duration (`> 6 hours`, `3–6 hours`, `< 3 hours`) and incident type.
     5. 🎟️ **Passenger & Ticket Details**: Train number, ticket/PNR reference, and scheduled date/time.
   - **Live Rule Re-evaluation**: Tapping "Edit" on any card immediately recalculates the decision in zero milliseconds.
   - **Collapsible Secondary Details**: Raw narrative quotes, AI confidence scores, and checklists are tucked cleanly behind *"View all details & extracted fields"*.

5. **Simulated Case Tracker**:
   - Mock tracking dashboard with status timeline, statutory deadline indicators, copyable case summary, and printable view.

6. **Empirical Usability Study Mode (`#study`) & Judge Validation Report (`#validation`)**:
   - **Zero-Fabrication 4-Phase Testing Protocol**: (1) Baseline unassisted pre-test, (2) Live TDR Sahayak interaction, (3) Post-test statutory comprehension & timing audit, (4) Direct before-and-after accuracy & confidence comparison.
   - **4-Tier Transparent Evidence Architecture**: Strict separation between Level A (Synthetic baseline), Level B (Session feedback), Level C (Usability study), and Level D (Production vision).
   - **Pilot Study Status Progression**: Dynamic status indicator (`No real study data collected` → `Pilot study in progress` → `Pilot study completed`).
   - **Data Backup & Integrity**: Local storage warning, RFC-4180 CSV export, JSON backup export & schema-validated import, duplicate participant detection, and last-exported timestamp tracking.
   - **Judge Evaluation Matrix**: Evidence checklist tracking readiness for 8–9/10 hackathon scoring, with dynamic checks and honest pending disclosures.
   - **Feedback-to-Code Tracking**: 4-column engineering iteration log connecting real testing findings directly to validated product code changes.

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (custom rail-themed design tokens)
- **State Management**: React state + `localStorage` for local mock case persistence & empirical study records
- **Speech Recognition**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with fallback guidance
- **AI / NLP**: Optional OpenAI Chat Completions API (`gpt-4o-mini`) via Vite server proxy (`/api/analyze`)
- **Fallback Engine**: Pure deterministic keyword & regex matcher (`src/lib/ai/fallbackParser.ts`) with regional language support, ensuring **100% offline & zero-API-key functionality**
- **Testing**: Deterministic test runner (`npm test`) executing 17 verification suites covering NLP extraction, multilingual prompts, hero correction, document extraction, adversarial edge cases, empirical study metrics, JSON backup import/export, duplicate detection, and copy formatting.

---

## What is Mocked (Honest Prototype Boundaries)

- **IRCTC & PNR**: No live IRCTC accounts, PNR lookups, or railway databases are accessed.
- **Authentication & Payments**: No OTP, phone verification, payments, or banking details required.
- **Submission**: No actual TDR forms are submitted to Indian Railways; claims are recorded locally for demonstration.
- **Zero Fabrication**: Usability study metrics are computed strictly from real participant responses without mixing synthetic baselines.
- **Offline Safe**: Fully usable with zero network connectivity and zero paid APIs.

---

## How to Run & Verify

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Matrix (17 Verification Checks)
Verify all 17 deterministic test suites:
```bash
npm test
```

### 3. Development Mode
Run the Vite development server (works out-of-the-box without an OpenAI key):
```bash
npm run dev
```

*(Optional)* To enable live OpenAI API interpretation, pass `OPENAI_API_KEY`:
```bash
OPENAI_API_KEY=your-api-key npm run dev
```

### 4. Production Build
Type-check and bundle for production:
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```


---

## Prototype Limitations & Disclaimers

- **Synthetic Data Only**: This application does not submit real TDR or refund claims.
- **No Official Guarantee**: Recommendations and timing warnings are prototype guidance only and do not guarantee eligibility under official Indian Railways rules.
- **No External Government API**: Purely self-contained civic-tech prototype.
