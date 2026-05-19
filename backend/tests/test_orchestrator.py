"""Tests for Orchestrator.run_simple."""
import pytest
from unittest.mock import AsyncMock

from backend.agents.schemas import AgentOpinion, SimpleAdviceResult
from backend.orchestrator.orchestrator import Orchestrator


def _make_opinion(name: str, advice: str) -> AgentOpinion:
    return AgentOpinion(agent_name=name, advice=advice, source="stub")


@pytest.fixture()
def orchestrator() -> Orchestrator:
    orch = Orchestrator()
    orch._agents[0].run = AsyncMock(return_value=_make_opinion("astrology", "The stars favour patience."))
    orch._agents[1].run = AsyncMock(return_value=_make_opinion("behavioral", "Your patterns suggest open communication."))
    orch._agents[2].run = AsyncMock(return_value=_make_opinion("history", "Past experience points to consistency."))
    return orch


@pytest.mark.asyncio
async def test_all_fields_present(orchestrator: Orchestrator) -> None:
    result = await orchestrator.run_simple("I am unsure about my relationship.")

    assert isinstance(result, SimpleAdviceResult)
    assert result.astrology
    assert result.behavioral
    assert result.history
    assert result.final_advice


@pytest.mark.asyncio
async def test_does_not_crash_when_one_agent_fails() -> None:
    orch = Orchestrator()
    orch._agents[0].run = AsyncMock(side_effect=RuntimeError("agent exploded"))
    orch._agents[1].run = AsyncMock(return_value=_make_opinion("behavioral", "Open communication matters."))
    orch._agents[2].run = AsyncMock(return_value=_make_opinion("history", "Consistency is key."))

    result = await orch.run_simple("test situation")

    assert result.astrology == ""          # failed agent → empty string
    assert result.behavioral               # succeeded
    assert result.history                  # succeeded
    assert result.final_advice             # assembled from surviving agents
    assert "exploded" not in result.final_advice
