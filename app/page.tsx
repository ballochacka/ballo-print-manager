"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const [stats, setStats] = useState({
    commandesJour: 0,
    chiffreAffaires: 0,
    alertesStock: 0,
    enProduction: 0,
  });
  const [commandesRecentes, setCommandesRecentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      setLoading(true);

      const { data: commandes } = await supabase
        .from("commandes")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: stocks } = await supabase.from("stocks").select("*");

      const aujourdhui = new Date().toDateString();

      const commandesDuJour = (commandes || []).filter(
        (c) => new Date(c.created_at).toDateString() === aujourdhui
      );

      const chiffre = (commandes || []).reduce((total, c) => {
        const montant = parseFloat(
          (c.montant || "0").replace(/[^\d.,]/g, "").replace(",", ".")
        ) || 0;
        return total + montant;
      }, 0);

      const alertes = (stocks || []).filter((s) => s.quantite <= s.seuil).length;

      const enProd = (commandes || []).filter(
        (c) => c.statut === "En production" || c.statut === "Prêt"
      ).length;

      setStats({
        commandesJour: commandesDuJour.length,
        chiffreAffaires: chiffre,
        alertesStock: alertes,
        enProduction: enProd,
      });

      setCommandesRecentes((commandes || []).slice(0, 5));
      setLoading(false);
    }

    charger();
  }, []);

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Tableau de bord</h2>
        <div className="text-sm text-gray-500">Ballo Print Manager</div>
      </header>

      <div className="p-6">
        {/* Cartes colorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-sm text-blue-100 mb-1">Commandes du jour</p>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.commandesJour}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-sm text-emerald-100 mb-1">Chiffre d'affaires</p>
            <p className="text-2xl font-bold">
              {loading ? "..." : `${stats.chiffreAffaires.toLocaleString("fr-FR")} FCFA`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-sm text-orange-100 mb-1">Alertes stock</p>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.alertesStock}
            </p>
            <Link href="/stocks" className="text-xs text-orange-100 hover:underline mt-1 inline-block">
              Voir les stocks →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-sm text-purple-100 mb-1">En production</p>
            <p className="text-3xl font-bold">
              {loading ? "..." : stats.enProduction}
            </p>
          </div>
        </div>

        {/* Commandes récentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Commandes récentes</h3>
            <Link href="/commandes" className="text-sm text-purple-600 hover:underline">
              Voir toutes →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : commandesRecentes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune commande</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium">Produit</th>
                  <th className="text-left px-5 py-3 font-medium">Qté</th>
                  <th className="text-left px-5 py-3 font-medium">Statut</th>
                  <th className="text-left px-5 py-3 font-medium">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandesRecentes.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{cmd.client}</td>
                    <td className="px-5 py-3">{cmd.produit}</td>
                    <td className="px-5 py-3">{cmd.quantite}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {cmd.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{cmd.montant}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}