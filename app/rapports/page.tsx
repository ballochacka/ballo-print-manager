"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    commandesCA: 0,
    commandesNb: 0,
    maillotsCA: 0,
    maillotsCout: 0,
    maillotsBenefice: 0,
    maillotsNb: 0,
    formationsCA: 0,
    formationsNb: 0,
  });

  useEffect(() => {
    async function charger() {
      setLoading(true);

      // Commandes
      const { data: commandes } = await supabase.from("commandes").select("*");
      let commandesCA = 0;
      (commandes || []).forEach((c) => {
        const m = parseFloat(
          (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
        ) || 0;
        commandesCA += m;
      });

      // Maillots
      const { data: maillots } = await supabase.from("maillots").select("*");
      let maillotsCA = 0;
      let maillotsCout = 0;
      (maillots || []).forEach((m) => {
        maillotsCA += m.total || 0;
        // Coût = prix du maillot (quand tu le fournis)
        maillotsCout += (m.prix_maillot || 0) * (m.quantite || 1);
      });
      const maillotsBenefice = maillotsCA - maillotsCout;

      // Formations
      const { data: eleves } = await supabase.from("eleves").select("*");
      let formationsCA = 0;
      (eleves || []).forEach((e) => {
        formationsCA += e.total_paye || 0;
      });

      setStats({
        commandesCA,
        commandesNb: commandes?.length || 0,
        maillotsCA,
        maillotsCout,
        maillotsBenefice,
        maillotsNb: maillots?.length || 0,
        formationsCA,
        formationsNb: eleves?.length || 0,
      });

      setLoading(false);
    }

    charger();
  }, []);

  const totalCA = stats.commandesCA + stats.maillotsCA + stats.formationsCA;
  const totalBenefice = stats.commandesCA + stats.maillotsBenefice + stats.formationsCA;
  // Note: pour les commandes on n'a pas encore les coûts → on compte le CA comme bénéfice provisoire

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
            {/* Total général */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl p-6 text-white">
                <p className="text-sm text-purple-100">Chiffre d'affaires total</p>
                <p className="text-3xl font-bold mt-1">
                  {totalCA.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
                <p className="text-sm text-emerald-100">Bénéfice estimé</p>
                <p className="text-3xl font-bold mt-1">
                  {totalBenefice.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            {/* Détail par activité */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Commandes */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Commandes</h3>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-xl font-bold text-gray-900 mb-2">{stats.commandesNb}</p>
                <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                <p className="text-lg font-bold text-blue-600">
                  {stats.commandesCA.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  * Coûts non encore enregistrés
                </p>
              </div>

              {/* Maillots */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Maillots</h3>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="text-xl font-bold text-gray-900 mb-2">{stats.maillotsNb}</p>
                <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                <p className="text-lg font-bold text-purple-600">
                  {stats.maillotsCA.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-sm text-gray-500 mt-2">Coûts (maillots)</p>
                <p className="text-sm text-orange-600">
                  {stats.maillotsCout.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-sm text-gray-500 mt-2">Bénéfice</p>
                <p className="text-lg font-bold text-green-600">
                  {stats.maillotsBenefice.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              {/* Formations */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Formations</h3>
                <p className="text-sm text-gray-500">Nombre d'élèves</p>
                <p className="text-xl font-bold text-gray-900 mb-2">{stats.formationsNb}</p>
                <p className="text-sm text-gray-500">Total encaissé</p>
                <p className="text-lg font-bold text-emerald-600">
                  {stats.formationsCA.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  * Principalement bénéfice
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}