import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h3 className="text-xl font-bold mb-3">URBANOVA</h3>
          <p className="text-gray-400 text-sm">Style that moves with you.</p>
          <div className="mt-4 space-y-2">
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>Support:</span>
              <a href="mailto:holahoal3311@gmail.com" className="hover:text-white transition-colors">holahoal3311@gmail.com</a>
            </p>
            <p className="text-gray-400 text-sm">
              Applications: <a href="mailto:holahoal3311@gmail.com?subject=Job%20application" className="hover:text-white transition-colors">holahoal3311@gmail.com</a>
            </p>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-semibold mb-3">Shop</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <Link href="/men" className="block hover:text-white">Men</Link>
            <Link href="/women" className="block hover:text-white">Women</Link>
            <Link href="/accessories" className="block hover:text-white">Accessories</Link>
            <Link href="/new-arrivals" className="block hover:text-white">New Arrivals</Link>
            <Link href="/sale" className="block hover:text-white">Sale</Link>
          </div>
        </div>

        {/* Help */}
        <div>
          <h4 className="font-semibold mb-3">Help</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <Link href="/support" className="block hover:text-white">Contact Us</Link>
            <Link href="/orders" className="block hover:text-white">Track Order</Link>
            <Link href="/support" className="block hover:text-white">Returns & Exchanges</Link>
            <Link href="/support" className="block hover:text-white">FAQs</Link>
            <a href="mailto:holahoal3311@gmail.com" className="block hover:text-white">Email Support</a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <Link href="/careers" className="block hover:text-white">Careers</Link>
            <Link href="/support" className="block hover:text-white">About Us</Link>
            <Link href="/support" className="block hover:text-white">Privacy Policy</Link>
            <Link href="/support" className="block hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Urbanova. All rights reserved.</p>
          <p>
            Support: <a href="mailto:holahoal3311@gmail.com" className="text-gray-400 hover:text-white">holahoal3311@gmail.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
