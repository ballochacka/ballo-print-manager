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
  const [menuOpen, setMenuOpen] = useState(false);
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

  // Ferme le menu quand on change de page
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (pathname === "/login") {
    return (
      <html lang="fr">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#7c3aed" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="fr">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#7c3aed" />
        </head>
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased bg-slate-100">
        <div className="flex h-screen relative">
          
          {/* Overlay sombre sur mobile quand le menu est ouvert */}
          {menuOpen && (
            <div 
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed md:static inset-y-0 left-0 z-50
            w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm
            transform transition-transform duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  B
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-800">Ballo Print</h1>
                  <p className="text-[10px] text-gray-400">Manager</p>
                </div>
              </div>
              {/* Bouton fermer sur mobile */}
              <button 
                onClick={() => setMenuOpen(false)}
                className="md:hidden text-gray-500 text-xl"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
              <Link href="/formation" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                 Formation
              </Link>
              <Link href="/maillots" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                 Maillots
              </Link>
              <Link href="/facturation" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Facturation
              </Link>
              <Link href="/rapports" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
                Rapports
              </Link>
              <Link href="/etiquettes" className="block px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition">
  Étiquettes
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

          {/* Contenu principal */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 w-full">
            {/* Barre du haut avec bouton menu sur mobile */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-12 md:h-2 flex items-center px-4 md:px-0">
              <button 
                onClick={() => setMenuOpen(true)}
                className="md:hidden text-white text-2xl"
              >
                ☰
              </button>
            </div>
            
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}