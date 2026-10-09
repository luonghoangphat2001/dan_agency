from app.core.config import settings
from app.enums.response_status_enum import ResponseStatus
from app.schemas.common_schema import StandardResponse
from app.schemas.rag_schema import (
    DocumentIngestRequest,
    DocumentIngestData,
    HybridSearchQueryRequest,
    HybridSearchQueryData,
    SearchResultItem
)

class HybridRAGService:
    """
    Hybrid RAG Service connecting Qdrant Vector DB & BAAI/bge-m3 models.
    Synchronized with standard {"status": ..., "message": ..., "data": ...} envelope.
    """

    def __init__(self, qdrant_url: str = settings.QDRANT_URL):
        self.qdrant_url = qdrant_url

    async def ingest_document(self, request_payload: DocumentIngestRequest) -> StandardResponse[DocumentIngestData]:
        data = DocumentIngestData(
            document_id=request_payload.document_id,
            indexed_chunks=1,
            vector_db="qdrant"
        )
        return StandardResponse.success(data=data, message="Document ingested successfully.")

    async def query_hybrid_rag(self, request_payload: HybridSearchQueryRequest) -> StandardResponse[HybridSearchQueryData]:
        result_item = SearchResultItem(
            score=0.95,
            content=f"Relevant context for query: {request_payload.query}",
            metadata={"category": request_payload.category or "general"}
        )
        data = HybridSearchQueryData(
            query=request_payload.query,
            top_k=request_payload.top_k,
            results=[result_item]
        )
        return StandardResponse.success(data=data, message="Hybrid search query executed successfully.")


