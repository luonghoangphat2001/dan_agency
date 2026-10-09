from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AgentOrchestrationRequest(BaseModel):
    prompt: str = Field(..., description="User prompt or executive directive")
    user_id: str = Field(..., description="User ID requesting orchestration")
    executive_role: Optional[str] = Field(default="ceo", description="Executive role context")

class OrchestrationPlanStep(BaseModel):
    step: int = Field(..., description="Sequential step index")
    agent: str = Field(..., description="Assigned agent or director name")
    task: str = Field(..., description="Departmental sub-task description")

class AgentOrchestrationData(BaseModel):
    user_id: str = Field(..., description="Requesting user ID")
    executive_role: str = Field(..., description="Executive role context")
    target_departments: List[str] = Field(default_factory=list, description="Target departments")
    plan_steps: List[OrchestrationPlanStep] = Field(default_factory=list, description="StateGraph execution trace")
    sub_agent_results: Dict[str, Any] = Field(default_factory=dict, description="Findings per departmental sub-agent")
    scraped_data: Optional[Dict[str, Any]] = Field(default=None, description="OpenClaw web scraping data")
    final_synthesis: str = Field(..., description="Synthesized executive briefing report")
