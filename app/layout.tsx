"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);

      if (!session && pathname !== "/login") {
        router.push("/login");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session && pathname !== "/login") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Page de login → on affiche sans le menu
  if (pathname === "/login") {
    return (
      <html lang="fr">
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="fr">
        <body>
          <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <p className="text-gray-500">Chargement...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body className="antialiased bg-slate-100">
        <div className="flex h-screen">
          {/* Sidebar */}
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
              <Link href="/" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Tableau de bord
              </Link>
              <Link href="/commandes" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Commandes
              </Link>
              <Link href="/calculateur" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Calculateur
              </Link>
              <Link href="/stocks" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Stocks
              </Link>
              <Link href="/clients" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Clients
              </Link>
              <Link href="/production" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Production
              </Link>
              <Link href="/facturation" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Facturation
              </Link>
              <Link href="/rapports" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Rapports
              </Link>
            </nav>

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Déconnexion
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-2"></div>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}