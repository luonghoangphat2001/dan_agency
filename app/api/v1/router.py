from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.common_schema import StandardResponse
from app.schemas.rag_schema import DocumentIngestRequest, DocumentIngestData, HybridSearchQueryRequest, HybridSearchQueryData
from app.schemas.agent_schema import AgentOrchestrationRequest, AgentOrchestrationData
from app.services.hybrid_rag_service import HybridRAGService
from app.services.esr_orchestration_service import DSROrchestrationService

api_v1_router = APIRouter()

def get_rag_service() -> HybridRAGService:
    return HybridRAGService()

def get_orchestration_service() -> DSROrchestrationService:
    return DSROrchestrationService()

# ─── Hybrid RAG Endpoints ───────────────────────────────────────────────────
@api_v1_router.post("/rag/ingest", response_model=StandardResponse[DocumentIngestData], status_code=status.HTTP_201_CREATED)
async def ingest_document(
    request_payload: DocumentIngestRequest,
    rag_service: HybridRAGService = Depends(get_rag_service)
):
    """
    Ingest text content into Qdrant Vector DB with dense/sparse embeddings.
    """
    try:
        return await rag_service.ingest_document(request_payload)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {str(error)}"
        )

@api_v1_router.post("/rag/query", response_model=StandardResponse[HybridSearchQueryData], status_code=status.HTTP_200_OK)
async def query_hybrid_rag(
    request_payload: HybridSearchQueryRequest,
    rag_service: HybridRAGService = Depends(get_rag_service)
):
    """
    Perform Hybrid Search (Dense Vector + Sparse BM25 + Reciprocal Rank Fusion).
    """
    try:
        return await rag_service.query_hybrid_rag(request_payload)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hybrid search query failed: {str(error)}"
        )

# ─── Agent Orchestration Endpoints ───────────────────────────────────────────
@api_v1_router.post("/agent/orchestrate", response_model=StandardResponse[AgentOrchestrationData], status_code=status.HTTP_200_OK)
async def orchestrate_agent(
    request_payload: AgentOrchestrationRequest,
    orchestrator: DSROrchestrationService = Depends(get_orchestration_service)
):
    """
    Triggers LangGraph StateGraph ESR Orchestrator.
    Coordinated workflow across 5 Sub-Agents: R&D, CFO, Ops, Logistics, CSKH.
    """
    try:
        orchestration_result = await orchestrator.run(
            prompt=request_payload.prompt,
            user_id=request_payload.user_id,
            executive_role=request_payload.executive_role or "ceo"
        )
        return orchestration_result
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent orchestration failed: {str(error)}"
        )

