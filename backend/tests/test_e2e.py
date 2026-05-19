import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app

VALID_PAYLOAD = {
    "user_id": "user-001",
    "birth_date": "1995-06-15",
    "preferences": {
        "looking_for": "long-term",
        "interests": ["hiking"],
        "dealbreakers": [],
    },
}


@pytest.mark.asyncio
async def test_advice_returns_200_with_valid_payload() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/advice", json=VALID_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["final_advice"], str) and body["final_advice"]
    assert len(body["scores"]) == 3
    assert isinstance(body["rationale"], str) and body["rationale"]
    assert set(body["agent_sources"].keys()) == {"astrology", "behavioral", "history"}
    assert all(v in ("stub", "llm") for v in body["agent_sources"].values())
    assert len(body["opinions"]) == 3
    assert all(op["advice"] for op in body["opinions"])


@pytest.mark.asyncio
async def test_advice_returns_422_when_birth_date_missing() -> None:
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "birth_date"}
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/advice", json=payload)

    assert response.status_code == 422
