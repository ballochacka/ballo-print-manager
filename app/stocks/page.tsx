"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQuantite, setEditQuantite] = useState("");
  const [form, setForm] = useState({ nom: "", quantite: "", seuil: "5" });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("stocks").select("*").order("created_at", { ascending: false });
    setStocks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.nom || !form.quantite) {
      alert("Nom et quantité obligatoires");
      return;
    }
    const { error } = await supabase.from("stocks").insert([
      {
        nom: form.nom,
        quantite: Number(form.quantite),
        seuil: Number(form.seuil) || 5,
      },
    ]);
    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }
    setForm({ nom: "", quantite: "", seuil: "5" });
    setShowForm(false);
    charger();
  };

  const sauvegarderQuantite = async (id: string) => {
    await supabase.from("stocks").update({ quantite: Number(editQuantite) }).eq("id", id);
    setEditId(null);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce stock ?")) return;
    await supabase.from("stocks").delete().eq("id", id);
    charger();
  };

  return (
    <div>
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Stocks</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          + Nouveau produit
        </button>
      </header>

      <div className="p-4 md:p-6">
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Nouveau produit</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Nom du produit" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Seuil d'alerte" value={form.seuil} onChange={(e) => setForm({ ...form, seuil: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={ajouter} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Ajouter</button>
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
                    <th className="text-left px-4 py-3">Produit</th>
                    <th className="text-left px-4 py-3">Quantité</th>
                    <th className="text-left px-4 py-3">Seuil</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stocks.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.nom}</td>
                      <td className="px-4 py-3">
                        {editId === item.id ? (
                          <div className="flex gap-2">
                            <input type="number" value={editQuantite} onChange={(e) => setEditQuantite(e.target.value)} className="border rounded px-2 py-1 w-20 text-sm" />
                            <button onClick={() => sauvegarderQuantite(item.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">OK</button>
                          </div>
                        ) : (
                          item.quantite
                        )}
                      </td>
                      <td className="px-4 py-3">{item.seuil}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.quantite <= item.seuil ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                          {item.quantite <= item.seuil ? "Alerte" : "OK"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => { setEditId(item.id); setEditQuantite(String(item.quantite)); }} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded">
                          Modifier
                        </button>
                        <button onClick={() => supprimer(item.id)} className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded">
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