"""
backend/tests/test_scorer.py

Run with:  pytest tests/ -v
"""

import pytest
from app.services.scorer import _parse_llm_response, _build_facet_list, _build_context_str


# ── Fixtures ─────────────────────────────────────────────────────────────────

SAMPLE_BATCH = [
    {"facet_id": "F0001", "facet_name": "Hostility",   "category": "emotional",  "polarity": "negative"},
    {"facet_id": "F0002", "facet_name": "Openness",    "category": "cognitive",  "polarity": "positive"},
    {"facet_id": "F0003", "facet_name": "Assertiveness","category": "personality","polarity": "positive"},
]

SAMPLE_CONVERSATION = [
    {"role": "user",      "content": "I refuse to listen to this. You're wrong."},
    {"role": "assistant", "content": "Let me explain my reasoning."},
]


# ── _parse_llm_response ───────────────────────────────────────────────────────

def test_parse_valid_response():
    raw = """
    {
        "Hostility":    {"score": 2,  "confidence": 0.95, "reasoning": "Strong dismissal."},
        "Openness":     {"score": -2, "confidence": 0.90, "reasoning": "Refuses new input."},
        "Assertiveness":{"score": 2,  "confidence": 0.88, "reasoning": "Forceful refusal."}
    }
    """
    result = _parse_llm_response(raw, SAMPLE_BATCH)
    assert result["Hostility"]["score"] == 2
    assert result["Openness"]["score"] == -2
    assert result["Assertiveness"]["confidence"] == 0.88


def test_parse_response_with_markdown_fences():
    """Model sometimes wraps output in ```json ... ``` despite instructions."""
    raw = """```json
    {"Hostility": {"score": 1, "confidence": 0.7, "reasoning": "Mild."},
     "Openness":  {"score": 0, "confidence": 0.5, "reasoning": "Unclear."},
     "Assertiveness": {"score": -1, "confidence": 0.6, "reasoning": "Hesitant."}}
    ```"""
    result = _parse_llm_response(raw, SAMPLE_BATCH)
    assert result["Hostility"]["score"] == 1
    assert result["Openness"]["score"] == 0


def test_parse_clamps_out_of_range_scores():
    """Scores outside -2..2 should be clamped, not rejected."""
    raw = '{"Hostility": {"score": 5, "confidence": 0.9, "reasoning": "Over range."}, "Openness": {"score": -5, "confidence": 0.8, "reasoning": "Under range."}, "Assertiveness": {"score": 0, "confidence": 0.5, "reasoning": "Neutral."}}'
    result = _parse_llm_response(raw, SAMPLE_BATCH)
    assert result["Hostility"]["score"] == 2      # clamped to max
    assert result["Openness"]["score"] == -2      # clamped to min


def test_parse_missing_facet_gets_fallback():
    """If the model omits a facet, it should get score=0, confidence=0.0."""
    raw = '{"Hostility": {"score": 1, "confidence": 0.8, "reasoning": "Present."}}'
    result = _parse_llm_response(raw, SAMPLE_BATCH)
    # Openness and Assertiveness were not in model output
    assert result["Openness"]["score"] == 0
    assert result["Openness"]["confidence"] == 0.0
    assert "did not return" in result["Openness"]["reasoning"]


def test_parse_invalid_json_returns_all_fallback():
    raw = "Sorry, I cannot score these facets."
    result = _parse_llm_response(raw, SAMPLE_BATCH)
    for facet in SAMPLE_BATCH:
        assert result[facet["facet_name"]]["score"] == 0
        assert result[facet["facet_name"]]["confidence"] == 0.0


def test_parse_confidence_clamped_to_0_1():
    raw = '{"Hostility": {"score": 1, "confidence": 1.5, "reasoning": "."}, "Openness": {"score": 0, "confidence": -0.2, "reasoning": "."}, "Assertiveness": {"score": 0, "confidence": 0.5, "reasoning": "."}}'
    result = _parse_llm_response(raw, SAMPLE_BATCH)
    assert result["Hostility"]["confidence"] == 1.0
    assert result["Openness"]["confidence"] == 0.0


# ── _build_context_str ────────────────────────────────────────────────────────

def test_build_context_marks_correct_turn():
    ctx = _build_context_str(SAMPLE_CONVERSATION, turn_idx=0)
    assert "THIS TURN" in ctx
    lines = ctx.split("\n")
    assert "THIS TURN" in lines[0]   # turn 0 should be marked
    assert "THIS TURN" not in lines[1]


def test_build_context_last_turn():
    ctx = _build_context_str(SAMPLE_CONVERSATION, turn_idx=1)
    lines = ctx.split("\n")
    assert "THIS TURN" not in lines[0]
    assert "THIS TURN" in lines[1]


# ── _build_facet_list ─────────────────────────────────────────────────────────

def test_build_facet_list_includes_polarity_hint():
    items = _build_facet_list(SAMPLE_BATCH)
    # "Hostility" is negative polarity — should include a hint
    assert "negative trait" in items
    # "Openness" is positive — should NOT include hint
    lines = items.split("\n")
    openness_line = [l for l in lines if "Openness" in l][0]
    assert "negative trait" not in openness_line


def test_build_facet_list_all_facets_present():
    items = _build_facet_list(SAMPLE_BATCH)
    for facet in SAMPLE_BATCH:
        assert facet["facet_name"] in items
