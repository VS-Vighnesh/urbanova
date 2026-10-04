import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark">u</span><span>urbanova<span className="brand-period">.</span></span>
          </Link>
          <p>Considered goods for everyday living.</p>
        </div>
        <div className="footer-links">
          <Link href="/shop">Shop</Link>
          <Link href="/sale">Sale</Link>
          <Link href="/support">Support</Link>
          <Link href="/orders">Track an order</Link>
          <Link href="/register">Create an account</Link>
        </div>
        <small>© {new Date().getFullYear()} Urbanova. Made for better everyday.</small>
      </div>
    </footer>
  );
}
