import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ballo Print Manager",
  description: "Gestion d'imprimerie et personnalisation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100`}>
        <div className="flex h-screen">
          
          {/* Sidebar blanche */}
          <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  B
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-800">Ballo Print</h1>
                  <p className="text-[10px] text-gray-400">Manager</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Tableau de bord
              </Link>
              <Link href="/commandes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Commandes
              </Link>
              <Link href="/calculateur" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Calculateur
              </Link>
              <Link href="/stocks" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Stocks
              </Link>
              <Link href="/clients" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Clients
              </Link>
              <Link href="/production" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Production
              </Link>
              <Link href="/facturation" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Facturation
              </Link>
              <Link href="/rapports" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Rapports
              </Link>
            </nav>
          </aside>

          {/* Contenu principal */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
            {/* Header violet/bleu */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-2"></div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}