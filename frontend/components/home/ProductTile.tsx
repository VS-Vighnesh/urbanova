// frontend/components/home/ProductTile.tsx
import Link from "next/link";
import Image from "next/image";

export interface HomeProduct {
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string; // path under /public/images/products
  swatches?: string[]; // hex colors for the little dots, purely decorative
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function ProductTile({ product }: { product: HomeProduct }) {
  return (
    <Link href={`/shop?search=${encodeURIComponent(product.name)}`} aria-label={`Find ${product.name} in the shop`} className="group block">
      <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
        <Image src={product.image} alt={product.name} width={600} height={800} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium text-gray-900 group-hover:underline">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-gray-900">{formatINR(product.price)}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">{formatINR(product.originalPrice)}</span>
          )}
        </div>
        {product.swatches && (
          <div className="flex items-center gap-1.5 mt-2">
            {product.swatches.map((color, i) => (
              <span key={i} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
