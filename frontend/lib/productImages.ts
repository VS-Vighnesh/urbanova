const productImages: Record<string, string> = {
  "urbanova-essential-tee": "/images/products/essential-tee.jpg",
  "urbanova-relaxed-jeans": "/images/products/relaxed-jeans.jpg",
  "urbanova-oversized-shirt": "/images/products/oversized-shirt.jpg",
  "urbanova-everyday-hoodie": "/images/products/everyday-hoodie.jpg",
  "urbanova-utility-jacket": "/images/products/utility-jacket.jpg",
  "urbanova-canvas-tote": "/images/products/canvas-tote.jpg",
  "urbanova-minimal-cap": "/images/products/minimal-cap.jpg",
  "urbanova-everyday-sneakers": "/images/products/everyday-sneakers.jpg",
  "urbanova-linen-kurta": "/images/products/cotton-dress.jpg",
  "urbanova-floral-dress": "/images/products/floral-dress.jpg",
  "urbanova-palazzo-set": "/images/products/ribbed-crop-top.jpg",
};

export function productImageFor(value?: string | null): string | null {
  const key = (value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return productImages[key] || null;
}
