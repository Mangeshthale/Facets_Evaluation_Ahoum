# Facet Eval — Conversation Scoring System

A production-ready benchmark system that scores every conversation turn across 300+ facets covering linguistic quality, pragmatics, safety and emotion.

## Architecture Overview

```
Raw Conversation Turn
        │
        ▼
┌─────────────────────┐
│  Data Cleaner &     │  ← Step 1: Clean & enrich facets CSV
│  Enricher           │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Facet Batch Router │  ← Step 2: Split 300+ facets into micro-batches (~20 each)
└─────────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
[Worker A] [Worker B] ...  ← Step 3: Parallel LLM scoring (Qwen2-7B / Llama-3.1-8B)
   └────┬────┘
        ▼
┌─────────────────────┐
│  Score Aggregator   │  ← Step 4: Merge + logit-based confidence
└─────────────────────┘
        │
        ▼
  FastAPI + React UI
```

**Scale**: Adding facets = adding batches, not new code. Handles 5000+ facets without redesign.

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- Docker + Docker Compose (optional but recommended)
- 16GB RAM minimum (for 7B/8B models via Ollama)
- VS Code (recommended IDE)

---

## Quick Start (Without Docker)

### Step 1 — Clone & setup

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
```

### Step 3 — Install Ollama (runs the LLM locally)

Download from https://ollama.com and then pull the model:

```bash
ollama pull qwen2.5:7b
# OR
ollama pull llama3.1:8b
```

### Step 4 — Preprocess the facets CSV

```bash
python scripts/preprocess_facets.py
```

This creates `data/processed/facets_enriched.csv` with all added columns.

### Step 5 — Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Step 6 — Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Quick Start (With Docker)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Ollama: http://localhost:11434

---

## VS Code Setup

Install these extensions:
- **Python** (ms-python.python)
- **Pylance**
- **ESLint**
- **Prettier**
- **Docker**
- **REST Client** (for testing APIs directly in VS Code)

Recommended `settings.json`:
```json
{
  "editor.formatOnSave": true,
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "editor.rulers": [88]
}
```

---

## Score Scale

We use **-2 to +2** (5 ordered integers) instead of 0-4 or 1-5 because:
- Signed scale makes polarity semantically explicit
- 0 = neutral/absent is more intuitive than 0 = minimum
- Matches psychological research conventions

| Score | Meaning |
|-------|---------|
| -2 | Strongly absent / strongly negative expression |
| -1 | Mildly absent / weak expression |
|  0 | Neutral or insufficient signal |
| +1 | Mildly present / moderate expression |
| +2 | Strongly present / dominant expression |

---

## Project Structure

```
facet-eval/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/
│   │   │   ├── evaluate.py      # POST /evaluate endpoint
│   │   │   └── facets.py        # GET /facets endpoint
│   │   ├── core/
│   │   │   ├── config.py        # Settings (model name, batch size, etc.)
│   │   │   └── batch_router.py  # Splits facets into micro-batches
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   └── services/
│   │       ├── llm_client.py    # Ollama API wrapper
│   │       ├── scorer.py        # Core scoring logic
│   │       └── aggregator.py    # Merges results from all workers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ConversationInput.jsx
│   │   │   ├── FacetHeatmap.jsx
│   │   │   ├── ScoreCard.jsx
│   │   │   └── ConfidenceBar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── Results.jsx
│   │   └── utils/
│   │       └── api.js
│   ├── package.json
│   └── Dockerfile
├── data/
│   ├── raw/Facets_Assignment.csv
│   ├── processed/facets_enriched.csv
│   └── conversations/           # 50 sample conversations
├── docker/
│   └── ollama-init.sh
├── scripts/
│   └── preprocess_facets.py
├── docker-compose.yml
└── README.md
```

---

## API Reference

### POST /evaluate
Score a conversation turn across all facets.

**Request:**
```json
{
  "conversation": [
    {"role": "user", "content": "I'm really frustrated with my team today."},
    {"role": "assistant", "content": "That sounds tough. What happened?"}
  ],
  "turn_index": 0,
  "facet_categories": ["emotional", "linguistic"]
}
```

**Response:**
```json
{
  "scores": {
    "Frustration": {"score": 2, "confidence": 0.91, "reasoning": "..."},
    "Empathy": {"score": 1, "confidence": 0.78, "reasoning": "..."}
  },
  "metadata": {
    "model": "qwen2.5:7b",
    "total_facets_scored": 300,
    "processing_time_ms": 4200
  }
}
```

### GET /facets
Returns all enriched facets with metadata.
