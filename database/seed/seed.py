# database/seed/seed.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))

from faker import Faker
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import uuid

load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))
from app.database import Base, ensure_lead_tracking_schema
from app.models.user import User, UserRole
from app.models.product import Product, Category
from app.models.customer import Customer, CustomerStatus
from app.models.order import Order, OrderItem, PaymentStatus, FulfillmentStatus
from app.models.lead import Lead, LeadClassification, LeadStatus
from app.models.ticket import Ticket, TicketCategory, TicketStatus, TicketPriority
from app.models.agent import Agent, Task, ExecutionStatus, AgentStatus
from app.models.campaign import Campaign, CampaignChannel, CampaignStatus
from app.models.candidate import Candidate, CandidateRecommendation, CandidateStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.approval import Approval, ApprovalType, ApprovalStatus
from app.utils.auth import hash_password

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://urbanova:urbanova_password_2025@localhost:5432/urbanova_db")

fake = Faker("en_IN")
engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
ensure_lead_tracking_schema()
db = sessionmaker(bind=engine)()

print("Seeding Urbanova database...")

# Users
demo_password_hash = hash_password("demo1234")
seed_users = [
    ("Alex Sharma", "owner@urbanova.demo", UserRole.ADMIN),
    ("Priya Mehta", "customer@urbanova.demo", UserRole.CUSTOMER),
    ("Aarav Khanna", "demo.customer01@urbanova.demo", UserRole.CUSTOMER),
    ("Ananya Iyer", "demo.customer02@urbanova.demo", UserRole.CUSTOMER),
    ("Kabir Nair", "demo.customer03@urbanova.demo", UserRole.CUSTOMER),
    ("Diya Kapoor", "demo.customer04@urbanova.demo", UserRole.CUSTOMER),
    ("Rohan Das", "demo.customer05@urbanova.demo", UserRole.CUSTOMER),
    ("Meera Joshi", "demo.customer06@urbanova.demo", UserRole.CUSTOMER),
    ("Arjun Rao", "demo.customer07@urbanova.demo", UserRole.CUSTOMER),
    ("Sana Khan", "demo.customer08@urbanova.demo", UserRole.CUSTOMER),
    ("Ishaan Patel", "demo.customer09@urbanova.demo", UserRole.CUSTOMER),
    ("Aditi Menon", "demo.customer10@urbanova.demo", UserRole.CUSTOMER),
    ("Dev Malhotra", "demo.customer11@urbanova.demo", UserRole.CUSTOMER),
    ("Tara Shah", "demo.customer12@urbanova.demo", UserRole.CUSTOMER),
    ("Neil Verma", "demo.customer13@urbanova.demo", UserRole.CUSTOMER),
    ("Pooja Reddy", "demo.customer14@urbanova.demo", UserRole.CUSTOMER),
    ("Zoya Sethi", "demo.customer15@urbanova.demo", UserRole.CUSTOMER),
]
for name, email, role in seed_users:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        db.add(User(name=name, email=email, password_hash=demo_password_hash, role=role))
    else:
        user.name = name
        user.password_hash = demo_password_hash
        user.role = role
db.commit()
print("17 demo users (owner, customer, and 15 additional shoppers)")

# Categories
for name, slug in [("Men","men"),("Women","women"),("Accessories","accessories"),("New Arrivals","new-arrivals")]:
    db.add(Category(name=name, slug=slug))
db.commit()
cat_map = {c.slug: c.id for c in db.query(Category).all()}

# Products
for name, slug, price, orig, cat, rating, cnt in [
    ("Urbanova Essential Tee",     "urbanova-essential-tee",     799,  999,  "men",         4.5, 128),
    ("Urbanova Relaxed Jeans",     "urbanova-relaxed-jeans",     1499, 1899, "men",         4.7, 245),
    ("Urbanova Oversized Shirt",   "urbanova-oversized-shirt",   1199, 1499, "men",         4.3, 89),
    ("Urbanova Everyday Hoodie",   "urbanova-everyday-hoodie",   1899, 2299, "men",         4.8, 312),
    ("Urbanova Utility Jacket",    "urbanova-utility-jacket",    2499, 3199, "men",         4.6, 67),
    ("Urbanova Canvas Tote",       "urbanova-canvas-tote",       699,  899,  "accessories", 4.4, 195),
    ("Urbanova Minimal Cap",       "urbanova-minimal-cap",       499,  699,  "accessories", 4.2, 421),
    ("Urbanova Everyday Sneakers", "urbanova-everyday-sneakers", 2299, 2999, "accessories", 4.9, 178),
    ("Urbanova Linen Kurta",       "urbanova-linen-kurta",       1299, 1599, "women",       4.6, 234),
    ("Urbanova Floral Dress",      "urbanova-floral-dress",      1699, 2199, "women",       4.7, 156),
    ("Urbanova Palazzo Set",       "urbanova-palazzo-set",       1999, 2599, "women",       4.5, 98),
]:
    db.add(Product(name=name, slug=slug, price=price, original_price=orig,
                   category_id=cat_map.get(cat), rating=rating, rating_count=cnt,
                   stock=random.randint(10,200),
                   description=f"Premium quality {name.replace('Urbanova ','').lower()} for everyday style."))
db.commit()
product_names = [p.name for p in db.query(Product).all()]
print("Products")

# Customers
for _ in range(100):
    db.add(Customer(name=fake.name(), email=fake.unique.email(), phone=fake.phone_number(),
                    address=fake.address(), total_orders=random.randint(0,15),
                    total_spend=random.uniform(0,25000), status=random.choice(list(CustomerStatus)),
                    last_order_at=datetime.utcnow()-timedelta(days=random.randint(1,180))))
db.commit()
cids = [c.id for c in db.query(Customer).all()]
print("100 Customers")

# Orders
for i in range(60):
    db.add(Order(order_number=f"UV-{10000+i}", customer_id=random.choice(cids),
                 total_amount=random.uniform(799,8000),
                 payment_status=random.choice(list(PaymentStatus)),
                 fulfillment_status=random.choice(list(FulfillmentStatus)),
                 shipping_address={"city":fake.city(),"state":fake.state(),"pincode":fake.postcode()},
                 created_at=datetime.utcnow()-timedelta(days=random.randint(0,90))))
db.commit()
print("60 Orders")

# Leads
# One deterministic lead matching the exact sales-tracking example, so you can
# verify GET /api/leads shows real visit_count / browsed_products / user_intent_notes
# immediately after seeding, without having to click through the site first.
jane_visited_at = datetime.utcnow() - timedelta(days=3)
jane = db.query(Lead).filter(Lead.email == "jane@acme.com").first()
if jane is None:
    jane = Lead(name="Jane Smith", email="jane@acme.com")
    db.add(jane)
jane.name = "Jane Smith"
jane.phone = jane.phone or fake.phone_number()
jane.source = "website_tracking"
jane.classification = LeadClassification.READY_TO_BUY
jane.confidence = 0.91
jane.score = 91.0
jane.status = LeadStatus.NEW
jane.visit_count = 5
jane.order_click_count = 2
jane.browsed_products = ["Noise-Cancelling Headphones Pro", "Mechanical Keyboard"]
jane.first_visited_at = jane_visited_at
jane.last_visited_at = datetime.utcnow() - timedelta(hours=4)
jane.user_intent_notes = "Visited product page 5 times in 3 days, clicked Order twice."

# 49 more leads with randomized (but plausible) visit-tracking data
for _ in range(49):
    visit_count = random.randint(0, 8)
    order_clicks = random.randint(0, min(visit_count, 3))
    first_visit = datetime.utcnow() - timedelta(days=random.randint(0, 14))
    last_visit = first_visit + timedelta(days=random.randint(0, 5)) if visit_count else None
    browsed = random.sample(product_names, k=min(random.randint(0, 3), len(product_names))) if visit_count else []

    notes = None
    if visit_count:
        days = max(1, (last_visit - first_visit).days) if last_visit else 1
        notes = f"Visited product page {visit_count} time{'s' if visit_count != 1 else ''} in {days} day{'s' if days != 1 else ''}."
        if order_clicks:
            notes += f" Clicked Order {order_clicks} time{'s' if order_clicks != 1 else ''}."

    db.add(Lead(
        name=fake.name(), email=fake.email(), phone=fake.phone_number(),
        source=random.choice(["website","instagram","referral","google_ad","website_tracking"]),
        classification=random.choice(list(LeadClassification)),
        confidence=round(random.uniform(0.55,0.98),2),
        score=round(random.uniform(30,98),1), status=random.choice(list(LeadStatus)),
        visit_count=visit_count, order_click_count=order_clicks,
        browsed_products=browsed,
        first_visited_at=first_visit if visit_count else None,
        last_visited_at=last_visit,
        user_intent_notes=notes,
    ))
db.commit()
print("50 Leads (including a deterministic Jane Smith example)")

# Tickets
for i in range(35):
    subj, cat, prio = random.choice([
        ("My order arrived damaged", TicketCategory.URGENT, TicketPriority.URGENT),
        ("I want to return a product", TicketCategory.REFUND, TicketPriority.HIGH),
        ("Where is my order?", TicketCategory.GENERAL, TicketPriority.MEDIUM),
        ("Payment failed but money deducted", TicketCategory.PAYMENT, TicketPriority.URGENT),
    ])
    db.add(Ticket(ticket_number=f"SUP-{1000+i}", customer_email=fake.email(),
                  subject=subj, message=fake.sentence(nb_words=20),
                  category=cat, priority=prio, status=random.choice(list(TicketStatus)),
                  ai_response="Thank you for contacting Urbanova. Your request has been received."))
db.commit()
print("35 Support Tickets")

# Agents
for name, slug, desc in [
    ("Business AI Orchestrator","orchestrator","Coordinates business requests and routes them to specialized AI agents."),
    ("Customer Support Agent","customer_support","Handles customer requests, complaints and support communication."),
    ("Sales & Leads Agent","sales","Classifies leads, prioritizes opportunities and coordinates follow-ups."),
    ("HR Agent","hr","Assists with candidate screening and interview workflows."),
    ("Invoice Agent","invoice","Processes and organizes invoice-related business operations."),
]:
    db.add(Agent(name=name, slug=slug, description=desc, status=AgentStatus.ACTIVE, workflow_name=slug))
db.commit()
slugs = [a.slug for a in db.query(Agent).filter(Agent.slug != "marketing").all()]
print("5 Agents (marketing excluded from the website demo)")

# Tasks
for _ in range(100):
    status = random.choice(list(ExecutionStatus))
    created = datetime.utcnow() - timedelta(hours=random.randint(0,72))
    db.add(Task(
        task_number=f"TASK-{str(uuid.uuid4())[:8].upper()}",
        title=random.choice([
            "Handle damaged product replacement","Analyze new sales lead",
            "Create weekend email campaign","Screen developer candidate",
            "Process vendor invoice","Classify urgent support ticket",
        ]),
        priority=random.choice(["LOW","MEDIUM","HIGH"]),
        status=status, agent_slug=random.choice(slugs),
        confidence=round(random.uniform(0.75,0.98),2),
        created_at=created, started_at=created+timedelta(seconds=1),
        completed_at=created+timedelta(seconds=random.randint(2,10)) if status==ExecutionStatus.COMPLETED else None,
        execution_time=round(random.uniform(1.5,8.0),1),
    ))
db.commit()
print("100 Tasks")

# Campaigns
for name in ["Weekend Flash Sale","New Arrivals Launch","Festive Season Campaign","Summer Essentials"]:
    db.add(Campaign(name=name, objective="Drive sales", audience="Existing customers",
                    channel=random.choice(list(CampaignChannel)), tone="Friendly",
                    offer="20% off orders above ₹1499", status=random.choice(list(CampaignStatus))))
db.commit()
print("Campaigns")

# Candidates
for _ in range(20):
    db.add(Candidate(
        name=fake.name(), email=fake.email(), phone=fake.phone_number(),
        position=random.choice(["Senior Frontend Dev","Backend Engineer","Marketing Manager","Customer Success"]),
        skills=random.sample(["React","Python","FastAPI","PostgreSQL","TypeScript","Marketing","SEO"],3),
        experience_years=round(random.uniform(1,10),1),
        ai_recommendation=random.choice(list(CandidateRecommendation)),
        ai_confidence=round(random.uniform(0.65,0.96),2),
        ai_notes="Strong profile. Experience matches requirements.",
        status=random.choice(list(CandidateStatus))
    ))
db.commit()
print("20 Candidates")

# Invoices
vendors = ["Textile Corp Ltd","Urban Fabrics Pvt","PrintMaster India","LogiShip Courier","CloudStore Services"]
for i in range(30):
    db.add(Invoice(invoice_number=f"INV-{2024001+i}", vendor_name=random.choice(vendors),
                   vendor_email=fake.company_email(), amount=round(random.uniform(5000,150000),2),
                   due_date=datetime.utcnow()+timedelta(days=random.randint(-10,30)),
                   description=f"Services for {fake.month_name()} 2024",
                   status=random.choice(list(InvoiceStatus)),
                   ai_processed=str(random.choice([True,False])).lower()))
db.commit()
print("30 Invoices")

# Approvals
for atype, title, agent in [
    (ApprovalType.HR_CANDIDATE, "Candidate Rahul Sharma — SHORTLIST recommended (92%)", "hr"),
    (ApprovalType.HR_CANDIDATE, "Senior developer candidate awaiting decision", "hr"),
]:
    db.add(Approval(type=atype, title=title, requested_by_agent=agent, status=ApprovalStatus.PENDING, entity_type="demo"))
db.commit()
print("2 Pending Approvals")

db.close()
print("\nDatabase seeded!")
print("---------------------------------")
print("Admin:    owner@urbanova.demo / demo1234")
print("Shopper:  customer@urbanova.demo / demo1234")
print("15 additional shoppers: demo.customer01@urbanova.demo to demo.customer15@urbanova.demo / demo1234")
print("Sales demo lead: jane@acme.com (visit_count=5, READY_TO_BUY)")
print("---------------------------------")