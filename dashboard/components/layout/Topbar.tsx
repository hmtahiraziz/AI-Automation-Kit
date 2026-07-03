"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNav = [
  { href: "/", label: "Overview" },
  { href: "/workflows", label: "Workflows" },
  { href: "/executions", label: "Executions" },
  { href: "/credentials", label: "Credentials" },
  { href: "/settings", label: "Settings" },
];

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/95 backdrop-blur md:hidden">
      <nav className="flex gap-2 overflow-x-auto px-4 py-2">
        {mobileNav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                  ? "bg-[#E4F3EC] text-[#0E7C5C]"
                  : "bg-[#F3F4F2] text-gray-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
