// File: src/app/layout.tsx
import Link from "next/link";
import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-800">
        <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Deck to Cart
          </h1>
          <div className="space-x-6">
            <Link href="/" className="hover:text-indigo-100 transition-colors">
              Home
            </Link>
            <Link
              href="/deck-filter"
              className="hover:text-indigo-100 transition-colors"
            >
              Deck Filter
            </Link>
          </div>
        </nav>
        <main className="p-6 max-w-4xl mx-auto min-h-[40vh]">{children}</main>
      </body>
    </html>
  );
}
