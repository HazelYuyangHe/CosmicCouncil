from typing import Optional

from anthropic import AsyncAnthropic

from backend.agents.behavioral.prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from backend.agents.base import BaseAgent
from backend.agents.schemas import AgentOpinion, UserContext
from backend.config import settings

_STUB_ADVICE = (
    "Your communication style suggests you bond best through shared activities. "
    "Prioritize partners who enjoy the same hobbies as you."
)


class BehavioralAgent(BaseAgent):
    def __init__(self, client: Optional[AsyncAnthropic] = None) -> None:
        self._client = client

    async def run(self, context: UserContext) -> AgentOpinion:
        if settings.anthropic_api_key:
            try:
                advice = await self._call_llm(context)
                return AgentOpinion(agent_name="behavioral", advice=advice, source="llm")
            except Exception as exc:
                print(f"[BehavioralAgent] LLM call failed ({exc!r}), using stub advice.")
        return AgentOpinion(agent_name="behavioral", advice=_STUB_ADVICE, source="stub")

    async def _call_llm(self, context: UserContext) -> str:
        user_prompt = USER_PROMPT_TEMPLATE.format(
            looking_for=context.preferences.looking_for,
            interests=", ".join(context.preferences.interests) or "none",
            dealbreakers=", ".join(context.preferences.dealbreakers) or "none",
        )
        if self._client is not None:
            response = await self._client.messages.create(
                model=settings.anthropic_model,
                max_tokens=256,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return response.content[0].text
        async with AsyncAnthropic(api_key=settings.anthropic_api_key) as client:
            response = await client.messages.create(
                model=settings.anthropic_model,
                max_tokens=256,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            return response.content[0].text
