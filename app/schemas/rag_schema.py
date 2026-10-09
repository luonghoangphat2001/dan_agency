from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class DocumentIngestRequest(BaseModel):
    document_id: str = Field(..., description="Unique document identifier")
    content: str = Field(..., description="Text content to embed and index")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata key-values")

class DocumentIngestData(BaseModel):
    document_id: str = Field(..., description="Unique document identifier")
    indexed_chunks: int = Field(default=1, description="Number of chunks indexed")
    vector_db: str = Field(default="qdrant", description="Vector database target")

class HybridSearchQueryRequest(BaseModel):
    query: str = Field(..., description="Search query string")
    top_k: int = Field(default=5, ge=1, le=50, description="Top K results limit")
    category: Optional[str] = Field(default=None, description="Category filter")

class SearchResultItem(BaseModel):
    score: float = Field(..., description="Relevance similarity score")
    content: str = Field(..., description="Extracted context snippet")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Item metadata")

class HybridSearchQueryData(BaseModel):
    query: str = Field(..., description="Original search query")
    top_k: int = Field(..., description="Results limit requested")
    results: List[SearchResultItem] = Field(default_factory=list, description="Ranked context items")
