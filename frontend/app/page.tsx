// frontend/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import CategoryStrip from "@/components/home/CategoryStrip";
import TrustBar from "@/components/home/TrustBar";
import ProductTile from "@/components/home/ProductTile";
import SaleHero from "@/components/SaleHero";
import { HOME_NEW_ARRIVALS, HOME_BEST_SELLERS, HOME_ACCESSORIES } from "@/lib/homeProducts";

export default function HomePage() {
  return (
    <div>
      {/* Hero — two-panel banner built from the Men/Women catalog tiles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="relative rounded-2xl overflow-hidden grid grid-cols-2 h-[420px] sm:h-[480px]">
          <Image src="/images/hero/men.jpg" alt="" fill priority sizes="(max-width: 640px) 50vw, 640px" className="object-cover object-center" />
          <Image src="/images/hero/women.jpg" alt="" fill priority sizes="(max-width: 640px) 50vw, 640px" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="px-6 sm:px-12 max-w-lg">
              <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
                Style that moves<br />with you.
              </h1>
              <p className="text-white/80 mt-4 text-sm sm:text-base">
                Modern essentials for every day and beyond.
              </p>
              <Link href="/shop" className="inline-block mt-6 bg-white text-gray-900 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                Shop Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TrustBar />

      {/* Shop by category — reuses the same 6 catalog tiles as a navigation strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <h2 className="text-lg font-semibold text-gray-900">Shop by Category</h2>
      </div>
      <CategoryStrip />

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Arrivals</h2>
            <p className="text-gray-500 text-sm">Fresh styles, new stories.</p>
          </div>
          <Link href="/new-arrivals" className="text-sm font-medium text-gray-900 hover:underline">View All →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {HOME_NEW_ARRIVALS.map(p => <ProductTile key={p.slug} product={p} />)}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 bg-gray-50/60">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Best Sellers</h2>
            <p className="text-gray-500 text-sm">Most loved, always.</p>
          </div>
          <Link href="/best-sellers" className="text-sm font-medium text-gray-900 hover:underline">View All →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {HOME_BEST_SELLERS.map(p => <ProductTile key={p.slug} product={p} />)}
        </div>
      </section>

      {/* Accessories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Accessories</h2>
            <p className="text-gray-500 text-sm">Complete your look.</p>
          </div>
          <Link href="/accessories" className="text-sm font-medium text-gray-900 hover:underline">View All →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {HOME_ACCESSORIES.map(p => <ProductTile key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="home-sale"><SaleHero /></section>
    </div>
  );
}
