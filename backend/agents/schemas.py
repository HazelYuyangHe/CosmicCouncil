from typing import Dict, Literal

from pydantic import BaseModel, Field


class Preferences(BaseModel):
    looking_for: str
    interests: list[str] = []
    dealbreakers: list[str] = []


class UserContext(BaseModel):
    user_id: str
    birth_date: str
    preferences: Preferences


class AgentOpinion(BaseModel):
    agent_name: str
    advice: str
    source: Literal["stub", "llm"] = "stub"


class JudgeScore(BaseModel):
    agent_name: str
    relevance: float
    safety: float
    coherence: float


class JudgeOutput(BaseModel):
    final_advice: str
    scores: list[JudgeScore]
    rationale: str
    agent_sources: Dict[str, Literal["stub", "llm"]] = Field(default_factory=dict)
    opinions: list[AgentOpinion] = Field(default_factory=list)


class SimpleAdviceResult(BaseModel):
    """Flat output for the simple string-in / structured-out orchestrator path."""
    astrology: str
    behavioral: str
    history: str
    final_advice: str
