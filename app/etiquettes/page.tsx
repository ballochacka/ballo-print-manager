"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EtiquettesPage() {
  const [etiquettes, setEtiquettes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    client: "",
    quantite: "1",
    largeur: "",
    hauteur: "",
    prix_unitaire: "",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("etiquettes")
      .select("*")
      .order("created_at", { ascending: false });
    setEtiquettes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const totalEstime =
    (Number(form.quantite) || 0) * (Number(form.prix_unitaire) || 0);

  const ajouter = async () => {
    if (!form.quantite || !form.prix_unitaire) {
      alert("Quantité et prix obligatoires");
      return;
    }

    const quantite = Number(form.quantite) || 1;
    const prix = Number(form.prix_unitaire) || 0;
    const total = quantite * prix;

    const { error } = await supabase.from("etiquettes").insert([
      {
        client: form.client || "Client",
        quantite,
        largeur: Number(form.largeur) || 0,
        hauteur: Number(form.hauteur) || 0,
        prix_unitaire: prix,
        total,
        statut: "En cours",
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({
      client: "",
      quantite: "1",
      largeur: "",
      hauteur: "",
      prix_unitaire: "",
    });
    setShowForm(false);
    setMessage("Étiquettes enregistrées");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("etiquettes").delete().eq("id", id);
    charger();
  };

  const changerStatut = async (id: string, statut: string) => {
    await supabase.from("etiquettes").update({ statut }).eq("id", id);
    charger();
  };

  return (
    <div>
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Étiquettes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nouvelle commande
        </button>
      </header>

      <div className="p-4 md:p-6">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Nouvelle commande d'étiquettes</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Nom du client"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Largeur (cm)"
                value={form.largeur}
                onChange={(e) => setForm({ ...form, largeur: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Hauteur (cm)"
                value={form.hauteur}
                onChange={(e) => setForm({ ...form, hauteur: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Prix unitaire (FCFA)"
                value={form.prix_unitaire}
                onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-3 text-sm text-purple-700 font-medium">
              Total estimé : {totalEstime.toLocaleString("fr-FR")} FCFA
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={ajouter} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Enregistrer
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : etiquettes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune commande d'étiquettes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Quantité</th>
                    <th className="text-left px-4 py-3">Dimensions</th>
                    <th className="text-left px-4 py-3">Prix unit.</th>
                    <th className="text-left px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {etiquettes.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{e.client}</td>
                      <td className="px-4 py-3">{e.quantite}</td>
                      <td className="px-4 py-3">
                        {e.largeur} × {e.hauteur} cm
                      </td>
                      <td className="px-4 py-3">{e.prix_unitaire?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 font-medium text-purple-700">
                        {e.total?.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={e.statut}
                          onChange={(ev) => changerStatut(e.id, ev.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                          <option value="Livré">Livré</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => supprimer(e.id)}
                          className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}