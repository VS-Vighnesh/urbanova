# Urbanova workflow demo

## Run the demo

Start PostgreSQL, n8n, the API, and the storefront with `docker compose up --build`.
Seed sample inventory, activity, and accounts with:

```powershell
.\backend\venv\Scripts\python.exe .\database\seed\seed.py
```

Sign in as `owner@urbanova.demo` with password `demo1234`, then open **Admin → Workflows**.
The seed also creates 15 shopper accounts named `demo.customer01@urbanova.demo` through
`demo.customer15@urbanova.demo`; all use the same demo password. Registration creates a
normal customer account and signs the user in. The account menu and account page both
provide sign out.

The seeded Sales/Leads example is available in **Admin → Leads** and is also exposed in
the exact webhook payload format:

```json
{
  "lead_name": "Jane Smith",
  "lead_email": "jane@acme.com",
  "visit_count": 5,
  "browsed_products": [
    "Noise-Cancelling Headphones Pro",
    "Mechanical Keyboard"
  ],
  "user_intent_notes": "Visited product page 5 times in 3 days, clicked Order twice."
}
```

Signed-in product-detail views and add-to-bag clicks update this record by email. The
Sales workflow is called on an Order click or every third product view. Admin users can
retrieve the current n8n-compatible payload from
`GET /api/leads/{lead_id}/workflow-payload`.
Use **Run** on a lead row to replay its stored payload through the Sales workflow.

## Workflow connections

The Workflows page includes the Multi-business orchestrator, Customer Support,
Sales/Leads, HR applications, and invoice authenticity verification. Marketing is
intentionally omitted. HR applications open the provided n8n form at
`http://localhost:5678/form/c0f7aee8-f416-4133-9034-57622ce28537`; invoice checks
open `http://localhost:5678/form/0c201938-dc48-4a68-825d-1357bcfdff48`. The Careers
page uses the same HR form. Keep n8n running and the forms active when demonstrating
these links. Requests handled by the API appear in the matching Candidates, Invoices,
Leads, Support, or Tasks admin view.
The Gmail intake workflow is event-driven: it starts from the Gmail Trigger in n8n
rather than from a storefront form, and is shown as an external n8n trigger in the
workflow workspace. Keep that trigger active in n8n for inbox-driven processing.

With the default `DEMO_MODE=true`, API-run workflows use the local simulator. HR
applications and invoice authenticity checks open their n8n forms directly regardless
of demo mode. To send API-run workflow requests to n8n, set `DEMO_MODE=false` in the
backend environment and configure the relevant server-side webhook URL:

| Workflow | Environment variable |
| --- | --- |
| Multi-business orchestrator | `N8N_ORCHESTRATOR_WEBHOOK` |
| Customer Support | `N8N_SUPPORT_WEBHOOK` |
| Sales/Leads | `N8N_SALES_WEBHOOK` |
| HR | `N8N_HR_WEBHOOK` |
| Invoice | `N8N_INVOICE_WEBHOOK` |

Use the production webhook URLs for activated n8n workflows. Keep webhook URLs and
`N8N_API_KEY` on the backend; do not expose them as `NEXT_PUBLIC_*` frontend variables.
When lead activity triggers Sales, the payload uses `lead_name`, `lead_email`,
`visit_count`, `browsed_products`, and `user_intent_notes`.

## Support and application email

The support form classifies and records each message, then sends the request to
`holahoal3311@gmail.com` through the backend SMTP service. Add these settings to the
root `.env` file before submitting support messages; for Gmail, use an app password
instead of the account password:

```dotenv
SUPPORT_EMAIL=holahoal3311@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=holahoal3311@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_EMAIL=holahoal3311@gmail.com
SMTP_USE_SSL=false
```

The form reports an explicit delivery/configuration error and provides a direct
`mailto:` fallback if SMTP is unavailable. Candidate applications are collected by
the n8n HR form; applicants can alternatively email their resume to the same address.
