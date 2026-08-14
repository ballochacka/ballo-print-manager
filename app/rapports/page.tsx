"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RapportsPage() {
  const [stats, setStats] = useState({
    totalCommandes: 0,
    chiffreAffaires: 0,
    commandesTerminees: 0,
    alertesStock: 0,
  });
  const [topProduits, setTopProduits] = useState<{ nom: string; quantite: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function charger() {
      setLoading(true);

      const { data: commandes } = await supabase.from("commandes").select("*");
      const { data: stocks } = await supabase.from("stocks").select("*");

      const totalCommandes = commandes?.length || 0;

      const chiffreAffaires = (commandes || []).reduce((total, c) => {
        const montant = parseFloat(
          (c.montant || "0").replace(/[^\d.,]/g, "").replace(",", ".")
        ) || 0;
        return total + montant;
      }, 0);

      const commandesTerminees = (commandes || []).filter(
        (c) => c.statut === "Terminée" || c.statut === "Prêt"
      ).length;

      const alertesStock = (stocks || []).filter((s) => s.quantite <= s.seuil).length;

      // Top produits
      const produitsCount: Record<string, number> = {};
      (commandes || []).forEach((c) => {
        if (c.produit) {
          produitsCount[c.produit] = (produitsCount[c.produit] || 0) + (c.quantite || 1);
        }
      });

      const top = Object.entries(produitsCount)
        .map(([nom, quantite]) => ({ nom, quantite }))
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 5);

      setStats({
        totalCommandes,
        chiffreAffaires,
        commandesTerminees,
        alertesStock,
      });
      setTopProduits(top);
      setLoading(false);
    }

    charger();
  }, []);

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <h2 className="text-lg font-semibold text-gray-800">Rapports</h2>
      </header>

      <div className="p-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Total commandes</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "..." : stats.totalCommandes}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Chiffre d'affaires</p>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? "..." : `${stats.chiffreAffaires.toLocaleString("fr-FR")} FCFA`}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Commandes terminées</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? "..." : stats.commandesTerminees}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-xs text-gray-500 mb-1">Alertes stock</p>
            <p className="text-2xl font-bold text-orange-500">
              {loading ? "..." : stats.alertesStock}
            </p>
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Produits les plus vendus</h3>

          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : topProduits.length === 0 ? (
            <p className="text-gray-500">Aucune donnée pour le moment</p>
          ) : (
            <div className="space-y-3">
              {topProduits.map((p, index) => (
                <div key={p.nom} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>{p.nom}</span>
                  </div>
                  <span className="font-medium">{p.quantite} vendus</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}