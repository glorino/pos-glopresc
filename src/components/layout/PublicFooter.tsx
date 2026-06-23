import Link from "next/link";
import Image from "next/image";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#2a2a3a] bg-[#0c0c14]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/favicon.svg" alt="SSV Shop" width={32} height={32} className="h-8 w-8" />
              <span className="text-lg font-bold text-[#f0f0f5]">
                SSV Shop
              </span>
            </Link>
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
