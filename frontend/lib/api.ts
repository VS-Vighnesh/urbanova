const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const TOKEN_KEY = "urbanova_token";
const CART_SESSION_KEY = "urbanova_cart_session";
export const CART_UPDATED_EVENT = "urbanova:cart-updated";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const cartSession = window.localStorage.getItem(CART_SESSION_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (cartSession) headers.set("X-Cart-Session", cartSession);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError("Unable to reach the Urbanova API. Check that the backend is running.", 0);
  }

  const cartSession = response.headers.get("X-Cart-Session");
  if (cartSession && typeof window !== "undefined") {
    window.localStorage.setItem(CART_SESSION_KEY, cartSession);
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : typeof body === "string" && body
          ? body
          : `Request failed (${response.status})`;
    throw new ApiError(detail, response.status);
  }
  if (
    path.startsWith("/api/cart") &&
    (init.method || "GET").toUpperCase() !== "GET" &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
  return body as T;
}

export function saveToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return Boolean(window.localStorage.getItem(TOKEN_KEY));
}
