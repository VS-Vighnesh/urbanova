"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/men", label: "Men", image: "/images/hero/men.jpg" },
  { href: "/women", label: "Women", image: "/images/hero/women.jpg" },
  { href: "/accessories", label: "Accessories", image: "/images/hero/accessories.jpg" },
  { href: "/best-sellers", label: "Best sellers", image: "/images/hero/best-sellers.jpg" },
  { href: "/new-arrivals", label: "New arrivals" },
  { href: "/sale", label: "Sale" },
  { href: "/support", label: "Support" },
  { href: "/orders", label: "My orders" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { slugs } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  function signOut() {
    logout();
    router.push("/");
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="announcement">Thoughtful things, delivered with care · Free shipping on orders ₹999+</div>
      <nav className="nav-wrap" aria-label="Main navigation">
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">u</span>
          <span>urbanova<span className="brand-period">.</span></span>
        </Link>
        <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              className={pathname.startsWith(link.href) ? "nav-link active" : "nav-link"}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.image && <span className="nav-category-image"><Image src={link.image} alt="" fill sizes="32px" /></span>}
              {link.label}
            </Link>
          ))}
          {user?.role && ["ADMIN", "MANAGER"].includes(user.role.toUpperCase()) && (
            <Link className="nav-link" href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
          )}
          {user ? (
            <button className="nav-link nav-button" onClick={signOut}>Sign out</button>
          ) : (
            <Link className="nav-link" href="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
          )}
        </div>
        <div className="nav-actions">
          <Link className="wishlist-link" href="/wishlist" aria-label={`Wishlist, ${slugs.length} saved items`}>
            <Heart size={18} strokeWidth={1.7} /><span className="nav-count">{slugs.length}</span>
          </Link>
          <Link className="cart-link" href="/cart" aria-label="Shopping bag">
            <ShoppingBag size={19} strokeWidth={1.7} />
            <span>Bag</span>
          </Link>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
