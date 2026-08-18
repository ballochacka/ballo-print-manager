"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MaillotsPage() {
  const [maillots, setMaillots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    client: "",
    type_maillot: "Maillot simple",
    apporte_par_client: true,
    prix_maillot: "0",
    prix_personnalisation: "2000",
    quantite: "1",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("maillots")
      .select("*")
      .order("created_at", { ascending: false });
    setMaillots(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.client) {
      alert("Le nom du client est obligatoire");
      return;
    }

    const prixMaillot = form.apporte_par_client ? 0 : Number(form.prix_maillot) || 0;
    const prixPerso = Number(form.prix_personnalisation) || 0;
    const quantite = Number(form.quantite) || 1;
    const total = (prixMaillot + prixPerso) * quantite;

    const { error } = await supabase.from("maillots").insert([
      {
        client: form.client,
        type_maillot: form.type_maillot,
        apporte_par_client: form.apporte_par_client,
        prix_maillot: prixMaillot,
        prix_personnalisation: prixPerso,
        quantite,
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
      type_maillot: "Maillot simple",
      apporte_par_client: true,
      prix_maillot: "0",
      prix_personnalisation: "2000",
      quantite: "1",
    });
    setShowForm(false);
    setMessage("Maillot enregistré");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("maillots").delete().eq("id", id);
    charger();
  };

  const changerStatut = async (id: string, statut: string) => {
    await supabase.from("maillots").update({ statut }).eq("id", id);
    charger();
  };

  return (
    <div>
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Maillots / Personnalisation</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nouveau
        </button>
      </header>

      <div className="p-4 md:p-6">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">{message}</div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Nouvelle personnalisation</h3>

            <div className="space-y-4">
              <input
                placeholder="Nom du client"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <select
                value={form.type_maillot}
                onChange={(e) => setForm({ ...form, type_maillot: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="Maillot simple">Maillot simple</option>
                <option value="Maillot sport">Maillot sport</option>
                <option value="Maillot lourd">Maillot lourd</option>
                <option value="Autre">Autre</option>
              </select>

              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.apporte_par_client === true}
                    onChange={() => setForm({ ...form, apporte_par_client: true, prix_maillot: "0" })}
                  />
                  Client apporte son maillot
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.apporte_par_client === false}
                    onChange={() => setForm({ ...form, apporte_par_client: false })}
                  />
                  Je fournis le maillot
                </label>
              </div>

              {!form.apporte_par_client && (
                <input
                  type="number"
                  placeholder="Prix du maillot (FCFA)"
                  value={form.prix_maillot}
                  onChange={(e) => setForm({ ...form, prix_maillot: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              )}

              <input
                type="number"
                placeholder="Prix personnalisation (FCFA)"
                value={form.prix_personnalisation}
                onChange={(e) => setForm({ ...form, prix_personnalisation: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <input
                type="number"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <div className="text-sm text-purple-700 font-medium">
                Total estimé :{" "}
                {(
                  ((form.apporte_par_client ? 0 : Number(form.prix_maillot) || 0) +
                    (Number(form.prix_personnalisation) || 0)) *
                  (Number(form.quantite) || 1)
                ).toLocaleString()}{" "}
                FCFA
              </div>
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
          ) : maillots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun maillot enregistré</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Apporté</th>
                    <th className="text-left px-4 py-3">Qté</th>
                    <th className="text-left px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {maillots.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{m.client}</td>
                      <td className="px-4 py-3">{m.type_maillot}</td>
                      <td className="px-4 py-3">
                        {m.apporte_par_client ? "Client" : "Fourni"}
                      </td>
                      <td className="px-4 py-3">{m.quantite}</td>
                      <td className="px-4 py-3 font-medium text-purple-700">
                        {m.total?.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={m.statut}
                          onChange={(e) => changerStatut(m.id, e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                          <option value="Livré">Livré</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => supprimer(m.id)}
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