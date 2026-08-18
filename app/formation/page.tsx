"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FormationPage() {
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    frais_inscription: "5000",
    mensualite: "15000",
  });

  const [paiementId, setPaiementId] = useState<string | null>(null);
  const [montantPaiement, setMontantPaiement] = useState("");

  const chargerEleves = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("eleves")
      .select("*")
      .order("created_at", { ascending: false });
    setEleves(data || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerEleves();
  }, []);

  const ajouterEleve = async () => {
    if (!form.nom || !form.prenom) {
      alert("Nom et prénom obligatoires");
      return;
    }

    const frais = Number(form.frais_inscription) || 0;
    const mens = Number(form.mensualite) || 0;

    const { error } = await supabase.from("eleves").insert([
      {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        frais_inscription: frais,
        mensualite: mens,
        total_paye: frais, // on considère que l'inscription est payée à l'ajout
        statut: "Actif",
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({
      nom: "",
      prenom: "",
      telephone: "",
      frais_inscription: "5000",
      mensualite: "15000",
    });
    setShowForm(false);
    setMessage("Élève ajouté avec succès");
    setTimeout(() => setMessage(""), 3000);
    chargerEleves();
  };

  const ajouterPaiement = async (id: string) => {
    const montant = Number(montantPaiement);
    if (!montant || montant <= 0) {
      alert("Montant invalide");
      return;
    }

    const eleve = eleves.find((e) => e.id === id);
    if (!eleve) return;

    const nouveauTotal = (eleve.total_paye || 0) + montant;

    await supabase
      .from("eleves")
      .update({ total_paye: nouveauTotal })
      .eq("id", id);

    setPaiementId(null);
    setMontantPaiement("");
    chargerEleves();
  };

  const supprimerEleve = async (id: string) => {
    if (!confirm("Supprimer cet élève ?")) return;
    await supabase.from("eleves").delete().eq("id", id);
    chargerEleves();
  };

  const calculerReste = (eleve: any) => {
    // On considère 1 mois pour simplifier le calcul de base
    // Tu pourras plus tard ajouter le nombre de mois
    const totalDu = (eleve.frais_inscription || 0) + (eleve.mensualite || 0);
    return Math.max(0, totalDu - (eleve.total_paye || 0));
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Formation</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
        >
          + Nouvel élève
        </button>
      </header>

      <div className="p-4 md:p-6">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-semibold mb-4">Nouvel élève</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Prénom"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Téléphone"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Frais d'inscription (FCFA)"
                value={form.frais_inscription}
                onChange={(e) => setForm({ ...form, frais_inscription: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Mensualité (FCFA)"
                value={form.mensualite}
                onChange={(e) => setForm({ ...form, mensualite: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={ajouterEleve} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
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
          ) : eleves.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun élève inscrit</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Élève</th>
                    <th className="text-left px-4 py-3">Téléphone</th>
                    <th className="text-left px-4 py-3">Inscription</th>
                    <th className="text-left px-4 py-3">Mensualité</th>
                    <th className="text-left px-4 py-3">Total payé</th>
                    <th className="text-left px-4 py-3">Reste</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {eleves.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {e.prenom} {e.nom}
                      </td>
                      <td className="px-4 py-3">{e.telephone || "—"}</td>
                      <td className="px-4 py-3">{e.frais_inscription?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3">{e.mensualite?.toLocaleString()} FCFA</td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {e.total_paye?.toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3 text-orange-600 font-medium">
                        {calculerReste(e).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {paiementId === e.id ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Montant"
                                value={montantPaiement}
                                onChange={(ev) => setMontantPaiement(ev.target.value)}
                                className="border rounded px-2 py-1 w-24 text-sm"
                              />
                              <button
                                onClick={() => ajouterPaiement(e.id)}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setPaiementId(null)}
                                className="bg-gray-100 px-2 py-1 rounded text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPaiementId(e.id)}
                              className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded"
                            >
                              + Paiement
                            </button>
                          )}
                          <button
                            onClick={() => supprimerEleve(e.id)}
                            className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded"
                          >
                            Supprimer
                          </button>
                        </div>
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