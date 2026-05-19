"""
Manual self-test for AstrologyAgent.

Usage:
    python -m backend.dev.test_astrology_llm

Set ANTHROPIC_API_KEY in your environment or .env to test the live LLM path.
Without it, the agent falls back to stub mode.
"""
import asyncio

from backend.agents.astrology_agent import AstrologyAgent
from backend.agents.schemas import Preferences, UserContext


async def main() -> None:
    context = UserContext(
        user_id="dev-test-001",
        birth_date="1992-04-10",
        preferences=Preferences(
            looking_for="long-term",
            interests=["music", "travel", "cooking"],
            dealbreakers=["dishonesty"],
        ),
    )

    agent = AstrologyAgent()
    result = await agent.run(context)

    print(f"source : {result.source}")
    print(f"advice : {result.advice}")


if __name__ == "__main__":
    asyncio.run(main())
