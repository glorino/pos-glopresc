import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#2a2a3a] bg-[#0c0c14]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a843] to-[#c49a38]">
                <span className="text-sm font-bold text-black">G</span>
              </div>
              <span className="text-lg font-bold text-[#f0f0f5]">
                SSV Shop
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#9090a0]">
              The complete POS system for SSV Shop. Manage sales, inventory,
              customers, and finances with confidence.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#606070]">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-[#9090a0]">
              <li>
                <Link href="/features" className="hover:text-[#f0f0f5]">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-[#f0f0f5]">
                  Shop
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#606070]">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-[#9090a0]">
              <li>
                <Link href="/about" className="hover:text-[#f0f0f5]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="hover:text-[#f0f0f5]">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#606070]">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-[#9090a0]">
              <li>support@ssvshop.com</li>
              <li>Worldwide</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-[#2a2a3a] pt-8 text-center text-xs text-[#606070]">
          &copy; {new Date().getFullYear()} SSV Shop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
