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
    <section className="home-category-strip" aria-label="Shop by category">
      <div className="home-category-list">
        {TILES.map(tile => (
          <Link key={tile.label} href={tile.href} className="home-category-tile">
            <span className="home-category-image">
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                sizes="(max-width: 640px) 74px, 92px"
              />
            </span>
            <span>{tile.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
