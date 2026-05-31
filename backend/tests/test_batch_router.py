"""
backend/tests/test_batch_router.py
"""

import pytest
from app.core.batch_router import make_batches


FAKE_FACETS = [
    {"facet_id": f"F{i:04d}", "facet_name": f"Facet_{i}", "category": "emotional", "polarity": "positive"}
    for i in range(1, 51)   # 50 fake facets
]


def test_batches_correct_size():
    batches = make_batches(FAKE_FACETS, batch_size=20)
    for batch in batches[:-1]:       # all but last
        assert len(batch) == 20
    assert len(batches[-1]) <= 20    # last batch may be smaller


def test_batches_cover_all_facets():
    batches = make_batches(FAKE_FACETS, batch_size=20)
    all_names = [f["facet_name"] for batch in batches for f in batch]
    assert len(all_names) == len(FAKE_FACETS)
    assert set(all_names) == {f["facet_name"] for f in FAKE_FACETS}


def test_batches_no_duplicates():
    batches = make_batches(FAKE_FACETS, batch_size=15)
    all_names = [f["facet_name"] for batch in batches for f in batch]
    assert len(all_names) == len(set(all_names))


def test_small_batch_size():
    batches = make_batches(FAKE_FACETS, batch_size=1)
    assert len(batches) == len(FAKE_FACETS)


def test_batch_size_larger_than_total():
    batches = make_batches(FAKE_FACETS, batch_size=1000)
    assert len(batches) == 1
    assert len(batches[0]) == len(FAKE_FACETS)


def test_scales_to_5000_facets():
    """Core architectural requirement: must handle 5000 facets."""
    large_set = [
        {"facet_id": f"F{i:04d}", "facet_name": f"Facet_{i}", "category": "general", "polarity": "positive"}
        for i in range(1, 5001)
    ]
    batches = make_batches(large_set, batch_size=20)
    assert len(batches) == 250      # 5000 / 20
    total = sum(len(b) for b in batches)
    assert total == 5000
