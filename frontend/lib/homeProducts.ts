// frontend/lib/homeProducts.ts
//
// Curated homepage products and local image paths.

import type { HomeProduct } from "@/components/home/ProductTile";

export const HOME_NEW_ARRIVALS: HomeProduct[] = [
  { slug: "essential-tee", name: "Urbanova Essential Tee", price: 799, image: "/images/products/essential-tee.jpg", swatches: ["#111827", "#e5e7eb", "#6b7f5e"] },
  { slug: "relaxed-jeans", name: "Urbanova Relaxed Jeans", price: 1499, image: "/images/products/relaxed-jeans.jpg", swatches: ["#5b7a9d", "#1f2937", "#e5e7eb"] },
  { slug: "oversized-shirt", name: "Urbanova Oversized Shirt", price: 1199, image: "/images/products/oversized-shirt.jpg", swatches: ["#f3f4f6", "#9ca3af", "#1f2937"] },
  { slug: "everyday-hoodie", name: "Urbanova Everyday Hoodie", price: 1899, image: "/images/products/everyday-hoodie.jpg", swatches: ["#9ca3af", "#1f2937", "#334155"] },
  { slug: "utility-jacket", name: "Urbanova Utility Jacket", price: 2499, image: "/images/products/utility-jacket.jpg", swatches: ["#5b6b4f", "#1f2937", "#8a6b4f"] },
  { slug: "canvas-tote", name: "Urbanova Canvas Tote", price: 699, image: "/images/products/canvas-tote.jpg", swatches: ["#d9c9ad", "#1f2937", "#6b7280"] },
  { slug: "minimal-cap", name: "Urbanova Minimal Cap", price: 499, image: "/images/products/minimal-cap.jpg", swatches: ["#1f2937", "#334155", "#d9c9ad"] },
  { slug: "everyday-sneakers", name: "Urbanova Everyday Sneakers", price: 2299, image: "/images/products/everyday-sneakers.jpg", swatches: ["#f3f4f6", "#1f2937", "#9ca3af"] },
];

export const HOME_BEST_SELLERS: HomeProduct[] = [
  { slug: "classic-fit-tee", name: "Classic Fit Tee", price: 799, image: "/images/products/classic-fit-tee.jpg", swatches: ["#1f2937", "#f3f4f6", "#6b7f5e"] },
  { slug: "ribbed-crop-top", name: "Ribbed Crop Top", price: 899, image: "/images/products/ribbed-crop-top.jpg", swatches: ["#1f2937", "#f3f4f6", "#e8a7b0"] },
  { slug: "logo-hoodie", name: "Logo Hoodie", price: 1899, image: "/images/products/logo-hoodie.jpg", swatches: ["#1f2937", "#9ca3af", "#334155"] },
  { slug: "oversized-sweater", name: "Oversized Sweater", price: 1499, image: "/images/products/oversized-sweater.jpg", swatches: ["#d9c2a0", "#f3f4f6", "#6b7280"] },
  { slug: "denim-jacket", name: "Denim Jacket", price: 2199, image: "/images/products/denim-jacket.jpg", swatches: ["#1f2937", "#9ca3af", "#334155"] },
  { slug: "cotton-dress", name: "Cotton Dress", price: 1599, image: "/images/products/cotton-dress.jpg", swatches: ["#1f2937", "#d9c2a0", "#e8a7b0"] },
  { slug: "polo-tshirt", name: "Polo T-Shirt", price: 999, image: "/images/products/polo-tshirt.jpg", swatches: ["#f3f4f6", "#1f2937", "#334155"] },
  { slug: "activewear-set", name: "Activewear Set", price: 1799, image: "/images/products/activewear-set.jpg", swatches: ["#b7a8d9", "#1f2937", "#d9c2a0"] },
];

export const HOME_ACCESSORIES: HomeProduct[] = [
  { slug: "classic-sunglasses", name: "Classic Sunglasses", price: 899, image: "/images/products/classic-sunglasses.jpg", swatches: ["#1f2937", "#5b4636", "#6b7f5e"] },
  { slug: "minimal-watch", name: "Minimal Watch", price: 1499, image: "/images/products/minimal-watch.jpg", swatches: ["#1f2937", "#8a6b4f", "#9ca3af"] },
  { slug: "leather-wallet", name: "Leather Wallet", price: 999, image: "/images/products/leather-wallet.jpg", swatches: ["#1f2937", "#8a6b4f", "#d9c2a0"] },
  { slug: "classic-belt", name: "Classic Belt", price: 799, image: "/images/products/classic-belt.jpg", swatches: ["#1f2937", "#8a6b4f", "#d9c2a0"] },
  { slug: "ankle-socks", name: "Ankle Socks (Pack of 3)", price: 299, image: "/images/products/ankle-socks.jpg", swatches: ["#f3f4f6", "#9ca3af", "#1f2937"] },
  { slug: "gym-bag", name: "Gym Bag", price: 1299, image: "/images/products/gym-bag.jpg", swatches: ["#1f2937", "#334155", "#5b6b4f"] },
  { slug: "bucket-hat", name: "Bucket Hat", price: 699, image: "/images/products/bucket-hat.jpg", swatches: ["#d9c2a0", "#1f2937", "#6b7f5e"] },
  { slug: "scarf", name: "Scarf", price: 899, image: "/images/products/scarf.jpg", swatches: ["#d9c2a0", "#1f2937", "#e8a7b0"] },
];
