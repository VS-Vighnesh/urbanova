from fastapi import APIRouter, Depends

from app.config import get_settings
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/workflows", tags=["workflows"])
settings = get_settings()

WORKFLOWS = (
    {
        "slug": "orchestrator",
        "name": "Multi-business orchestrator",
        "description": "Routes a request to the right operations agent.",
        "webhook_setting": "N8N_ORCHESTRATOR_WEBHOOK",
    },
    {
        "slug": "customer_support",
        "name": "Customer support",
        "description": "Classifies a customer message and prepares a response.",
        "webhook_setting": "N8N_SUPPORT_WEBHOOK",
    },
    {
        "slug": "sales",
        "name": "Sales and leads",
        "description": "Scores lead intent and sends browsing activity to the sales workflow.",
        "webhook_setting": "N8N_SALES_WEBHOOK",
    },
    {
        "slug": "hr",
        "name": "HR candidate applications",
        "description": "Collects job applications through the n8n HR form for candidate screening.",
        "webhook_setting": "N8N_HR_WEBHOOK",
    },
    {
        "slug": "invoice",
        "name": "Invoice authenticity verification",
        "description": "Checks whether a submitted invoice is genuine or potentially fake.",
        "webhook_setting": "N8N_INVOICE_WEBHOOK",
    },
)


@router.get("")
async def list_workflows(current_user=Depends(require_admin)):
    return {
        "demo_mode": settings.DEMO_MODE,
        "workflows": [
            {
                "slug": workflow["slug"],
                "name": workflow["name"],
                "description": workflow["description"],
                "webhook_configured": bool(getattr(settings, workflow["webhook_setting"])),
                "available": settings.DEMO_MODE or bool(
                    getattr(settings, workflow["webhook_setting"])
                ),
            }
            for workflow in WORKFLOWS
        ],
    }
