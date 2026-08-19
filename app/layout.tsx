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
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoading(false);

      if (!session && pathname !== "/login" && pathname !== "/boutique") {
        router.push("/login");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/login" && pathname !== "/boutique") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (pathname === "/login" || pathname === "/boutique") {
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
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
            <p>Chargement...</p>
          </div>
        </body>
      </html>
    );
  }

  const linkClass = (path: string) =>
    `block px-3 py-2.5 rounded-lg text-sm transition ${
      pathname === path
        ? "bg-purple-600 text-white"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased bg-slate-900">
        <div className="flex h-screen relative">
          {menuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
          )}

          <aside
            className={`
              fixed md:static inset-y-0 left-0 z-50
              w-64 bg-slate-950 border-r border-white/10 flex flex-col
              transform transition-transform duration-300 ease-in-out
              ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  B
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Ballo Print</h1>
                  <p className="text-[10px] text-slate-400">Manager</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="md:hidden text-slate-400 text-xl">
                ✕
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <Link href="/" className={linkClass("/")}>Tableau de bord</Link>
              <Link href="/commandes" className={linkClass("/commandes")}>Commandes</Link>
              <Link href="/stocks" className={linkClass("/stocks")}>Stocks</Link>
              <Link href="/clients" className={linkClass("/clients")}>Clients</Link>
              <Link href="/maillots" className={linkClass("/maillots")}>Maillots</Link>
              <Link href="/etiquettes" className={linkClass("/etiquettes")}>Étiquettes</Link>
              <Link href="/wifi" className={linkClass("/wifi")}>WiFi Zone</Link>
              <Link href="/formation" className={linkClass("/formation")}>Formation</Link>
              <Link href="/production" className={linkClass("/production")}>Production</Link>
              <Link href="/facturation" className={linkClass("/facturation")}>Facturation</Link>
              <Link href="/rapports" className={linkClass("/rapports")}>Rapports</Link>
              <Link href="/boutique" className={linkClass("/boutique")}>Boutique</Link>
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                Déconnexion
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-auto w-full bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
            <div className="h-12 md:h-2 flex items-center px-4 bg-gradient-to-r from-purple-600 to-blue-500">
              <button onClick={() => setMenuOpen(true)} className="md:hidden text-white text-2xl">
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