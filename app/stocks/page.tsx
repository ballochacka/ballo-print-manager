"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function StocksPage() {
  const [showForm, setShowForm] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editQuantite, setEditQuantite] = useState("");

  const [form, setForm] = useState({ nom: "", quantite: "", seuil: "" });

  const chargerStocks = async () => {
    setLoading(true);
    const { data } = await supabase.from("stocks").select("*").order("nom");
    setStocks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerStocks();
  }, []);

  const ajouterArticle = async () => {
    if (!form.nom || !form.quantite) {
      alert("Merci de remplir les champs");
      return;
    }

    await supabase.from("stocks").insert([
      {
        nom: form.nom,
        quantite: Number(form.quantite),
        seuil: Number(form.seuil) || 10,
      },
    ]);

    setForm({ nom: "", quantite: "", seuil: "" });
    setShowForm(false);
    setMessage("Article ajouté");
    setTimeout(() => setMessage(""), 3000);
    chargerStocks();
  };

  const sauvegarderQuantite = async (id: string) => {
    await supabase
      .from("stocks")
      .update({ quantite: Number(editQuantite) })
      .eq("id", id);

    setEditId(null);
    setEditQuantite("");
    chargerStocks();
  };

  const supprimerArticle = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("stocks").delete().eq("id", id);
    chargerStocks();
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Gestion des stocks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
        >
          + Ajouter un article
        </button>
      </header>

      <div className="p-6">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">{message}</div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Nouvel article</h3>
            <div className="grid grid-cols-3 gap-4">
              <input
                placeholder="Nom de l'article"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
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
                placeholder="Seuil d'alerte"
                value={form.seuil}
                onChange={(e) => setForm({ ...form, seuil: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={ajouterArticle} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Ajouter
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
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3">Article</th>
                  <th className="text-left px-5 py-3">Quantité</th>
                  <th className="text-left px-5 py-3">Seuil</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stocks.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{item.nom}</td>
                    <td className="px-5 py-3">
                      {editId === item.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={editQuantite}
                            onChange={(e) => setEditQuantite(e.target.value)}
                            className="border rounded px-2 py-1 w-20 text-sm"
                          />
                          <button
                            onClick={() => sauvegarderQuantite(item.id)}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        item.quantite
                      )}
                    </td>
                    <td className="px-5 py-3">{item.seuil}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.quantite <= item.seuil
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.quantite <= item.seuil ? "Alerte" : "OK"}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditId(item.id);
                          setEditQuantite(String(item.quantite));
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => supprimerArticle(item.id)}
                        className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded"
                      >
                        Supprimer
                      </button>
                    </td>
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