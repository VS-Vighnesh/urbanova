// frontend/components/home/CategoryStrip.tsx
import Link from "next/link";
import Image from "next/image";

const TILES = [
  { label: "Men", href: "/men", image: "/images/hero/men.jpg" },
  { label: "Women", href: "/women", image: "/images/hero/women.jpg" },
  { label: "Accessories", href: "/accessories", image: "/images/hero/accessories.jpg" },
  { label: "New Arrivals", href: "/new-arrivals", image: "/images/hero/new-arrivals.jpg" },
  { label: "Best Sellers", href: "/best-sellers", image: "/images/hero/best-sellers.jpg" },
  { label: "Sale", href: "/sale", image: "/images/hero/sale.jpg" },
];

export default function CategoryStrip() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TILES.map(tile => (
          <Link key={tile.label} href={tile.href} className="group block">
            <div className="aspect-[4/3] lg:aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={tile.image}
                alt={tile.label}
                width={600}
                height={800}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-2 text-center">{tile.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
