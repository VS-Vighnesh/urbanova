# backend/app/services/n8n_service.py
import json
import httpx
import logging
from typing import Any, Optional
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class N8NService:
    """Handles all communication with the n8n automation engine.
    Contains NO prompts, NO classification logic — it only posts to a webhook
    and normalizes whatever JSON comes back."""

    def __init__(self):
        self.base_url = settings.N8N_BASE_URL
        self.api_key = settings.N8N_API_KEY
        self.timeout = 30.0

    async def _call_webhook(self, webhook_url: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not webhook_url:
            raise ValueError("Webhook URL not configured. Set the environment variable.")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                webhook_url, json=payload, headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()

    def _normalize_response(self, raw: Any, task_id: str, agent: str) -> dict[str, Any]:
        if isinstance(raw, list):
            if not raw:
                raise ValueError("n8n webhook returned an empty response.")
            raw = raw[0]
        if not isinstance(raw, dict):
            raise ValueError("n8n webhook response must be a JSON object.")
        if isinstance(raw.get("json"), dict):
            raw = raw["json"]

        output = raw.get("output")
        if isinstance(output, dict):
            raw = {**raw, **output}
        elif isinstance(output, str):
            try:
                parsed_output = json.loads(output)
            except json.JSONDecodeError:
                parsed_output = None
            if isinstance(parsed_output, dict):
                raw = {**raw, **parsed_output}
        if not raw:
            raise ValueError("n8n webhook returned an empty JSON object.")

        return {
            "success": raw.get("success", True),
            "task_id": raw.get("task_id", task_id),
            "agent": raw.get("agent", agent),
            "workflow": raw.get("workflow", agent),
            "status": raw.get("status", "completed"),
            "classification": raw.get("classification", raw.get("category")),
            "message": raw.get("message", raw.get("response", output if isinstance(output, str) else "")),
            "actions": raw.get("actions", []),
            "requires_approval": raw.get("requires_approval", False),
            "confidence": raw.get("confidence"),
            "execution_time": raw.get("execution_time"),
            "recommendation": raw.get("recommendation", raw.get("classification")),
            "generated_content": raw.get("generated_content"),
        }

    async def trigger_orchestrator(self, task_id: str, message: str, priority: str = "MEDIUM") -> dict[str, Any]:
        payload = {"task_id": task_id, "message": message, "priority": priority, "source": "urbanova_portal"}
        raw = await self._call_webhook(settings.N8N_ORCHESTRATOR_WEBHOOK, payload)
        return self._normalize_response(raw, task_id, "orchestrator")

    async def trigger_customer_support(self, task_id: str, message: str, customer_email: Optional[str] = None) -> dict[str, Any]:
        payload = {"task_id": task_id, "message": message, "customer_email": customer_email or ""}
        raw = await self._call_webhook(settings.N8N_SUPPORT_WEBHOOK, payload)
        return self._normalize_response(raw, task_id, "customer_support")

    async def trigger_sales(self, task_id: str, lead_info: dict[str, Any]) -> dict[str, Any]:
        payload = {"task_id": task_id, **lead_info}
        raw = await self._call_webhook(settings.N8N_SALES_WEBHOOK, payload)
        return self._normalize_response(raw, task_id, "sales")

    async def trigger_marketing(self, task_id: str, campaign_request: dict[str, Any]) -> dict[str, Any]:
        payload = {"task_id": task_id, **campaign_request}
        raw = await self._call_webhook(settings.N8N_MARKETING_WEBHOOK, payload)
        return self._normalize_response(raw, task_id, "marketing")

    async def trigger_hr(self, task_id: str, candidate_info: dict[str, Any]) -> dict[str, Any]:
        payload = {"task_id": task_id, **candidate_info}
        raw = await self._call_webhook(settings.N8N_HR_WEBHOOK, payload)
        return self._normalize_response(raw, task_id, "hr")

    async def trigger_invoice(self, task_id: str, invoice_data: dict[str, Any]) -> dict[str, Any]:
        payload = {"task_id": task_id, **invoice_data}
        raw = await self._call_webhook(settings.N8N_INVOICE_WEBHOOK, payload)
        return self._normalize_response(raw, task_id, "invoice")


n8n_service = N8NService()