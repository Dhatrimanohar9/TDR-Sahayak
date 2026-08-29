# TDR Sahayak

An AI-assisted civic-tech prototype that helps Indian railway passengers understand the appropriate next step when a journey goes wrong, before preparing a mock TDR (Ticket Deposit Receipt) / refund case.

---

## Problem

Every day, thousands of Indian Railway passengers face disruptions—delayed trains, cancelled services, inability to board due to platform chaos, or early train terminations. 

When things go wrong, passengers are often confused about:
- Which refund rule or TDR scenario applies to them
- What evidence or facts they need to record
- What the critical deadlines and timing risks are
- How to prepare their claim without making costly mistakes

---

## Solution

**TDR Sahayak** simplifies the citizen experience through a guided 4-step workflow:
1. **Natural Language Input**: Passengers describe what happened in plain language.
2. **AI Interpretation**: The system reads the description, extracts structured facts, and asks only relevant follow-up questions to fill missing information.
3. **Deterministic Decision Engine**: Pure, rule-based decision logic evaluates the facts to provide a clear, unambiguous recommendation and checklist.
4. **Mock Case Preparation & Tracking**: Passengers review their structured facts, generate a synthetic mock case, and view a simulated case tracker.

---

## Technology

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Vanilla CSS variables with custom theme tokens)
- **State Management**: React state + `localStorage` for local mock case persistence
- **AI / NLP**: OpenAI Chat Completions API (`gpt-4o-mini`) via a Vite server proxy (`/api/analyze`)
- **Fallback Engine**: Pure deterministic keyword & pattern matcher (`src/lib/ai/fallbackParser.ts`) ensuring 100% offline & zero-API-key functionality

---

## How AI is Used

To ensure safety and reliability, AI is strictly bounded:

```
Natural Language Input
       │
       ▼
AI Interpretation Layer (or Fallback Parser)
       │  (Extracts structured facts & identifies missing items)
       ▼
Structured Incident Facts
       │
       ▼
Deterministic Rule-Based Decision Engine
       │  (Scenario A / B / C / D + Timing Risk Assessment)
       ▼
Plain-Language Recommendation & Actionable Checklist
```

- **AI handles**: Understanding messy user descriptions, extracting structured facts, and selecting relevant follow-up questions.
- **Deterministic logic handles**: Final scenario classification, recommended actions, risk levels, and checklist generation. The AI is **never** the sole authority on claim eligibility.

---

## What is Mocked

This application is a **hackathon prototype**. All data and integrations are synthetic:

- **IRCTC & PNR**: No live IRCTC accounts, PNR lookups, or railway databases are accessed.
- **Authentication**: No OTP, phone verification, or user login required.
- **Submission & Payments**: No actual TDR forms are submitted to Indian Railways, and no payment refunds are processed.
- **Deadlines**: Timing risk rules use prototype demo thresholds (e.g. 72-hour comfort window) for visual demonstration.
- **Case Tracking**: Cases are stored locally in the browser's `localStorage` and simulated.

---

## How to Run

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
Run the Vite development server (works out-of-the-box without an OpenAI key):
```bash
npm run dev
```
*(Optional)* To enable live OpenAI API interpretation, start the dev server with `OPENAI_API_KEY`:
```bash
OPENAI_API_KEY=your-api-key npm run dev
```

### 3. Production Build
Type-check and bundle for production:
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

---

## Prototype Limitations

- **Synthetic Data Only**: This application does not submit real TDR or refund claims.
- **No Official Guarantee**: Recommendations and timing warnings are prototype guidance only and do not guarantee eligibility under official Indian Railways rules. Passengers must verify against the official IRCTC process before taking real-world action.
- **No External Government API**: Purely self-contained prototype.
