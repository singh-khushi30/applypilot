# ApplyPilot

An agentic AI job search copilot that analyzes job fit, identifies skill gaps, discovers relevant contacts, and generates personalized outreach with human-in-the-loop approval.

## Analysis flow

A real analysis uses a pasted job description and a text-based resume PDF. Job URL extraction is not implemented.

```text
Job description + resume PDF
        ↓
Server API  (POST /api/analysis)
        ↓
PDF text extraction
        ↓
Gemini structured analysis
        ↓
Zod validation
        ↓
Bounded retry (2 attempts)
        ↓
Deterministic scoring
        ↓
Analysis result
```

Gemini is called only on the server. `GEMINI_API_KEY` is never exposed to the browser. The model returns structured fit data, not a match percentage. Zod checks every response. If the shape is invalid, ApplyPilot retries once with the schema paths and error codes, then stops. The match percentage is calculated in TypeScript from that validated data, so the same comparison always produces the same score.

Validation logs record only the attempt number and the field path plus error code. They do not include the resume, the job description, the model output, or the API key.

LangGraph orchestration, contact research, outreach, Supabase, and authentication are not part of this flow yet. `/app/analysis/demo` remains a separate sample screen.

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
