# ApplyPilot

An agentic AI job search copilot that analyzes job fit, identifies skill gaps, discovers relevant contacts, and generates personalized outreach with human-in-the-loop approval.

## Analysis flow

A real analysis uses a pasted job description and a text-based resume PDF. Job URL extraction is not implemented.

```text
Job description + resume PDF
        ↓
Input validation           (POST /api/analysis)
        ↓
PDF text extraction
        ↓
LangGraph analysis workflow (src/lib/agent)
        ↓
Gemini structured evidence analysis
        ↓
Zod validation
        ↓
Deterministic match scoring
        ↓
Quality evaluation
        ↓
Conditional corrective retry
        ↓
Final analysis
```

The API route validates the request and the PDF, extracts the resume text, and invokes the graph. The graph controls what runs next:

```text
START → structure_and_compare → calculate_match → evaluate_analysis
          evaluate_analysis ── passed ───────────────→ prepare_result → END
          evaluate_analysis ── failed, retry left ───→ correct_analysis → calculate_match
          evaluate_analysis ── failed, no retry left → reject_analysis → END
```

- **structure_and_compare** asks Gemini for requirements, resume evidence, gaps, domain alignment, a recommendation summary, and next steps. The job description and resume are fenced as untrusted data.
- **calculate_match** runs the TypeScript scoring function. No model call.
- **evaluate_analysis** runs deterministic checks for grounding, required-skill coverage, internal consistency, usefulness, and scoring integrity.
- **correct_analysis** sends the previous analysis and the evaluator's issue codes back to Gemini, with the documents for grounding, and asks it to fix only those issues.

### Score ownership

Gemini never produces a score or a verdict. The percentage, the breakdown, and the Strong Match (80–100), Potential Match (60–79), or Stretch (0–59) label all come from `calculateMatch`. Required skills weigh 45%, resume evidence 25%, preferred skills 15%, and domain alignment 15%. A group the posting does not list is left out and the remaining weights are scaled to 100%.

### Two bounded retry layers

1. **Structured-output retry** (`src/lib/ai/structured-output.ts`). Covers a malformed, unparseable, or schema-invalid model response. Each model request gets at most 2 attempts, and the second only names the failing schema paths and codes.
2. **Agent evaluation retry** (`src/lib/agent`). Covers a schema-valid analysis that is inconsistent, ungrounded, or incomplete. The graph allows at most 1 corrective pass, then fails with a safe error. Scoring defects are not sent to the model because they are application bugs.

One run makes at most 4 model requests, within a 55 second overall budget.

### Trace, logging, and privacy

Gemini is called only on the server. `GEMINI_API_KEY` is never exposed to the browser.

The result's Agent run section shows the trace recorded by the graph as it ran: the node, status, attempt, duration, and a count-based detail such as "3 requirements · 2 required". Thinking output is disabled, and the trace never contains prompts, documents, raw model output, chain-of-thought, or evaluator messages.

Server logs are structured JSON with only the event, node, status, attempt, duration, error code, and evaluator issue codes. They never include the resume, the job description, prompts, model output, or the API key.

Contact research, outreach, Supabase, and authentication are not built yet. Job URL extraction and OCR are not implemented. `/app/analysis/demo` is a separate sample screen and is never used as a fallback for a failed analysis.

## Tech stack

- Next.js (App Router), React, and TypeScript
- Tailwind CSS and shadcn/ui
- Motion, Lucide React, and Recharts
- Three.js, React Three Fiber, and Drei
- LangGraph.js, LangChain, and Google Gemini
- Supabase
- Zod and React Hook Form

## Local setup

Install dependencies:

```bash
npm install
```

Copy the environment template and fill in your own values:

```bash
cp .env.example .env.local
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm test
npm run lint
npm run build
```
