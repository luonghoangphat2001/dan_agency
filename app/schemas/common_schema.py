from pydantic import BaseModel, Field
from typing import Optional, Generic, TypeVar, Any
from app.enums.response_status_enum import ResponseStatus

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    """
    Unified API Response Envelope across all Dan AI Engine endpoints.
    Format: {"status": "success"|"warning"|"error", "message": str|null, "data": T|null}
    """
    status: str = Field(default=ResponseStatus.SUCCESS.value, description="Status: success, warning, error")
    message: Optional[str] = Field(default=None, description="Optional feedback message")
    data: Optional[T] = Field(default=None, description="Response payload data")

    @classmethod
    def success(cls, data: Optional[T] = None, message: Optional[str] = "Success") -> "StandardResponse[T]":
        return cls(status=ResponseStatus.SUCCESS.value, message=message, data=data)

    @classmethod
    def warning(cls, message: str, data: Optional[T] = None) -> "StandardResponse[T]":
        return cls(status=ResponseStatus.WARNING.value, message=message, data=data)

    @classmethod
    def error(cls, message: str, data: Optional[T] = None) -> "StandardResponse[T]":
        return cls(status=ResponseStatus.ERROR.value, message=message, data=data)

