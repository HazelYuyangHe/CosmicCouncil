import asyncio
from typing import Union

from backend.agents.astrology_agent import AstrologyAgent
from backend.agents.behavioral_agent import BehavioralAgent
from backend.agents.history_agent import HistoryAgent
from backend.agents.schemas import (
    AgentOpinion,
    JudgeOutput,
    Preferences,
    SimpleAdviceResult,
    UserContext,
)
from backend.judge.judge import JudgeLayer


class Orchestrator:
    def __init__(self) -> None:
        self._agents = [AstrologyAgent(), BehavioralAgent(), HistoryAgent()]
        self._judge = JudgeLayer()

    async def run(self, context: UserContext) -> JudgeOutput:
        opinions: list[AgentOpinion] = list(
            await asyncio.gather(*[agent.run(context) for agent in self._agents])
        )
        return await self._judge.evaluate(opinions, context)

    async def run_simple(self, situation: str) -> SimpleAdviceResult:
        """Call all agents with a free-text situation string.

        Uses return_exceptions=True so a completely failed agent never
        crashes the whole call — its slot gets an empty string instead.
        """
        context = UserContext(
            user_id="api",
            birth_date="1990-01-01",
            preferences=Preferences(
                looking_for="advice",
                interests=[situation] if situation else [],
            ),
        )

        raw: list[Union[AgentOpinion, BaseException]] = list(
            await asyncio.gather(
                *[agent.run(context) for agent in self._agents],
                return_exceptions=True,
            )
        )

        advice: dict[str, str] = {}
        for item in raw:
            if isinstance(item, BaseException):
                continue
            advice[item.agent_name] = item.advice

        non_empty = [v for v in advice.values() if v]
        if non_empty:
            final_advice = " ".join(non_empty)
        else:
            final_advice = "No advice available at this time."

        return SimpleAdviceResult(
            astrology=advice.get("astrology", ""),
            behavioral=advice.get("behavioral", ""),
            history=advice.get("history", ""),
            final_advice=final_advice,
        )
