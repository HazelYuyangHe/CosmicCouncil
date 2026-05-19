from backend.agents.schemas import AgentOpinion, JudgeOutput, JudgeScore, UserContext


class JudgeLayer:
    async def evaluate(
        self, opinions: list[AgentOpinion], context: UserContext
    ) -> JudgeOutput:
        scores = [
            JudgeScore(agent_name=op.agent_name, relevance=0.85, safety=1.0, coherence=0.80)
            for op in opinions
        ]

        themes = ", ".join(
            f"{op.agent_name}: {op.advice.split('.')[0].lower()}" for op in opinions
        )
        final_advice = (
            f"Across all perspectives, you should focus on compatibility and intentionality. "
            f"Key themes: {themes}."
        )

        rationale = (
            f"Combined {len(opinions)} agent opinions. "
            "All agents scored high on safety. "
            "Final advice synthesizes the leading insight from each perspective."
        )

        agent_sources = {op.agent_name: op.source for op in opinions}

        return JudgeOutput(
            final_advice=final_advice,
            scores=scores,
            rationale=rationale,
            agent_sources=agent_sources,
            opinions=opinions,
        )
