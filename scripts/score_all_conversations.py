"""
scripts/score_all_conversations.py

Automatically scores all 50 sample conversations and saves results.
Run AFTER the backend is running on port 8000.

Usage:
    python scripts/score_all_conversations.py

Output:
    data/conversations/scored/conv_001_scores.json  (one per conversation)
    data/conversations/scored/all_scores_summary.json  (combined)
"""

import json, time, httpx
from pathlib import Path

ROOT = Path(__file__).parent.parent
CONV_DIR = ROOT / "data" / "conversations"
OUT_DIR  = ROOT / "data" / "conversations" / "scored"
OUT_DIR.mkdir(exist_ok=True)

API_URL  = "http://localhost:8000/evaluate"
TIMEOUT  = 900  # 15 min per conversation

def score_conversation(conv: dict) -> dict:
    payload = {
        "conversation": conv["turns"],
        "turn_index": 0,   # score the first user turn
        "facet_categories": None,
    }
    with httpx.Client(timeout=TIMEOUT) as client:
        resp = client.post(API_URL, json=payload)
        resp.raise_for_status()
        return resp.json()

def main():
    # Load all conversations
    all_convs_path = CONV_DIR / "sample_conversations.json"
    with open(all_convs_path) as f:
        conversations = json.load(f)

    print(f"Scoring {len(conversations)} conversations...\n")
    summary = []

    for i, conv in enumerate(conversations):
        cid = conv["id"]
        out_path = OUT_DIR / f"{cid}_scores.json"

        # Skip if already scored
        if out_path.exists():
            print(f"[{i+1:2d}/{len(conversations)}] {cid} — already scored, skipping")
            continue

        print(f"[{i+1:2d}/{len(conversations)}] {cid} ({conv['case_type']})...", end=" ", flush=True)
        start = time.time()

        try:
            result = score_conversation(conv)
            elapsed = int(time.time() - start)

            # Save individual result
            output = {
                "conversation_id": cid,
                "case_type": conv["case_type"],
                "turns": conv["turns"],
                "notes": conv.get("notes", ""),
                "expected_high_facets": conv.get("expected_high_facets", []),
                "scores": result["scores"],
                "metadata": result["metadata"],
            }
            with open(out_path, "w") as f:
                json.dump(output, f, indent=2)

            # Quick accuracy check
            expected = conv.get("expected_high_facets", [])
            hits = sum(1 for e in expected if e in result["scores"] and result["scores"][e]["score"] >= 1)
            acc = f"{hits}/{len(expected)}" if expected else "N/A"

            summary.append({"id": cid, "case_type": conv["case_type"], "elapsed_s": elapsed, "expected_hits": acc})
            print(f"✅ {elapsed}s | expected hits: {acc}")

        except Exception as ex:
            print(f"❌ FAILED: {ex}")
            summary.append({"id": cid, "case_type": conv["case_type"], "error": str(ex)})

    # Save summary
    with open(OUT_DIR / "all_scores_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    passed = sum(1 for s in summary if "error" not in s)
    print(f"\n✅ Completed: {passed}/{len(conversations)} conversations scored")
    print(f"   Results saved to: {OUT_DIR}")

if __name__ == "__main__":
    main()
