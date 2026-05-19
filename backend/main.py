from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.agents.schemas import JudgeOutput, Preferences, UserContext
from backend.orchestrator.orchestrator import Orchestrator

app = FastAPI(title="Dating Advice API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

_orchestrator = Orchestrator()


class AdviceRequest(BaseModel):
    user_id: str
    birth_date: str
    preferences: Preferences


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/advice", response_model=JudgeOutput)
async def get_advice(request: AdviceRequest) -> JudgeOutput:
    context = UserContext(
        user_id=request.user_id,
        birth_date=request.birth_date,
        preferences=request.preferences,
    )
    return await _orchestrator.run(context)
