"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProductionPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const charger = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("commandes")
      .select("*")
      .in("statut", ["En production", "Prêt", "En attente"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setCommandes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const changerStatut = async (id: string, nouveauStatut: string) => {
    await supabase
      .from("commandes")
      .update({ statut: nouveauStatut })
      .eq("id", id);
    charger();
  };

  const getPriorite = (statut: string) => {
    if (statut === "Prêt") return { label: "Haute", style: "bg-red-100 text-red-700" };
    if (statut === "En production") return { label: "Normale", style: "bg-blue-100 text-blue-700" };
    return { label: "Basse", style: "bg-gray-100 text-gray-600" };
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <h2 className="text-lg font-semibold text-gray-800">Production</h2>
      </header>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : commandes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune commande en production pour le moment
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">N° Commande</th>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium">Produit</th>
                  <th className="text-left px-5 py-3 font-medium">Quantité</th>
                  <th className="text-left px-5 py-3 font-medium">Étape</th>
                  <th className="text-left px-5 py-3 font-medium">Priorité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commandes.map((cmd) => {
                  const priorite = getPriorite(cmd.statut);
                  return (
                    <tr key={cmd.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium">{cmd.numero}</td>
                      <td className="px-5 py-3">{cmd.client}</td>
                      <td className="px-5 py-3">{cmd.produit}</td>
                      <td className="px-5 py-3">{cmd.quantite}</td>
                      <td className="px-5 py-3">
                        <select
                          value={cmd.statut}
                          onChange={(e) => changerStatut(cmd.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                        >
                          <option value="En attente">En attente</option>
                          <option value="En production">En production</option>
                          <option value="Prêt">Prêt</option>
                          <option value="Terminée">Terminée</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorite.style}`}>
                          {priorite.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}