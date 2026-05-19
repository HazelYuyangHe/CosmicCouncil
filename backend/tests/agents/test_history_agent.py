import pytest

from backend.agents.history_agent import HistoryAgent, _STUB_ADVICE
from backend.agents.schemas import AgentOpinion, Preferences, UserContext


@pytest.fixture()
def sample_user_context() -> UserContext:
    return UserContext(
        user_id="user-003",
        birth_date="1988-11-05",
        preferences=Preferences(
            looking_for="long-term",
            interests=["reading", "hiking"],
            dealbreakers=["dishonesty", "smoking"],
        ),
    )


class TestHistoryAgent:
    @pytest.mark.asyncio
    async def test_returns_agent_opinion(self, sample_user_context: UserContext) -> None:
        agent = HistoryAgent()
        result = await agent.run(sample_user_context)
        assert isinstance(result, AgentOpinion)

    @pytest.mark.asyncio
    async def test_agent_name_is_history(self, sample_user_context: UserContext) -> None:
        agent = HistoryAgent()
        result = await agent.run(sample_user_context)
        assert result.agent_name == "history"

    @pytest.mark.asyncio
    async def test_advice_is_non_empty_string(self, sample_user_context: UserContext) -> None:
        agent = HistoryAgent()
        result = await agent.run(sample_user_context)
        assert isinstance(result.advice, str) and result.advice.strip()

    @pytest.mark.asyncio
    async def test_returns_stub_when_no_api_key(
        self, sample_user_context: UserContext, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import backend.agents.history_agent as mod
        monkeypatch.setattr(mod.settings, "anthropic_api_key", None)
        result = await HistoryAgent().run(sample_user_context)
        assert result.advice == _STUB_ADVICE
        assert result.source == "stub"

    @pytest.mark.asyncio
    async def test_falls_back_to_stub_on_llm_error(
        self, sample_user_context: UserContext, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import backend.agents.history_agent as mod
        monkeypatch.setattr(mod.settings, "anthropic_api_key", "sk-ant-fake")

        async def _failing(_: UserContext) -> str:
            raise RuntimeError("API error")

        agent = HistoryAgent()
        monkeypatch.setattr(agent, "_call_llm", _failing)
        result = await agent.run(sample_user_context)
        assert result.advice == _STUB_ADVICE
        assert result.source == "stub"
