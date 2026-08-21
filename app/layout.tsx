"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
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

  const chargerNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12);
    setNotifications(data || []);
  };

  useEffect(() => {
    if (pathname === "/login" || pathname === "/boutique") return;
    chargerNotifications();
    const interval = setInterval(chargerNotifications, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const nonLues = notifications.filter((n) => !n.lu).length;

  const marquerLues = async () => {
    await supabase.from("notifications").update({ lu: true }).eq("lu", false);
    chargerNotifications();
  };

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
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="fr">
        <body>
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white" }}>
            Chargement...
          </div>
        </body>
      </html>
    );
  }

  const linkStyle = (path: string): React.CSSProperties => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 14,
    marginBottom: 4,
    background: pathname === path ? "#7c3aed" : "transparent",
    color: pathname === path ? "white" : "#cbd5e1",
  });

  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body style={{ margin: 0, background: "#0f172a", color: "#e2e8f0" }}>
        <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
          {menuOpen && (
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
          )}

          <aside style={{
            width: 260,
            background: "#020617",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 50,
            transform: menuOpen ? "translateX(0)" : undefined,
          }} className="sidebar">
            <div style={{ padding: 18, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  B
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Ballo Print</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Manager</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 18, display: "pointer" }} className="close-mobile">
                ✕
              </button>
            </div>

            <nav style={{ padding: 12, flex: 1, overflowY: "auto" }}>
              <Link href="/" style={linkStyle("/")}>Tableau de bord</Link>
              <Link href="/commandes" style={linkStyle("/commandes")}>Commandes</Link>
              <Link href="/stocks" style={linkStyle("/stocks")}>Stocks</Link>
              <Link href="/clients" style={linkStyle("/clients")}>Clients</Link>
              <Link href="/maillots" style={linkStyle("/maillots")}>Maillots</Link>
              <Link href="/etiquettes" style={linkStyle("/etiquettes")}>Étiquettes</Link>
              <Link href="/wifi" style={linkStyle("/wifi")}>WiFi Zone</Link>
              <Link href="/formation" style={linkStyle("/formation")}>Formation</Link>
              <Link href="/production" style={linkStyle("/production")}>Production</Link>
              <Link href="/facturation" style={linkStyle("/facturation")}>Facturation</Link>
              <Link href="/rapports" style={linkStyle("/rapports")}>Rapports</Link>
              <Link href="/boutique" style={linkStyle("/boutique")}>Boutique</Link>
           <Link href="/depenses" style={linkStyle("/depenses")}>Dépenses</Link>
            </nav>

            <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={handleLogout} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#f87171", padding: 10, borderRadius: 8, cursor: "pointer" }}>
                Déconnexion
              </button>
            </div>
          </aside>

          <main style={{ flex: 1, marginLeft: 260, minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #3b0764, #0f172a)" }} className="main-content">
            <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", background: "linear-gradient(90deg,#7c3aed,#2563eb)", position: "relative" }}>
              <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer" }} className="open-mobile">
                ☰
              </button>

              <div style={{ marginLeft: "auto", position: "relative" }}>
                <button
                  onClick={() => {
                    setShowNotif(!showNotif);
                    if (!showNotif) marquerLues();
                  }}
                  style={{ background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer", position: "relative" }}
                >
                  🔔
                  {nonLues > 0 && (
                    <span style={{ position: "absolute", top: -6, right: -8, background: "#ef4444", color: "white", fontSize: 10, borderRadius: 999, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {nonLues}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <div style={{ position: "absolute", right: 0, top: 36, width: 320, background: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", zIndex: 60 }}>
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600 }}>
                      Notifications
                    </div>
                    <div style={{ maxHeight: 320, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <p style={{ padding: 14, color: "#94a3b8", fontSize: 13 }}>Aucune notification</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{n.titre}</div>
                            <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>{n.message}</div>
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                              {new Date(n.created_at).toLocaleString("fr-FR")}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {children}
          </main>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-110%);
            }
            .sidebar[style*="translateX(0)"],
            .sidebar.open {
              transform: translateX(0) !important;
            }
            .main-content {
              margin-left: 0 !important;
            }
          }
          @media (min-width: 769px) {
            .open-mobile, .close-mobile {
              display: none !important;
            }
          }
        `}</style>
      </body>
    </html>
  );
}