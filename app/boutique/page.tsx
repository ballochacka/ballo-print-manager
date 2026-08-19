"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    commandesJour: 0,
    ca: 0,
    alertesStock: 0,
    enProduction: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      const today = new Date().toISOString().slice(0, 10);

      const { data: commandes } = await supabase.from("commandes").select("*");
      const { data: stocks } = await supabase.from("stocks").select("*");

      let ca = 0;
      let commandesJour = 0;
      let enProduction = 0;

      (commandes || []).forEach((c) => {
        const vente =
          parseFloat(
            (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
          ) || 0;
        ca += vente;

        if (c.created_at && c.created_at.startsWith(today)) {
          commandesJour += 1;
        }
        if (c.statut === "En production") enProduction += 1;
      });

      const alertesStock = (stocks || []).filter(
        (s) => (s.quantite || 0) <= (s.seuil || 5)
      ).length;

      setStats({ commandesJour, ca, alertesStock, enProduction });
      setLoading(false);
    }

    charger();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Bandeau haut style imprimerie */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.25),_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.2),_transparent_45%)]"></div>

        <div className="relative px-4 md:px-8 pt-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-purple-300 text-sm font-medium tracking-wide uppercase">
                Atelier d’impression
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-1">
                Ballo Print Manager
              </h1>
              <p className="text-slate-300 mt-2 max-w-xl">
                Tableau de bord de votre imprimerie — commandes, stocks,
                personnalisation et production en un seul endroit.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/commandes"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                + Nouvelle commande
              </Link>
              <Link
                href="/rapports"
                className="bg-white/10 hover:bg-white/15 border border-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Voir rapports
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-10 space-y-8">
        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl shadow-blue-900/30 border border-white/10">
            <p className="text-blue-100 text-sm">Commandes du jour</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? "..." : stats.commandesJour}
            </p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl shadow-emerald-900/30 border border-white/10">
            <p className="text-emerald-100 text-sm">Chiffre d’affaires</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? "..." : `${stats.ca.toLocaleString("fr-FR")} FCFA`}
            </p>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-900/30 border border-white/10">
            <p className="text-orange-100 text-sm">Alertes stock</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? "..." : stats.alertesStock}
            </p>
            <Link href="/stocks" className="text-xs text-orange-100 underline mt-2 inline-block">
              Voir les stocks
            </Link>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-purple-900/30 border border-white/10">
            <p className="text-violet-100 text-sm">En production</p>
            <p className="text-3xl font-bold mt-2">
              {loading ? "..." : stats.enProduction}
            </p>
          </div>
        </div>

        {/* Section ateliers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Link
            href="/maillots"
            className="group rounded-2xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur"
          >
            <div className="text-3xl mb-3">👕</div>
            <h3 className="text-lg font-semibold">Personnalisation Maillots</h3>
            <p className="text-sm text-slate-300 mt-1">
              Rank, vinyle, DTF — gérez vos personnalisations rapidement.
            </p>
          </Link>

          <Link
            href="/etiquettes"
            className="group rounded-2xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur"
          >
            <div className="text-3xl mb-3">🏷️</div>
            <h3 className="text-lg font-semibold">Étiquettes grand format</h3>
            <p className="text-sm text-slate-300 mt-1">
              Calcul automatique au m² pour vos commandes d’étiquettes.
            </p>
          </Link>

          <Link
            href="/wifi"
            className="group rounded-2xl p-6 bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur"
          >
            <div className="text-3xl mb-3">📶</div>
            <h3 className="text-lg font-semibold">WiFi Zone</h3>
            <p className="text-sm text-slate-300 mt-1">
              Ventes de forfaits heure, jour et mois.
            </p>
          </Link>
        </div>

        {/* Accès rapide */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold mb-4">Accès rapide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/commandes" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Commandes
            </Link>
            <Link href="/clients" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Clients
            </Link>
            <Link href="/stocks" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Stocks
            </Link>
            <Link href="/formation" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Formation
            </Link>
            <Link href="/facturation" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Facturation
            </Link>
            <Link href="/production" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Production
            </Link>
            <Link href="/rapports" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Rapports
            </Link>
            <Link href="/boutique" className="rounded-xl bg-slate-800/80 hover:bg-slate-700 px-4 py-3 text-sm text-center border border-white/5">
              Boutique
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}