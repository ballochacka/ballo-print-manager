"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WifiPage() {
  const [ventes, setVentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    client: "",
    type_forfait: "Par jour",
    duree: "1 jour",
    prix: "",
  });

  const forfaits = {
    "Par heure": ["1 heure", "3 heures", "6 heures"],
    "Par jour": ["1 jour", "3 jours", "7 jours"],
    "Par mois": ["1 mois", "2 mois", "3 mois"],
  };

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("wifi_zone").select("*").order("created_at", { ascending: false });
    setVentes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.prix) {
      alert("Le prix est obligatoire");
      return;
    }

    const { error } = await supabase.from("wifi_zone").insert([
      {
        client: form.client || "Client",
        type_forfait: form.type_forfait,
        duree: form.duree,
        prix: Number(form.prix) || 0,
        statut: "Actif",
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({ client: "", type_forfait: "Par jour", duree: "1 jour", prix: "" });
    setShowForm(false);
    setMessage("Vente WiFi enregistrée");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("wifi_zone").delete().eq("id", id);
    charger();
  };

  return (
    <div>
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">WiFi Zone</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          + Nouvelle vente
        </button>
      </header>

      <div className="p-4 md:p-6">
        {message && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">{message}</div>}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Nouvelle vente WiFi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nom du client (optionnel)" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <select value={form.type_forfait} onChange={(e) => setForm({ ...form, type_forfait: e.target.value, duree: forfaits[e.target.value as keyof typeof forfaits][0] })} className="border rounded-lg px-3 py-2 text-sm">
                <option value="Par heure">Par heure</option>
                <option value="Par jour">Par jour</option>
                <option value="Par mois">Par mois</option>
              </select>
              <select value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                {forfaits[form.type_forfait as keyof typeof forfaits].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="number" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={ajouter} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Enregistrer</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">Annuler</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Durée</th>
                    <th className="text-left px-4 py-3">Prix</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ventes.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{v.client}</td>
                      <td className="px-4 py-3">{v.type_forfait}</td>
                      <td className="px-4 py-3">{v.duree}</td>
                      <td className="px-4 py-3 font-medium text-purple-700">{v.prix?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => supprimer(v.id)} className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded">Supprimer</button>
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