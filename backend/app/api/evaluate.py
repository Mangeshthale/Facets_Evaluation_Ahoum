"""
backend/app/api/evaluate.py

POST /evaluate  — score a conversation turn across all facets
GET  /health    — check if Ollama is up and model is loaded
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.schemas import EvaluateRequest, EvaluateResponse, FacetScore, EvaluationMetadata
from app.services.aggregator import run_evaluation
from app.services.llm_client import ollama

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_conversation(req: EvaluateRequest):
    """
    Score a conversation turn on all (or filtered) facets.

    - **conversation**: full conversation history as list of {role, content}
    - **turn_index**: which turn to score (-1 = last turn)
    - **facet_categories**: optional filter (e.g. ["emotional", "cognitive"])
    - **facet_ids**: optional filter by specific facet IDs
    """
    try:
        result = await run_evaluation(
            conversation=[t.model_dump() for t in req.conversation],
            turn_index=req.turn_index,
            categories=req.facet_categories,
            facet_ids=req.facet_ids,
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e) + " — run: python scripts/preprocess_facets.py",
        )
    except Exception as e:
        logger.exception("Evaluation failed")
        raise HTTPException(status_code=500, detail=str(e))

    # Convert raw dicts to Pydantic models
    scores = {
        name: FacetScore(**data)
        for name, data in result["scores"].items()
    }

    return EvaluateResponse(
        scores=scores,
        metadata=EvaluationMetadata(**result["meta"]),
    )


@router.get("/health")
async def health_check():
    """Check Ollama availability and model status."""
    model_ready = await ollama.health_check()
    return {
        "status": "ok" if model_ready else "degraded",
        "ollama_url": ollama.base_url,
        "model": ollama.model,
        "model_loaded": model_ready,
        "message": (
            "Ready to score."
            if model_ready
            else f"Model '{ollama.model}' not found. Run: ollama pull {ollama.model}"
        ),
    }
