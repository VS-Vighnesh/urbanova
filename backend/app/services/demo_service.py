# backend/app/services/demo_service.py
"""Stand-in for n8n+Gemini when DEMO_MODE=true. All data is clearly fictional.
Must NEVER be mistaken for the real thing in production — see main.py startup warning below."""
import asyncio
import random
from typing import Any


class DemoService:

    async def simulate_delay(self):
        await asyncio.sleep(random.uniform(1.5, 3.5))

    async def orchestrator_response(self, message: str, task_id: str) -> dict[str, Any]:
        await self.simulate_delay()
        m = message.lower()
        if any(w in m for w in ["damaged", "complaint", "refund", "return", "support"]):
            agent = "customer_support"
        elif any(w in m for w in ["lead", "sales", "buy", "customer interest"]):
            agent = "sales"
        elif any(w in m for w in ["campaign", "marketing", "email", "social"]):
            agent = "marketing"
        elif any(w in m for w in ["candidate", "resume", "hire", "interview", "hr"]):
            agent = "hr"
        elif any(w in m for w in ["invoice", "vendor", "payment", "bill"]):
            agent = "invoice"
        else:
            agent = "customer_support"

        return {
            "success": True, "task_id": task_id, "agent": agent,
            "workflow": "Business_Orchestrator", "status": "completed",
            "message": f"Request routed to {agent.replace('_', ' ').title()} Agent.",
            "actions": ["Received request", "Analyzed intent", f"Routed to {agent}"],
            "requires_approval": False,
            "confidence": round(random.uniform(0.87, 0.98), 2),
            "execution_time": round(random.uniform(1.2, 3.8), 1),
        }

    async def support_response(self, message: str, task_id: str) -> dict[str, Any]:
        await self.simulate_delay()
        categories = {
            "damaged": ("URGENT", "Replacement approved. Our team will arrange a pickup."),
            "refund": ("REFUND", "Refund request received. Processing within 5-7 business days."),
            "payment": ("PAYMENT", "Payment issue noted. Our finance team will assist."),
            "where is my order": ("GENERAL", "Your order is in transit and will arrive within 2 business days."),
        }
        category, response = "GENERAL", "Support request received. Our team will respond shortly."
        for keyword, (cat, resp) in categories.items():
            if keyword in message.lower():
                category, response = cat, resp
                break
        return {
            "success": True, "task_id": task_id, "agent": "customer_support",
            "status": "completed", "classification": category, "message": response,
            "actions": ["Request received", "Intent classified", "Response generated", "Logged to CRM"],
            "requires_approval": False,
            "confidence": round(random.uniform(0.88, 0.97), 2),
            "execution_time": round(random.uniform(2.1, 4.2), 1),
        }

    async def sales_response(self, lead_info: dict, task_id: str) -> dict[str, Any]:
        await self.simulate_delay()
        options = [
            ("READY_TO_BUY", 0.91, "Send personalized pricing offer immediately."),
            ("NEEDS_CALL", 0.78, "Schedule a discovery call within 24 hours."),
            ("EARLY_INTEREST", 0.65, "Enroll in nurture email sequence."),
        ]
        classification, confidence, action = random.choice(options)
        return {
            "success": True, "task_id": task_id, "agent": "sales",
            "status": "completed", "classification": classification,
            "message": f"Lead classified as {classification}. Recommended: {action}",
            "actions": ["Lead data extracted", "Intent analyzed", "Score calculated", "CRM updated"],
            "requires_approval": False, "confidence": confidence,
            "execution_time": round(random.uniform(2.5, 5.0), 1),
        }

    async def marketing_response(self, campaign_request: dict, task_id: str) -> dict[str, Any]:
        await self.simulate_delay()
        channel = campaign_request.get("channel", "EMAIL").upper()
        name = campaign_request.get("name", "Campaign")
        email_content = {
            "subject": f"{name} — Exclusive offer inside",
            "body": f"Hi [Name],\n\n{campaign_request.get('offer', 'Check out our latest collection.')}\n\nShop now at urbanova.store",
        }
        social_content = {
            "caption": f"✨ {campaign_request.get('offer', 'Style that moves with you.')} Shop now — link in bio.",
            "hashtags": "#Urbanova #StyleThatMoves #NewCollection",
        }
        generated = email_content if channel == "EMAIL" else social_content if channel == "SOCIAL" else {**email_content, **social_content}
        return {
            "success": True, "task_id": task_id, "agent": "marketing",
            "status": "awaiting_approval",
            "message": f"{channel} campaign content generated. Awaiting your approval.",
            "generated_content": generated,
            "actions": ["Campaign brief analyzed", "Content generated", "Submitted for approval"],
            "requires_approval": True,
            "confidence": round(random.uniform(0.82, 0.94), 2),
            "execution_time": round(random.uniform(4.0, 8.0), 1),
        }

    async def hr_response(self, candidate_info: dict, task_id: str) -> dict[str, Any]:
        await self.simulate_delay()
        recommendation, confidence = random.choice([("SHORTLIST", 0.92), ("HOLD", 0.74), ("REJECT", 0.88)])
        return {
            "success": True, "task_id": task_id, "agent": "hr",
            "status": "awaiting_approval", "recommendation": recommendation,
            "message": f"Candidate recommended for {recommendation}. Human review required.",
            "actions": ["Resume analyzed", "Skills matched", "Experience evaluated", "Recommendation generated"],
            "requires_approval": True, "confidence": confidence,
            "execution_time": round(random.uniform(3.0, 6.5), 1),
        }

    async def invoice_response(self, invoice_data: dict, task_id: str) -> dict[str, Any]:
        await self.simulate_delay()
        return {
            "success": True, "task_id": task_id, "agent": "invoice",
            "status": "completed", "message": "Invoice extracted, validated, and recorded.",
            "actions": ["File received", "Data extracted", "Vendor identified", "Amount validated", "Finance notified"],
            "requires_approval": False,
            "confidence": round(random.uniform(0.89, 0.99), 2),
            "execution_time": round(random.uniform(3.5, 7.0), 1),
        }

    # ---- wrapper methods used by agent-specific routes (support.py, leads.py, etc.) ----

    async def classify_support_request(self, message: str, customer_email: str | None = None) -> dict:
        r = await self.support_response(message, task_id="demo")
        return {"category": r["classification"], "priority": "HIGH" if r["classification"] == "URGENT" else "MEDIUM",
                "response": r["message"], "confidence": r["confidence"]}

    async def classify_lead(self, notes: str, source: str) -> dict:
        r = await self.sales_response({"notes": notes, "source": source}, task_id="demo")
        return {"classification": r["classification"], "confidence": r["confidence"], "score": round(r["confidence"] * 100, 1)}


demo_service = DemoService()