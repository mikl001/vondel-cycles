import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminContext } from "@/lib/admin/guard";

import "../../globals.css";

export const metadata: Metadata = {
  title: { default: "Back-office | Vondel Cycles", template: "%s | VC Admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/nl/login");

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-screen flex-col bg-vondel-50">
        <header className="border-b border-vondel-200 bg-vondel-950 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="font-semibold">
              Vondel Cycles <span className="text-vondel-400">/ back-office</span>
            </span>
            <span className="text-sm text-vondel-300">{ctx.email}</span>
          </div>
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm text-vondel-200 transition-colors hover:bg-vondel-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/nl"
              className="ml-auto rounded-lg px-3 py-1.5 text-sm text-vondel-400 hover:text-white"
            >
              ← Storefront
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
