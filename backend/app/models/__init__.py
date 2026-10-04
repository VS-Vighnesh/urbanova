# backend/app/models/__init__.py
from app.models.user import User, UserRole
from app.models.product import Product, Category, ProductStatus
from app.models.customer import Customer, CustomerStatus
from app.models.order import Order, OrderItem, PaymentStatus, FulfillmentStatus
from app.models.lead import Lead, LeadClassification, LeadStatus
from app.models.ticket import Ticket, TicketCategory, TicketStatus, TicketPriority
from app.models.agent import Agent, Task, AgentExecution, AgentStatus, ExecutionStatus
from app.models.campaign import Campaign, CampaignChannel, CampaignStatus
from app.models.candidate import Candidate, CandidateRecommendation, CandidateStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.approval import Approval, ApprovalType, ApprovalStatus
from app.models.audit_log import AuditLog
from app.models.cart import Cart, CartItem
