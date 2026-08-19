"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", telephone: "", email: "" });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.nom) {
      alert("Le nom est obligatoire");
      return;
    }
    const { error } = await supabase.from("clients").insert([form]);
    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }
    setForm({ nom: "", telephone: "", email: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    await supabase.from("clients").delete().eq("id", id);
    charger();
  };

  return (
    <div>
      <header className="bg-white border-b px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Clients</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
          + Nouveau client
        </button>
      </header>

      <div className="p-4 md:p-6">
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Nouveau client</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
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
                    <th className="text-left px-4 py-3">Nom</th>
                    <th className="text-left px-4 py-3">Téléphone</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.nom}</td>
                      <td className="px-4 py-3">{c.telephone || "—"}</td>
                      <td className="px-4 py-3">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => supprimer(c.id)} className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded">
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