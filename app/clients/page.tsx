"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({ nom: "", email: "", telephone: "" });

  const chargerClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setClients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerClients();
  }, []);

  const ajouterClient = async () => {
    if (!form.nom) {
      alert("Le nom est obligatoire");
      return;
    }

    const { error } = await supabase.from("clients").insert([
      {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({ nom: "", email: "", telephone: "" });
    setShowForm(false);
    setMessage("Client ajouté avec succès");
    setTimeout(() => setMessage(""), 3000);
    chargerClients();
  };

  const supprimerClient = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;

    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      alert("Erreur lors de la suppression");
      return;
    }
    chargerClients();
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Clients</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
        >
          + Nouveau client
        </button>
      </header>

      <div className="p-6">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold mb-4">Nouveau client</h3>
            <div className="grid grid-cols-3 gap-4">
              <input
                placeholder="Nom du client"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Téléphone"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={ajouterClient} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Ajouter
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun client</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Nom</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Téléphone</th>
                  <th className="text-left px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{client.nom}</td>
                    <td className="px-5 py-3">{client.email}</td>
                    <td className="px-5 py-3">{client.telephone}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => supprimerClient(client.id)}
                        className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-md hover:bg-red-200"
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