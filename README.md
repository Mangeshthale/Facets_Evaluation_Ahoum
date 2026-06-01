# Facet Eval — Conversation Scoring System

A production-ready benchmark system that scores every conversation turn across **396 facets** covering linguistic quality, pragmatics, safety, and emotion — using open-weights LLMs (≤16B parameters) running locally or in the cloud.

---

## 🌐 Live Demo

| | URL |
|---|---|
| **UI** | https://facets-evaluation-ahoum.vercel.app/ |
| **API Docs** | https://facetbackend-production.up.railway.app/docs |

---

## Architecture

```
Raw Conversation Turn
        │
        ▼
┌─────────────────────┐
│  Data Cleaner &     │  Step 1: Cleans & enriches Facets CSV
│  Enricher           │  Adds category, polarity, difficulty columns
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Facet Batch Router │  Step 2: Splits 396 facets into micro-batches
└─────────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
[Worker A] [Worker B]   Step 3: Parallel LLM scoring
   └────┬────┘           Qwen2.5:7B (local) or Llama-3.1-8B (Groq)
        ▼
┌─────────────────────┐
│  Score Aggregator   │  Step 4: Merge + confidence scores
└─────────────────────┘
        │
        ▼
  FastAPI + React UI
```

**Scales to 5000+ facets without redesign** — adding facets adds batches, not code.

---

## Score Scale

Uses **−2 to +2** instead of 0–4 or 1–5 because the signed scale makes polarity semantically explicit.

| Score | Meaning |
|---|---|
| **+2** | Strongly present / dominant expression |
| **+1** | Mildly present / moderate expression |
| **0** | Neutral — no observable evidence |
| **−1** | Mildly absent |
| **−2** | Strongly absent / strongly negative |

---

## Hard Constraints Met

| Constraint | How |
|---|---|
| No one-shot prompts | Few-shot with 2 anchor examples per batch |
| Open-weights ≤16B | Qwen2.5:7B locally, Llama-3.1-8B on Groq |
| Scales to 5000+ facets | Batch router — more facets = more batches, same code |

## Brownie Points

| Feature | Status |
|---|---|
| Confidence outputs | ✅ Per-facet 0–100% confidence score |
| Dockerised baseline | ✅ `docker-compose up --build` |
| Sample UI | ✅ React dashboard with heatmap + drill-down |

---

## Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) — for local LLM mode

### Step 1 — Clone
```bash
git clone https://github.com/YOUR_USERNAME/facet-eval.git
cd facet-eval
```

### Step 2 — Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

### Step 3 — Configure `.env`
Open `backend/.env` and choose one option:

**Option A — Local Ollama (no API key needed):**
```
GROQ_API_KEY=
MODEL_NAME=qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434
FACETS_PER_BATCH=20
MAX_CONCURRENT_WORKERS=2
```

**Option B — Groq cloud (faster, free key from [console.groq.com](https://console.groq.com)):**
```
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.1-8b-instant
FACETS_PER_BATCH=20
MAX_CONCURRENT_WORKERS=3
```

### Step 4 — Pull model (Option A only)
```bash
ollama pull qwen2.5:7b
```

### Step 5 — Preprocess facets (run once)
```bash
cd ..
python scripts/preprocess_facets.py
```
Expected output: `✅ Processed 396 valid facets`

### Step 6 — Start backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Step 7 — Start frontend
```bash
# New terminal
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Docker (One Command)

```bash
docker-compose --profile local up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

> Set `GROQ_API_KEY` in `backend/.env` to use Groq instead of local Ollama.

---

## Running Tests

```bash
cd backend
venv\Scripts\activate
pytest tests/ -v
```

Expected: **16 passed**

---

## Project Structure

```
facet-eval/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── api/
│   │   │   ├── evaluate.py          # POST /evaluate
│   │   │   └── facets.py            # GET /facets
│   │   ├── core/
│   │   │   ├── config.py            # Settings
│   │   │   └── batch_router.py      # Splits facets into batches
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic models
│   │   └── services/
│   │       ├── llm_client.py        # Ollama client (local)
│   │       ├── llm_client_groq.py   # Groq client (cloud)
│   │       ├── scorer.py            # Prompt builder + parser
│   │       └── aggregator.py        # Parallel batch runner
│   ├── tests/
│   │   ├── test_scorer.py
│   │   └── test_batch_router.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConversationInput.jsx
│   │   │   ├── FacetHeatmap.jsx
│   │   │   └── ScoreCard.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Results.jsx
│   │   └── utils/api.js
│   └── Dockerfile
├── data/
│   ├── raw/Facets_Assignment.csv
│   └── conversations/               # 50 sample conversations + scores
├── scripts/
│   ├── preprocess_facets.py         # Run once before starting
│   ├── generate_sample_conversations.py
│   └── score_all_conversations.py   # Batch score all conversations
├── docker-compose.yml
└── README.md
```

---

## API Reference

### POST /evaluate
```json
{
  "conversation": [
    {"role": "user", "content": "I'm really frustrated with my team today."},
    {"role": "assistant", "content": "That sounds tough. What happened?"}
  ],
  "turn_index": 0,
  "facet_categories": ["emotional", "social"]
}
```

### GET /facets
Returns all 396 enriched facets. Supports `?category=emotional&difficulty=hard`.

### GET /health
Returns model status and active mode (ollama / groq).

---

## Design Decisions

**Why −2 to +2?**
Signed scale makes polarity explicit. Score 0 = no observable evidence, distinct from "low presence". Matches psychological measurement conventions.

**Why micro-batching?**
One-shot prompting is forbidden. Batches of ~20 facets give the model focused attention per facet. The batch router scales horizontally — 5000 facets = 250 batches, same code, just more rounds.

**Why Qwen2.5:7B?**
Strong instruction following, reliable JSON output, fits in 6GB VRAM. Llama-3.1-8B is the cloud equivalent via Groq API.

**Why self-reported confidence?**
Without logit access via Ollama API, the model reports its own uncertainty as a float 0–1. Low confidence flags uncertain inferences for human review.
