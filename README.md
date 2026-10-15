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

Job URL extraction, OCR, contact scraping, and authentication are not built yet. `/app/analysis/demo` is a separate sample screen and is never used as a fallback for a failed analysis.

A successful analysis is then stored as an application plus an analysis row. The browser opens `/app/analysis/[id]`. If Supabase is not configured, or the save fails, the API still returns the finished analysis and does not call Gemini again. The screen says it was not saved and keeps a copy in this browser session only.

## Outreach flow

From a real analysis, Find relevant people opens contacts for that role. ApplyPilot does not look people up and does not send messages.

```text
Analysis + selected contact
        ↓
Context validation
        ↓
Gemini grounded draft
        ↓
Zod validation + bounded retry
        ↓
LangGraph interrupt (awaiting human review)
        ↓
Edit / Approve / Reject
```

- Example contacts are fictional and labeled Demo. A profile URL is stored only as something you typed. It is not fetched.
- Relevance (Hiring Manager, Recruiter / Talent, Engineering Leader, Potential Teammate, Low Relevance) is a deterministic title and company classification. It does not claim someone owns the opening.
- The draft may use only the strengths and role lines already on the analysis. Gemini does not score the person and does not see the raw resume.
- Schema-invalid or ungrounded output is retried once. The second prompt lists failing paths and codes only.
- The outreach graph pauses with LangGraph `interrupt` before any approval node. Tests resume that pause with a `MemorySaver`. The API creates that saver for a single generation request and then drops it.
- Edit, approve, and reject are explicit transitions in `src/lib/outreach/review.ts`. A draft cannot become approved without Approve. Regenerating returns it to awaiting review.
- When Supabase is configured, the draft and its review state are stored with the application. Refreshing reloads that state. The LangGraph checkpoint is still request-local; the database record is the review source of truth.
- Manual contacts are saved on the application. Example contacts stay fictional until you draft outreach, and that saved row keeps `source = demo`.

ApplyPilot does not automatically send outreach. Human approval is required, and approval still does not send the message.

## Persistence

```text
Job description + resume
        ↓
Analysis agent
        ↓
Application + analysis rows
        ↓
Outreach agent
        ↓
Contact + outreach draft rows
```

Supabase stores the application index (company, role, status, score), the structured analysis (summary, breakdown, alignments, gaps, recommendation, safe trace), contacts, and outreach drafts with their review status and `human_edited` flag.

It does not store the resume PDF, resume text, job description, prompts, chain-of-thought, raw model responses, or API keys.

Database access stays on the server. The browser never receives the Supabase secret key. Row level security is enabled and there are no policies for the public keys, so those keys cannot read or write the tables. The server uses `SUPABASE_SECRET_KEY`, which bypasses RLS. That is a single shared workspace until authentication exists. It is not a production multi-user boundary. `user_id` is on `applications` so ownership policies can be added later.

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser key, unused for data access today)
- `SUPABASE_SECRET_KEY` (server only; required for persistence)
- `GEMINI_API_KEY` (server only)

Missing Supabase configuration does not break the landing page. Persistence routes explain that the variables are required. The SQL migration is `supabase/migrations/20261014170000_initial_schema.sql`.

## Tech stack

- Next.js (App Router), React, and TypeScript
- Tailwind CSS and shadcn/ui
- Motion, Lucide React, and Recharts
- Three.js, React Three Fiber, and Drei
- LangGraph.js, LangChain, and Google Gemini (`gemini-3.8-flash`)
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
