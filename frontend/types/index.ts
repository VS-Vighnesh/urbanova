// frontend/types/index.ts

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  rating: number;
  rating_count: number;
  stock: number;
  status: string;
  image_url?: string | null;
  category_id?: string | null;
  related?: Product[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  id: string;             // cart_item id — needed for update/remove
  product_id: string;
  product_name: string;
  image_url?: string | null;
  product_image?: string | null;
  price: number;
  quantity: number;
  line_total: number;
  stock?: number;
  current_price?: number | null;
  in_stock?: boolean;
}

export interface CartDTO {
  id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
}

export type Cart = CartDTO;

export interface PriceQuote {
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  shipping: number;
  tax: number;
  total: number;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItemDTO {
  product_name: string;
  quantity: number;
  price: number;
}

export type OrderItem = OrderItemDTO;

export interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  fulfillment_status: "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
  shipping_address: ShippingAddress;
  created_at: string;
  items: OrderItemDTO[];
  payment_method?: "SIMULATED_CARD" | "SIMULATED_FAILURE" | "COD" | null;
  pricing?: {
    subtotal: number;
    discount: number;
    coupon_code: string | null;
    shipping: number;
    tax: number;
    total: number;
  } | null;
}

export interface TrackingStep {
  status: string;
  completed: boolean;
}

export interface OrderTracking {
  order_number: string;
  current_status: string;
  timeline: TrackingStep[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  total_orders: number;
  total_spend: number;
  last_order_at: string | null;
  status: string;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  classification: string;
  confidence: number | null;
  score: number;
  status: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_email: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  ai_response: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  task_number: string;
  title: string;
  status: string;
  agent_slug: string | null;
  confidence: number | null;
  created_at: string;
}

export interface TaskDetail extends Task {
  description: string;
  execution_time: number | null;
  result: Record<string, unknown> | null;
  executions: {
    id: string;
    workflow_name: string;
    status: string;
    execution_time: number | null;
    error: string | null;
    started_at: string;
    completed_at: string | null;
  }[];
}

// Shapes below are inferred — confirm against your actual agents.py / dashboard.py / approvals.py
export interface Agent {
  id: string;
  name: string;
  slug: string;
  status: string;
  tasks_today?: number;
  success_rate?: number;
}

export interface Approval {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  entity_id?: string;
  entity_type?: string;
  created_at: string;
}

export interface DashboardSummary {
  [key: string]: number | string;
}

export interface DashboardMetrics {
  revenue: number;
  orders: number;
  customers: number;
  open_support: number;
  ai_tasks_today: number;
  completed_today: number;
  awaiting_approval: number;
  failed_today: number;
  automation_rate: number;
}