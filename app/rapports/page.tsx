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

  useEffect(() => {
    async function charger() {
      setLoading(true);

      // ===== COMMANDES =====
      const { data: commandes } = await supabase.from("commandes").select("*");
      let commandesCA = 0;
      let commandesAchat = 0;
      (commandes || []).forEach((c) => {
        const vente =
          parseFloat(
            (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
          ) || 0;
        const achat = c.prix_achat || 0;
        commandesCA += vente;
        commandesAchat += achat;
      });
      const commandesBenefice = commandesCA - commandesAchat;

      // ===== MAILLOTS =====
      const { data: maillots } = await supabase.from("maillots").select("*");
      let maillotsCA = 0;
      let maillotsAchat = 0;
      (maillots || []).forEach((m) => {
        maillotsCA += m.total || 0;
        maillotsAchat += (m.prix_maillot || 0) * (m.quantite || 1);
      });
      const maillotsBenefice = maillotsCA - maillotsAchat;

      // ===== FORMATIONS =====
      const { data: eleves } = await supabase.from("eleves").select("*");
      let formationsCA = 0;
      (eleves || []).forEach((e) => {
        formationsCA += e.total_paye || 0;
      });

      // ===== ETIQUETTES =====
      const { data: etiquettes } = await supabase.from("etiquettes").select("*");
      let etiquettesCA = 0;
      (etiquettes || []).forEach((e) => {
        etiquettesCA += e.total || 0;
      });

      setStats({
        commandesCA,
        commandesAchat,
        commandesBenefice,
        commandesNb: commandes?.length || 0,
        maillotsCA,
        maillotsAchat,
        maillotsBenefice,
        maillotsNb: maillots?.length || 0,
        formationsCA,
        formationsNb: eleves?.length || 0,
        etiquettesCA,
        etiquettesNb: etiquettes?.length || 0,
      });

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
            {/* Totaux généraux */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
                <p className="text-sm text-blue-100">Chiffre d'affaires total</p>
                <p className="text-2xl font-bold mt-1">
                  {totalCA.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white">
                <p className="text-sm text-orange-100">Total des achats</p>
                <p className="text-2xl font-bold mt-1">
                  {totalAchat.toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
                <p className="text-sm text-emerald-100">Bénéfice total</p>
                <p className="text-2xl font-bold mt-1">
                  {totalBenefice.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            {/* Détail par activité */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Commandes */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Commandes</h3>
                <p className="text-sm text-gray-500">Nombre : {stats.commandesNb}</p>
                <p className="text-sm mt-2">CA : <span className="font-bold text-blue-600">{stats.commandesCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Achats : <span className="font-bold text-orange-600">{stats.commandesAchat.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.commandesBenefice.toLocaleString()} FCFA</span></p>
              </div>

              {/* Maillots */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Maillots</h3>
                <p className="text-sm text-gray-500">Nombre : {stats.maillotsNb}</p>
                <p className="text-sm mt-2">CA : <span className="font-bold text-blue-600">{stats.maillotsCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Achats : <span className="font-bold text-orange-600">{stats.maillotsAchat.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.maillotsBenefice.toLocaleString()} FCFA</span></p>
              </div>

              {/* Formations */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">Formations</h3>
                <p className="text-sm text-gray-500">Élèves : {stats.formationsNb}</p>
                <p className="text-sm mt-2">Encaissé : <span className="font-bold text-blue-600">{stats.formationsCA.toLocaleString()} FCFA</span></p>
                <p className="text-sm">Bénéfice : <span className="font-bold text-green-600">{stats.formationsCA.toLocaleString()} FCFA</span></p>
              </div>

              {/* Étiquettes */}
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