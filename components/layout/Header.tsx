import Link from "next/link";
import { PackageCheck } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products/new", label: "建立商品企劃" },
  { href: "/products/arc-snap-power-bank/report", label: "Demo 報告" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/92 backdrop-blur">
      <div className="page-shell flex min-h-16 flex-col items-stretch justify-center gap-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white">
            <PackageCheck size={18} aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">PAQ Product Launch OS</span>
          <span className="sm:hidden">PAQ Launch</span>
        </Link>
        <nav className="flex w-full items-center justify-between gap-1 overflow-x-auto sm:w-auto sm:justify-start">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className="min-h-10 whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium text-graphite transition hover:bg-mist hover:text-ink sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
