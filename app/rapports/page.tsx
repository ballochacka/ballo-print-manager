"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    commandesCA: 0,
    commandesAchat: 0,
    commandesBenefice: 0,
    commandesNb: 0,
    maillotsCA: 0,
    maillotsAchat: 0,
    maillotsBenefice: 0,
    maillotsNb: 0,
    formationsCA: 0,
    formationsNb: 0,
    etiquettesCA: 0,
    etiquettesNb: 0,
  });
  const [evolution, setEvolution] = useState<{ jour: string; benefice: number }[]>([]);

  useEffect(() => {
    async function charger() {
      setLoading(true);

      const { data: commandes } = await supabase.from("commandes").select("*");
      const { data: maillots } = await supabase.from("maillots").select("*");
      const { data: eleves } = await supabase.from("eleves").select("*");
      const { data: etiquettes } = await supabase.from("etiquettes").select("*");

      let commandesCA = 0;
      let commandesAchat = 0;
      (commandes || []).forEach((c) => {
        const vente =
          parseFloat(
            (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
          ) || 0;
        commandesCA += vente;
        commandesAchat += c.prix_achat || 0;
      });

      let maillotsCA = 0;
      let maillotsAchat = 0;
      (maillots || []).forEach((m) => {
        maillotsCA += m.total || 0;
        maillotsAchat += (m.prix_maillot || 0) * (m.quantite || 1);
      });

      let formationsCA = 0;
      (eleves || []).forEach((e) => {
        formationsCA += e.total_paye || 0;
      });

      let etiquettesCA = 0;
      (etiquettes || []).forEach((e) => {
        etiquettesCA += e.total || 0;
      });

      // ===== Évolution par jour =====
      const map: Record<string, number> = {};

      const ajouterJour = (dateStr: string | null, montant: number) => {
        if (!dateStr || !montant) return;
        const jour = new Date(dateStr).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
        map[jour] = (map[jour] || 0) + montant;
      };

      (commandes || []).forEach((c) => {
        const vente =
          parseFloat(
            (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
          ) || 0;
        const benef = vente - (c.prix_achat || 0);
        ajouterJour(c.created_at, benef);
      });

      (maillots || []).forEach((m) => {
        const benef = (m.total || 0) - (m.prix_maillot || 0) * (m.quantite || 1);
        ajouterJour(m.created_at, benef);
      });

      (eleves || []).forEach((e) => {
        ajouterJour(e.created_at, e.total_paye || 0);
      });

      (etiquettes || []).forEach((e) => {
        ajouterJour(e.created_at, e.total || 0);
      });

      const evo = Object.entries(map)
        .map(([jour, benefice]) => ({ jour, benefice }))
        .slice(-7); // 7 derniers jours

      setStats({
        commandesCA,
        commandesAchat,
        commandesBenefice: commandesCA - commandesAchat,
        commandesNb: commandes?.length || 0,
        maillotsCA,
        maillotsAchat,
        maillotsBenefice: maillotsCA - maillotsAchat,
        maillotsNb: maillots?.length || 0,
        formationsCA,
        formationsNb: eleves?.length || 0,
        etiquettesCA,
        etiquettesNb: etiquettes?.length || 0,
      });
      setEvolution(evo);
      setLoading(false);
    }

    charger();
  }, []);

  const totalCA =
    stats.commandesCA + stats.maillotsCA + stats.formationsCA + stats.etiquettesCA;
  const totalAchat = stats.commandesAchat + stats.maillotsAchat;
  const totalBenefice =
    stats.commandesBenefice +
    stats.maillotsBenefice +
    stats.formationsCA +
    stats.etiquettesCA;

  const maxBenef = Math.max(...evolution.map((e) => Math.abs(e.benefice)), 1);

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <h2 className="text-lg font-semibold text-gray-800">Rapports</h2>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Chargement...</div>
        ) : (
          <>
            {/* Totaux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-sm text-blue-100">Chiffre d'affaires total</p>
                <p className="text-2xl font-bold mt-1">
                  {totalCA.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-sm text-orange-100">Total des achats</p>
                <p className="text-2xl font-bold mt-1">
                  {totalAchat.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-sm text-emerald-100">Bénéfice total</p>
                <p className="text-2xl font-bold mt-1">
                  {totalBenefice.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            {/* Graphique */}
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-1">Évolution des bénéfices</h3>
              <p className="text-xs text-gray-400 mb-6">7 derniers jours d’activité</p>

              {evolution.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">
                  Pas encore assez de données pour le graphique
                </p>
              ) : (
                <div className="flex items-end justify-between gap-3 h-48">
                  {evolution.map((item, index) => {
                    const height = Math.max((Math.abs(item.benefice) / maxBenef) * 100, 8);
                    const isPositif = item.benefice >= 0;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-600">
                          {item.benefice.toLocaleString()}
                        </span>
                        <div className="w-full flex items-end justify-center h-36">
                          <div
                            className={`w-full max-w-[40px] rounded-t-xl transition-all duration-500 ${
                              isPositif
                                ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                                : "bg-gradient-to-t from-red-500 to-red-400"
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {item.jour}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  Bénéfice
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Perte
                </div>
              </div>
            </div>

            {/* Détail par activité */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Commandes</h3>
                <p className="text-sm text-gray-500">Nombre : {stats.commandesNb}</p>
                <p className="text-sm mt-2">CA : <span className="font-bold text-blue-600">{stats.commandesCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Achats : <span className="font-bold text-orange-600">{stats.commandesAchat.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.commandesBenefice.toLocaleString()} FCFA</span></p>
              </div>

              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Maillots</h3>
                <p className="text-sm text-gray-500">Nombre : {stats.maillotsNb}</p>
                <p className="text-sm mt-2">CA : <span className="font-bold text-blue-600">{stats.maillotsCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Achats : <span className="font-bold text-orange-600">{stats.maillotsAchat.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.maillotsBenefice.toLocaleString()} FCFA</span></p>
              </div>

              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Formations</h3>
                <p className="text-sm text-gray-500">Élèves : {stats.formationsNb}</p>
                <p className="text-sm mt-2">Encaissé : <span className="font-bold text-blue-600">{stats.formationsCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.formationsCA.toLocaleString()} FCFA</span></p>
              </div>

              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Étiquettes</h3>
                <p className="text-sm text-gray-500">Commandes : {stats.etiquettesNb}</p>
                <p className="text-sm mt-2">CA : <span className="font-bold text-blue-600">{stats.etiquettesCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.etiquettesCA.toLocaleString()} FCFA</span></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}