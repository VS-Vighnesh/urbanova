import { apiFetch } from "@/lib/api";

async function sendTrackingEvent(
  event: "PRODUCT_VIEW" | "ORDER_CLICK",
  productName?: string,
) {
  try {
    await apiFetch("/api/leads/track", {
      method: "POST",
      body: JSON.stringify({
        event,
        ...(productName ? { product_name: productName } : {}),
      }),
    });
  } catch (error) {
    console.error("Unable to record lead activity.", error);
  }
}

export function trackProductView(productName: string) {
  return sendTrackingEvent("PRODUCT_VIEW", productName);
}

export function trackOrderClick() {
  return sendTrackingEvent("ORDER_CLICK");
}