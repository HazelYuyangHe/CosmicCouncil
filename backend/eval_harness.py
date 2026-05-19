"""
Evaluation harness — structural contract checks against a live server.

Usage:
    uvicorn backend.main:app --reload
    python -m backend.eval_harness
"""
import asyncio
import sys

import httpx

BASE_URL = "http://localhost:8000/api/v1/advice"
TIMEOUT = 10.0
EXPECTED_AGENTS = {"astrology", "behavioral", "history"}

CASES = [
    {
        "label": "valid: long-term, interests present",
        "payload": {
            "user_id": "u1",
            "birth_date": "1995-06-15",
            "preferences": {
                "looking_for": "long-term",
                "interests": ["hiking", "reading"],
                "dealbreakers": [],
            },
        },
        "expect_status": 200,
    },
    {
        "label": "valid: casual, dealbreakers present",
        "payload": {
            "user_id": "u2",
            "birth_date": "1990-03-22",
            "preferences": {
                "looking_for": "casual",
                "interests": ["travel"],
                "dealbreakers": ["smoking", "dishonesty"],
            },
        },
        "expect_status": 200,
    },
    {
        "label": "invalid: missing birth_date (expect 422)",
        "payload": {
            "user_id": "u3",
            "preferences": {
                "looking_for": "friendship",
                "interests": [],
                "dealbreakers": [],
            },
        },
        "expect_status": 422,
    },
]


def _check_200(body: dict) -> list[tuple[str, bool]]:
    scores = body.get("scores", [])
    agent_names = {s.get("agent_name") for s in scores}
    score_fields = ["relevance", "safety", "coherence"]

    sources = body.get("agent_sources", None)
    opinions = body.get("opinions", [])

    return [
        ("final_advice is non-empty", bool(body.get("final_advice", "").strip())),
        ("rationale is non-empty", bool(body.get("rationale", "").strip())),
        ("scores has exactly 3 entries", len(scores) == 3),
        ("agent names are exactly astrology/behavioral/history", agent_names == EXPECTED_AGENTS),
        (
            "all score values are floats in [0.0, 1.0]",
            all(
                isinstance(s.get(f), (int, float)) and 0.0 <= s.get(f, -1) <= 1.0
                for s in scores
                for f in score_fields
            ),
        ),
        ("agent_sources is a dict", isinstance(sources, dict)),
        ("agent_sources keys are exactly astrology/behavioral/history", set(sources.keys()) == EXPECTED_AGENTS if isinstance(sources, dict) else False),
        ("agent_sources values are each stub or llm", all(v in ("stub", "llm") for v in sources.values()) if isinstance(sources, dict) else False),
        ("opinions has exactly 3 entries", len(opinions) == 3),
        ("all opinions have non-empty advice", all(bool(op.get("advice", "").strip()) for op in opinions)),
    ]


async def run() -> None:
    passed = 0
    failed = 0

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            for case in CASES:
                label = case["label"]
                expect = case["expect_status"]

                resp = await client.post(BASE_URL, json=case["payload"])

                if resp.status_code != expect:
                    print(f"FAIL  [{label}]  expected HTTP {expect}, got {resp.status_code}")
                    failed += 1
                    continue

                if expect != 200:
                    print(f"PASS  [{label}]  HTTP {expect} as expected")
                    passed += 1
                    continue

                for desc, ok in _check_200(resp.json()):
                    tag = "PASS" if ok else "FAIL"
                    print(f"{tag}  [{label}]  {desc}")
                    if ok:
                        passed += 1
                    else:
                        failed += 1

    except httpx.ConnectError:
        print(
            "\nERROR: Could not connect to the server at http://localhost:8000.\n"
            "Make sure it is running:  uvicorn backend.main:app --reload\n"
        )
        sys.exit(1)

    print(f"\n{'=' * 56}")
    print(f"Result: {passed} passed, {failed} failed")

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run())
