"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { apiFetch, CART_UPDATED_EVENT } from "@/lib/api";
import type { Cart } from "@/types";

const menuContent = {
  Men: {
    href: "/men",
    image: "/images/hero/men.jpg",
    subtitle: "Modern essentials for every day and beyond.",
    columns: [
      { title: "Topwear", links: ["T-Shirts", "Polo T-Shirts", "Shirts", "Hoodies", "Sweatshirts", "Jackets"] },
      { title: "Bottomwear", links: ["Jeans", "Chinos", "Cargo Pants", "Track Pants", "Shorts", "Joggers"] },
      { title: "Footwear", links: ["Sneakers", "Running Shoes", "Casual Shoes", "Formal Shoes", "Sandals"] },
      { title: "Accessories", links: ["Caps & Hats", "Sunglasses", "Watches", "Wallets", "Belts", "Bags"] },
    ],
    cards: [
      { title: "New Arrivals", subtitle: "Fresh styles, new stories.", href: "/new-arrivals", image: "/images/hero/new-arrivals.jpg" },
      { title: "Accessories", subtitle: "Complete your look.", href: "/accessories", image: "/images/hero/accessories.jpg" },
      { title: "Footwear", subtitle: "Step into style.", href: "/shop", image: "/images/products/everyday-sneakers.jpg" },
    ],
  },
  Women: {
    href: "/women",
    image: "/images/hero/women.jpg",
    subtitle: "Thoughtful pieces made for your everyday.",
    columns: [
      { title: "Clothing", links: ["Tops & Tees", "Dresses", "Shirts", "Sweaters", "Jackets", "Activewear"] },
      { title: "Bottomwear", links: ["Jeans", "Trousers", "Shorts", "Leggings", "Skirts"] },
      { title: "Footwear", links: ["Sneakers", "Everyday Shoes", "Sandals", "Slippers"] },
      { title: "Accessories", links: ["Bags", "Jewelry", "Sunglasses", "Watches", "Scarves"] },
    ],
    cards: [
      { title: "New Arrivals", subtitle: "Meet your new favourites.", href: "/new-arrivals", image: "/images/hero/new-arrivals.jpg" },
      { title: "Best Sellers", subtitle: "The pieces you love.", href: "/best-sellers", image: "/images/hero/best-sellers.jpg" },
      { title: "Accessories", subtitle: "The finishing touches.", href: "/accessories", image: "/images/hero/accessories.jpg" },
    ],
  },
  Accessories: {
    href: "/accessories",
    image: "/images/hero/accessories.jpg",
    subtitle: "The little details that make it yours.",
    columns: [
      { title: "Everyday carry", links: ["Bags & Backpacks", "Wallets", "Phone Cases", "Keychains"] },
      { title: "Finishing touches", links: ["Watches", "Sunglasses", "Belts", "Caps & Hats"] },
      { title: "For everyone", links: ["Socks", "Scarves", "Jewelry", "Travel"] },
    ],
    cards: [
      { title: "New Arrivals", subtitle: "Fresh finds, just in.", href: "/new-arrivals", image: "/images/hero/new-arrivals.jpg" },
      { title: "Best Sellers", subtitle: "Well-loved essentials.", href: "/best-sellers", image: "/images/hero/best-sellers.jpg" },
      { title: "Shop the sale", subtitle: "A little something off.", href: "/sale", image: "/images/hero/sale.jpg" },
    ],
  },
  Collections: {
    href: "/shop",
    image: "/images/hero/best-sellers.jpg",
    subtitle: "Good things, gathered together.",
    columns: [
      { title: "Discover", links: ["Summer Collection", "Winter Collection", "Streetwear", "Minimal Essentials"] },
      { title: "For your day", links: ["Workwear", "Gym & Activewear", "Travel", "Weekend"] },
    ],
    cards: [
      { title: "New Arrivals", subtitle: "Fresh styles, new stories.", href: "/new-arrivals", image: "/images/hero/new-arrivals.jpg" },
      { title: "Best Sellers", subtitle: "The ones you come back to.", href: "/best-sellers", image: "/images/hero/best-sellers.jpg" },
      { title: "Shop the sale", subtitle: "Good things, for less.", href: "/sale", image: "/images/hero/sale.jpg" },
    ],
  },
};

type MenuName = keyof typeof menuContent;

const primaryLinks = [
  { href: "/new-arrivals", label: "New Arrivals" },
  { href: "/best-sellers", label: "Best Sellers" },
  { href: "/sale", label: "Sale", sale: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, sessionError } = useAuth();
  const { slugs } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuName | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let active = true;
    const refreshCart = () => {
      void apiFetch<Cart>("/api/cart")
        .then((cart) => {
          if (active) {
            setCartCount(cart.item_count);
            setCartError("");
          }
        })
        .catch((error: unknown) => {
          if (active) {
            setCartCount(null);
            setCartError(error instanceof Error ? error.message : "Unable to load your cart.");
          }
        });
    };
    refreshCart();
    window.addEventListener(CART_UPDATED_EVENT, refreshCart);
    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, refreshCart);
    };
  }, [pathname, user]);

  function closeMenus() {
    setMenuOpen(false);
    setActiveMenu(null);
    setAccountOpen(false);
    setSearchOpen(false);
  }

  function signOut() {
    logout();
    closeMenus();
    window.location.replace("/");
  }

  function searchProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/shop?search=${encodeURIComponent(query)}` : "/shop");
    closeMenus();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="site-header" onMouseLeave={() => setActiveMenu(null)}>
      <div className="announcement">
        <span className="announcement-shipping">Free shipping on orders above ₹999</span>
        <Link className="announcement-offer" href="/sale" onClick={closeMenus}>
          <strong>FLAT 50% OFF</strong> on selected styles <span aria-hidden="true">→</span>
        </Link>
        <div className="announcement-utility">
          <Link href="/orders" onClick={closeMenus}>Track order</Link>
          <span aria-hidden="true" />
          <Link href="/support" onClick={closeMenus}>Support</Link>
          <span aria-hidden="true" />
          <span className="announcement-country"><span aria-hidden="true">🇮🇳</span> India&nbsp; | &nbsp;INR (₹)</span>
        </div>
      </div>

      <nav className="nav-wrap" aria-label="Main navigation">
        <Link className="brand" href="/" onClick={closeMenus} aria-label="Urbanova home">
          <span>URBANOVA</span>
        </Link>

        <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
          {(Object.keys(menuContent) as MenuName[]).slice(0, 3).map((name) => (
            <div className={`nav-category ${activeMenu === name ? "nav-category-open" : ""}`} key={name}>
              <button
                type="button"
                className={`nav-link nav-category-trigger ${isActive(menuContent[name].href) ? "active" : ""}`}
                aria-expanded={activeMenu === name}
                aria-haspopup="true"
                onMouseEnter={() => setActiveMenu(name)}
                onClick={() => setActiveMenu(activeMenu === name ? null : name)}
              >
                {name}<ChevronDown size={14} />
              </button>
              {activeMenu === name && <MegaMenu name={name} closeMenus={closeMenus} />}
            </div>
          ))}

          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              className={`nav-link ${link.sale ? "nav-link-sale" : ""} ${isActive(link.href) ? "active" : ""}`}
              href={link.href}
              onClick={closeMenus}
            >
              {link.label}
            </Link>
          ))}

          <div className={`nav-category nav-collections ${activeMenu === "Collections" ? "nav-category-open" : ""}`}>
            <button
              type="button"
              className={`nav-link nav-category-trigger ${isActive("/shop") ? "active" : ""}`}
              aria-expanded={activeMenu === "Collections"}
              aria-haspopup="true"
              onMouseEnter={() => setActiveMenu("Collections")}
              onClick={() => setActiveMenu(activeMenu === "Collections" ? null : "Collections")}
            >
              Collections<ChevronDown size={14} />
            </button>
            {activeMenu === "Collections" && <MegaMenu name="Collections" closeMenus={closeMenus} />}
          </div>

          <Link className="mobile-nav-link" href="/shop" onClick={closeMenus}>Shop everything</Link>
          <Link className="mobile-nav-link" href="/orders" onClick={closeMenus}>Track order</Link>
          <Link className="mobile-nav-link" href="/support" onClick={closeMenus}>Support</Link>
          {user?.role && ["ADMIN", "MANAGER"].includes(user.role.toUpperCase()) && (
            <Link className="mobile-nav-link" href="/admin" onClick={closeMenus}>Admin</Link>
          )}
        </div>

        <div className="nav-right">
          <form className={`nav-search ${searchOpen ? "nav-search-open" : ""}`} role="search" onSubmit={searchProducts}>
            <button type="submit" aria-label="Search products"><Search size={19} strokeWidth={1.8} /></button>
            <input
              aria-label="Search products, categories, or styles"
              placeholder="Search for products, categories, or styles..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>

          <div className="nav-actions">
            <button
              className="mobile-search-toggle"
              type="button"
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <X size={21} /> : <Search size={21} />}
            </button>
            <Link className="nav-action" href="/wishlist" aria-label={`Wishlist, ${slugs.length} saved items`} onClick={closeMenus}>
              <span className="nav-action-icon"><Heart size={23} strokeWidth={1.7} /></span>
              <span className="nav-action-label">Wishlist</span>
              {slugs.length > 0 && <span className="nav-action-badge">{slugs.length}</span>}
            </Link>
            <div className="account-menu">
              <button className="nav-action" type="button" aria-label="Account" aria-expanded={accountOpen} onClick={() => setAccountOpen(!accountOpen)}>
                <span className="nav-action-icon"><UserRound size={23} strokeWidth={1.7} /></span>
                <span className="nav-action-label">Account</span>
              </button>
              {accountOpen && <div className="account-dropdown">
                {user ? (
                  <>
                    <p className="account-greeting">Hello, {user.name}</p>
                    <span className="account-email">{user.email}</span>
                    <Link href="/account" onClick={closeMenus}>My account</Link>
                    <Link href="/orders" onClick={closeMenus}>My orders</Link>
                    {user.role && ["ADMIN", "MANAGER"].includes(user.role.toUpperCase()) && (
                      <Link href="/admin" onClick={closeMenus}>Admin</Link>
                    )}
                    {sessionError && <p className="account-session-error" role="status">{sessionError}</p>}
                    <button type="button" onClick={signOut}>Sign out</button>
                  </>
                ) : (
                  <>
                    <p className="account-greeting">Welcome to Urbanova</p>
                    <Link href="/login" onClick={closeMenus}>Sign in</Link>
                    <Link href="/register" onClick={closeMenus}>Create an account</Link>
                    {sessionError && <p className="account-session-error" role="status">{sessionError}</p>}
                  </>
                )}
              </div>}
            </div>
            <Link
              className="nav-action nav-cart"
              href="/cart"
              aria-label={cartError ? "Shopping cart; unable to load item count" : `Shopping cart${cartCount === null ? "" : `, ${cartCount} items`}`}
              title={cartError || undefined}
              onClick={closeMenus}
            >
              <span className="nav-action-icon"><ShoppingBag size={23} strokeWidth={1.7} /></span>
              <span className="nav-action-label">Cart</span>
              {cartCount !== null && cartCount > 0 && <span className="nav-action-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>

        <button
          className="menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen(!menuOpen);
            setActiveMenu(null);
          }}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>
    </header>
  );
}

function MegaMenu({ name, closeMenus }: { name: MenuName; closeMenus: () => void }) {
  const content = menuContent[name];
  return (
    <div className="mega-menu">
      <Link className="mega-feature" href={content.href} onClick={closeMenus}>
        <Image src={content.image} alt="" fill sizes="260px" />
        <span className="mega-feature-shade" />
        <span className="mega-feature-copy">
          <strong>{name === "Men" ? "Men's Collection" : name === "Women" ? "Women's Collection" : name}</strong>
          <small>{content.subtitle}</small>
          <span className="mega-feature-cta">Shop {name} <ArrowRight size={15} /></span>
        </span>
      </Link>

      <div className="mega-columns">
        {content.columns.map((column) => (
          <div className="mega-column" key={column.title}>
            <strong>{column.title}</strong>
            {column.links.map((label) => (
              <Link href={content.href} key={label} onClick={closeMenus}>{label}</Link>
            ))}
          </div>
        ))}
      </div>

      <div className="mega-cards">
        {content.cards.map((card) => (
          <Link className="mega-card" href={card.href} key={card.title} onClick={closeMenus}>
            <Image src={card.image} alt="" fill sizes="(max-width: 850px) 30vw, 170px" />
            <span className="mega-card-shade" />
            <span className="mega-card-copy">
              <strong>{card.title}</strong>
              <small>{card.subtitle}</small>
              <span>Shop now <ArrowRight size={13} /></span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
