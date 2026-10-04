import Link from "next/link";
import { CreditCard, ShieldCheck, Tag, Truck } from "lucide-react";

const benefits = [
  { icon: Tag, title: "Big discounts", text: "Up to 50% off" },
  { icon: Truck, title: "Free shipping", text: "On orders above ₹999" },
  { icon: ShieldCheck, title: "Easy returns", text: "7-day return policy" },
  { icon: CreditCard, title: "Secure payments", text: "Safe & secure checkout" },
];

export default function SaleHero() {
  return (
    <section className="sale-hero" aria-labelledby="sale-title">
      <div className="sale-hero-photo sale-hero-men" />
      <div className="sale-hero-photo sale-hero-women" />
      <div className="sale-hero-shade" />
      <div className="sale-hero-copy">
        <span className="sale-brand">URBANOVA</span>
        <p className="sale-kicker">The good things sale</p>
        <h1 id="sale-title">Sale<br />collection</h1>
        <strong>Up to 50% off</strong>
        <p>Premium style. Better value.</p>
        <Link href="/sale#sale-products" className="sale-cta">Shop now <span aria-hidden="true">→</span></Link>
      </div>
      <div className="sale-benefits">
        {benefits.map(({ icon: Icon, title, text }) => (
          <div className="sale-benefit" key={title}>
            <Icon size={21} strokeWidth={1.7} />
            <span><strong>{title}</strong><small>{text}</small></span>
          </div>
        ))}
      </div>
      <p className="sale-side-note">Style more.<br /><em>Spend less.</em></p>
    </section>
  );
}
