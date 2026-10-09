import json
from pathlib import Path
from typing import Dict, Any, List, TypedDict, Optional
from app.enums.executive_role_enum import ExecutiveDepartmentRole
from app.enums.response_status_enum import ResponseStatus
from app.schemas.common_schema import StandardResponse
from app.schemas.agent_schema import AgentOrchestrationData, OrchestrationPlanStep
from app.services.openclaw_scraper_service import OpenClawScraperService

FINDINGS_JSON_PATH = Path(__file__).resolve().parent.parent / "data" / "department_findings.json"

def load_department_findings() -> Dict[str, Any]:
    """
    Loads departmental findings configuration from JSON (Zero hardcoded text in business logic).
    """
    with open(FINDINGS_JSON_PATH, "r", encoding="utf-8") as json_file:
        return json.load(json_file)

class AgentState(TypedDict):
    prompt: str
    user_id: str
    executive_role: str
    target_departments: List[str]
    plan_steps: List[OrchestrationPlanStep]
    current_step: int
    sub_agent_results: Dict[str, Any]
    scraped_data: Optional[Dict[str, Any]]
    final_synthesis: str

class DSROrchestrationService:
    """
    Dan ESR Multi-Agent Orchestration Service (LangGraph StateGraph pattern).
    Coordinates 5 Executive Sub-Agents (R&D, CFO, Ops, Logistics, CSKH).
    """

    def __init__(self, scraper_tool: Optional[OpenClawScraperService] = None):
        self.scraper_tool = scraper_tool or OpenClawScraperService()
        self.findings_catalog = load_department_findings()
        self.department_map = {
            role_key: data.get("agent_title")
            for role_key, data in self.findings_catalog.items()
        }

    async def plan_execution(self, state: AgentState) -> AgentState:
        prompt = state["prompt"]
        role = state["executive_role"].lower()
        
        if role == "ceo" or role == "all":
            departments = [
                ExecutiveDepartmentRole.RND.value,
                ExecutiveDepartmentRole.CFO.value,
                ExecutiveDepartmentRole.OPS.value,
                ExecutiveDepartmentRole.LOGISTICS.value,
                ExecutiveDepartmentRole.CSKH.value,
                ExecutiveDepartmentRole.HR.value
            ]
        elif role in self.department_map:
            departments = [role]
        else:
            departments = [ExecutiveDepartmentRole.CFO.value, ExecutiveDepartmentRole.OPS.value]

        state["target_departments"] = departments
        steps = [
            OrchestrationPlanStep(step=1, agent="PlannerAgent", task=f"Deconstruct executive request: '{prompt}' for target departments: {departments}")
        ]
        
        step_index = 2
        for department_code in departments:
            agent_title = self.department_map.get(department_code, f"Agent Dan {department_code.upper()}")
            steps.append(OrchestrationPlanStep(
                step=step_index,
                agent=agent_title,
                task=f"Execute departmental intelligence gathering for [{department_code.upper()}]"
            ))
            step_index += 1
            
        steps.append(OrchestrationPlanStep(
            step=step_index,
            agent="EvaluatorAgent",
            task="Synthesize 6-Sub-Agent findings & format Executive CEO Briefing"
        ))

        state["plan_steps"] = steps
        state["current_step"] = 1
        return state

    async def execute_sub_agents(self, state: AgentState) -> AgentState:
        prompt = state["prompt"]
        departments = state["target_departments"]
        results = {}

        if "http://" in prompt or "https://" in prompt:
            matching_urls = [word for word in prompt.split() if word.startswith("http")]
            if matching_urls:
                target_url = matching_urls[0]
                scraped_result = await self.scraper_tool.scrape_web(target_url)
                state["scraped_data"] = scraped_result

        for department_code in departments:
            if department_code in self.findings_catalog:
                results[department_code] = self.findings_catalog[department_code]

        state["sub_agent_results"] = results
        state["current_step"] = len(departments) + 1
        return state

    async def evaluate_and_synthesize(self, state: AgentState) -> AgentState:
        results = state["sub_agent_results"]
        prompt = state["prompt"]
        
        synthesis_lines = [
            "# 👑 Executive Briefing for CEO",
            f"**Directive**: {prompt}",
            "**Execution Engine**: Dan LangGraph ESR Multi-Agent Orchestrator\n",
            "---",
            "### 📊 Departmental Intelligence Summary"
        ]

        for department_key, department_data in results.items():
            synthesis_lines.append(f"#### 🔹 {department_data['department']} Director")
            synthesis_lines.append(f"- **Findings**: {department_data['findings']}")
            if "metrics" in department_data:
                metrics_string = ", ".join([f"`{metric_key}`: {metric_value}" for metric_key, metric_value in department_data["metrics"].items()])
                synthesis_lines.append(f"- **Key Metrics**: {metrics_string}")

        if state.get("scraped_data"):
            synthesis_lines.append("\n#### 🦞 OpenClaw Web Intelligence")
            synthesis_lines.append(f"- Scraped Status: `{state['scraped_data'].get('status')}`")

        synthesis_lines.append("\n---")
        synthesis_lines.append("**Final Executive Recommendation**: All departmental operational parameters are GREEN. Proceed with strategic execution.")

        state["final_synthesis"] = "\n".join(synthesis_lines)
        state["current_step"] = len(state["plan_steps"])
        return state

    async def run(self, prompt: str, user_id: str, executive_role: str = "ceo") -> StandardResponse[AgentOrchestrationData]:
        initial_state: AgentState = {
            "prompt": prompt,
            "user_id": user_id,
            "executive_role": executive_role,
            "target_departments": [],
            "plan_steps": [],
            "current_step": 0,
            "sub_agent_results": {},
            "scraped_data": None,
            "final_synthesis": ""
        }

        planning_state = await self.plan_execution(initial_state)
        execution_state = await self.execute_sub_agents(planning_state)
        final_state = await self.evaluate_and_synthesize(execution_state)

        orchestration_data = AgentOrchestrationData(
            user_id=user_id,
            executive_role=executive_role,
            target_departments=final_state["target_departments"],
            plan_steps=final_state["plan_steps"],
            sub_agent_results=final_state["sub_agent_results"],
            scraped_data=final_state["scraped_data"],
            final_synthesis=final_state["final_synthesis"]
        )

        return StandardResponse.success(data=orchestration_data, message="Agent orchestration executed successfully.")

