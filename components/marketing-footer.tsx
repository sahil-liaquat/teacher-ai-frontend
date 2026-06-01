import Image from "next/image";
import Link from "next/link";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

const footerLinks = [
  { label: "Privacy Policy", href: LEGAL_LINKS.privacy },
  { label: "Terms of Service", href: LEGAL_LINKS.terms },
  { label: "Refunds", href: LEGAL_LINKS.refund },
  { label: "Contact", href: LEGAL_LINKS.contact },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer id="resources" className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Image
          src="/assets/teachpad-footer-logo-cropped.png"
          alt="TeachPad"
          width={1261}
          height={252}
          className="h-auto w-full max-w-6xl"
          priority={false}
        />
        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-slate-500 transition hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs font-semibold text-slate-400">
          © {year} {LEGAL.brand}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
