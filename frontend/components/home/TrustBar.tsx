// frontend/components/home/TrustBar.tsx
import { Truck, RefreshCcw, ShieldCheck, Headphones } from "lucide-react";

const ITEMS = [
  { icon: Truck, title: "Free Shipping", subtitle: "on orders above ₹999" },
  { icon: RefreshCcw, title: "Easy Returns", subtitle: "7-day return policy" },
  { icon: ShieldCheck, title: "Secure Payments", subtitle: "100% safe & secure" },
  { icon: Headphones, title: "24/7 Support", subtitle: "We're here to help" },
];

export default function TrustBar() {
  return (
    <section className="border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-3">
              <Icon size={20} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-400">{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
