import httpx
from typing import Dict, Any
from app.core.config import settings
from app.enums.response_status_enum import ResponseStatus

class OpenClawScraperService:
    """
    OpenClaw Playwright Scraper Service (Port 4000).
    Synchronized with standard {"status": ..., "message": ..., "data": ...} envelope.
    """

    def __init__(self, base_url: str = settings.OPENCLAW_URL):
        self.base_url = base_url.rstrip("/")

    async def scrape_web(self, target_url: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=15.0) as http_client:
                response = await http_client.post(
                    f"{self.base_url}/api/v1/scraper/extract",
                    json={"url": target_url, "render_js": True}
                )
                if response.status_code == 200:
                    return {
                        "status": ResponseStatus.SUCCESS.value,
                        "message": "Web page extracted successfully.",
                        "data": response.json()
                    }
                return {
                    "status": ResponseStatus.WARNING.value,
                    "message": f"OpenClaw responded with status {response.status_code}",
                    "data": {"url": target_url}
                }
        except Exception as error:
            return {
                "status": ResponseStatus.ERROR.value,
                "message": f"Failed to connect to OpenClaw Scraper at {self.base_url}: {str(error)}",
                "data": {"url": target_url}
            }

    async def get_system_status(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as http_client:
                response = await http_client.get(f"{self.base_url}/health")
                if response.status_code == 200:
                    return {
                        "status": ResponseStatus.SUCCESS.value,
                        "message": "OpenClaw service operational.",
                        "data": response.json()
                    }
                return {
                    "status": ResponseStatus.WARNING.value,
                    "message": "OpenClaw service degraded.",
                    "data": None
                }
        except Exception as error:
            return {
                "status": ResponseStatus.ERROR.value,
                "message": f"OpenClaw service offline: {str(error)}",
                "data": None
            }
