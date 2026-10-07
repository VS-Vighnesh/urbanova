"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { apiFetch } from "@/lib/api";
import type { Category, Product } from "@/types";

const knownCategoryNames: Record<string, string> = {
  men: "Men",
  women: "Women",
  accessories: "Accessories",
  "new-arrivals": "New Arrivals",
  "best-sellers": "Best Sellers",
  sale: "Sale",
};

const categoryImages: Record<string, string> = {
  men: "/images/hero/men.jpg",
  women: "/images/hero/women.jpg",
  accessories: "/images/hero/accessories.jpg",
  "new-arrivals": "/images/hero/new-arrivals.jpg",
  "best-sellers": "/images/hero/best-sellers.jpg",
};

function CatalogContent({ initialCategory }: { initialCategory: string }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const category = selectedCategory || searchParams.get("category") || initialCategory;
  const searchParam = searchParams.get("search") || "";
  const [sort, setSort] = useState("newest");
  const [searchState, setSearchState] = useState(() => ({ routeValue: searchParam, value: searchParam }));
  const search = searchState.routeValue === searchParam ? searchState.value : searchParam;
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<Category[]>("/api/products/categories")
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    if (category !== "all") query.set("category", category);
    if (search.trim()) query.set("search", search.trim());
    if (sort !== "newest") query.set("sort", sort);
    if (minPrice) query.set("min_price", minPrice);
    if (maxPrice) query.set("max_price", maxPrice);
    apiFetch<Product[]>(`/api/products?${query.toString()}`)
      .then((data) => {
        if (active) {
          setProducts(inStockOnly ? data.filter((product) => product.stock > 0) : data);
          setError("");
        }
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, search, sort, minPrice, maxPrice, inStockOnly]);

  const categoryLabel = useMemo(
    () => categories.find((item) => item.slug === category)?.name || knownCategoryNames[category] || "Everything",
    [categories, category],
  );
  const categoryImage = categoryImages[initialCategory];

  function updateCategory(value: string) {
    setLoading(true);
    setError("");
    setSelectedCategory(value);
  }

  function clearFilters() {
    setLoading(true);
    setSelectedCategory("all");
    setSearchState({ routeValue: searchParam, value: "" });
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setSort("newest");
  }

  return (
    <div className="catalog-page">
      {categoryImage && (
        <div className="collection-hero">
          <Image src={categoryImage} alt="" fill priority sizes="100vw" />
          <div className="collection-hero-shade" />
          <div className="collection-hero-copy">
            <p>THE URBANOVA COLLECTION</p>
            <h1>{categoryLabel}</h1>
            <span>Modern essentials, thoughtfully chosen for every day.</span>
          </div>
        </div>
      )}
      <div className="catalog-topbar">
        <label className="catalog-search">
          <span className="sr-only">Search products</span>
          <input value={search} onChange={(event) => { setLoading(true); setSearchState({ routeValue: searchParam, value: event.target.value }); }} placeholder="Search products…" />
        </label>
        <span className="catalog-count">{loading ? "Finding your next favourite…" : `${products.length} ${products.length === 1 ? "product" : "products"}`}</span>
        <label className="catalog-sort">Sort by
          <select value={sort} onChange={(event) => { setLoading(true); setSort(event.target.value); }}>
            <option value="newest">Featured</option>
            <option value="popular">Best selling</option>
            <option value="rating">Top rated</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="catalog-layout">
        <aside className="catalog-filters" aria-label="Product filters">
          <div className="filter-heading"><h2>Filters</h2><button onClick={clearFilters}>Clear all</button></div>
          <fieldset className="filter-group">
            <legend>Category</legend>
            <button className={`filter-choice ${category === "all" ? "filter-choice-active" : ""}`} onClick={() => updateCategory("all")}>Everything</button>
            {categories.map((item) => <button className={`filter-choice ${category === item.slug ? "filter-choice-active" : ""}`} key={item.id} onClick={() => updateCategory(item.slug)}>{item.name}</button>)}
            {Object.entries(knownCategoryNames).filter(([slug]) => ["new-arrivals", "best-sellers", "sale"].includes(slug) && !categories.some((item) => item.slug === slug)).map(([slug, label]) => (
              <button className={`filter-choice ${category === slug ? "filter-choice-active" : ""}`} key={slug} onClick={() => updateCategory(slug)}>{label}</button>
            ))}
          </fieldset>
          <fieldset className="filter-group">
            <legend>Availability</legend>
            <label className="filter-check"><input type="checkbox" checked={inStockOnly} onChange={(event) => { setLoading(true); setInStockOnly(event.target.checked); }} /> In stock only</label>
          </fieldset>
          <fieldset className="filter-group">
            <legend>Price range</legend>
            <div className="price-filter">
              <label>Min<input type="number" inputMode="numeric" min="0" value={minPrice} onChange={(event) => { setLoading(true); setMinPrice(event.target.value); }} placeholder="₹0" /></label>
              <label>Max<input type="number" inputMode="numeric" min="0" value={maxPrice} onChange={(event) => { setLoading(true); setMaxPrice(event.target.value); }} placeholder="No limit" /></label>
            </div>
          </fieldset>
          <p className="filter-note">Discounts shown are already included in each product’s price.</p>
        </aside>
        <section className="catalog-results" aria-label={`${categoryLabel} products`}>
          {!categoryImage && <div className="catalog-heading"><div><p className="eyebrow">The Urbanova collection</p><h1>{categoryLabel}</h1><p>Modern essentials, thoughtfully chosen for every day.</p></div></div>}
          {error && <div className="notice notice-error" role="alert">{error}</div>}
          {loading ? <div className="catalog-loading">Finding the good things…</div> : products.length ? (
            <div className="sale-product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
          ) : (
            <div className="empty-state"><h2>No products match those filters.</h2><p>{error ? "The collection could not be loaded. Check that the store API is running." : "Try clearing a filter or changing your search."}</p><button className="button button-light" onClick={clearFilters}>Clear filters</button></div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ShopCatalog({ initialCategory = "all" }: { initialCategory?: string }) {
  return <Suspense fallback={<div className="page-loading">Opening the collection…</div>}><CatalogContent initialCategory={initialCategory} /></Suspense>;
}
