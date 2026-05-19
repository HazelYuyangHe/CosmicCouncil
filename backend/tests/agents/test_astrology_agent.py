import pytest

from backend.agents.astrology_agent import AstrologyAgent, _STUB_ADVICE
from backend.agents.schemas import AgentOpinion, Preferences, UserContext


@pytest.fixture()
def sample_user_context() -> UserContext:
    return UserContext(
        user_id="user-001",
        birth_date="1995-06-15",
        preferences=Preferences(looking_for="long-term", interests=["hiking", "reading"]),
    )


class TestAstrologyAgent:
    @pytest.mark.asyncio
    async def test_returns_agent_opinion(self, sample_user_context: UserContext) -> None:
        agent = AstrologyAgent()
        result = await agent.run(sample_user_context)
        assert isinstance(result, AgentOpinion)

    @pytest.mark.asyncio
    async def test_agent_name_is_astrology(self, sample_user_context: UserContext) -> None:
        agent = AstrologyAgent()
        result = await agent.run(sample_user_context)
        assert result.agent_name == "astrology"

    @pytest.mark.asyncio
    async def test_advice_is_non_empty_string(self, sample_user_context: UserContext) -> None:
        agent = AstrologyAgent()
        result = await agent.run(sample_user_context)
        assert isinstance(result.advice, str)
        assert result.advice.strip() != ""

    @pytest.mark.asyncio
    async def test_returns_stub_when_no_api_key(
        self, sample_user_context: UserContext, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import backend.agents.astrology_agent as mod
        monkeypatch.setattr(mod.settings, "anthropic_api_key", None)
        result = await AstrologyAgent().run(sample_user_context)
        assert result.advice == _STUB_ADVICE

    @pytest.mark.asyncio
    async def test_falls_back_to_stub_on_llm_error(
        self, sample_user_context: UserContext, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        import backend.agents.astrology_agent as mod
        monkeypatch.setattr(mod.settings, "anthropic_api_key", "sk-ant-fake")

        async def _failing(_: UserContext) -> str:
            raise RuntimeError("API error")

        agent = AstrologyAgent()
        monkeypatch.setattr(agent, "_call_llm", _failing)
        result = await agent.run(sample_user_context)
        assert result.advice == _STUB_ADVICE
