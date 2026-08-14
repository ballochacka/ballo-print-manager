"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FacturationPage() {
  const [showForm, setShowForm] = useState(false);
  const [factures, setFactures] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    client: "",
    montant: "",
    type: "Devis",
  });

  const chargerDonnees = async () => {
    setLoading(true);
    const { data: facturesData } = await supabase
      .from("factures")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .order("nom");

    setFactures(facturesData || []);
    setClients(clientsData || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const ajouter = async () => {
    if (!form.client || !form.montant) {
      alert("Merci de remplir les champs");
      return;
    }

    const numero =
      form.type === "Devis"
        ? `DEV-${Date.now().toString().slice(-4)}`
        : `FAC-${Date.now().toString().slice(-4)}`;

    const { error } = await supabase.from("factures").insert([
      {
        numero,
        client: form.client,
        montant: form.montant,
        statut: form.type,
        date: new Date().toLocaleDateString("fr-FR"),
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({ client: "", montant: "", type: "Devis" });
    setShowForm(false);
    chargerDonnees();
  };

  const changerStatut = async (id: string, nouveauStatut: string) => {
    await supabase.from("factures").update({ statut: nouveauStatut }).eq("id", id);
    chargerDonnees();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await supabase.from("factures").delete().eq("id", id);
    chargerDonnees();
  };

  // ========== IMPRESSION FACTURE / DEVIS ==========
  const imprimerDocument = (doc: any) => {
    const fenetre = window.open("", "_blank", "width=500,height=700");
    if (!fenetre) return;

    const titre = doc.statut === "Devis" ? "DEVIS" : "FACTURE";

    fenetre.document.write(`
      <html>
        <head>
          <title>${titre} - ${doc.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; color: #222; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; }
            .header p { margin: 5px 0; color: #666; font-size: 13px; }
            .info { margin-bottom: 25px; font-size: 14px; }
            .info div { margin: 6px 0; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ballo Print Manager</h1>
            <p>${titre}</p>
          </div>

          <div class="info">
            <div><span>N° :</span> <strong>${doc.numero}</strong></div>
            <div><span>Date :</span> <span>${doc.date}</span></div>
            <div><span>Client :</span> <strong>${doc.client}</strong></div>
            <div><span>Statut :</span> <span>${doc.statut}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Prestation / Commande</td>
                <td style="text-align:right">${doc.montant}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            Total : ${doc.montant}
          </div>

          <div class="footer">
            Merci pour votre confiance.<br>
            Ballo Print Manager
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    fenetre.document.close();
  };

  const getStatutStyle = (statut: string) => {
    if (statut === "Payée") return "bg-green-100 text-green-700";
    if (statut === "Devis") return "bg-purple-100 text-purple-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Facturation</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
        >
          + Nouveau devis / facture
        </button>
      </header>

      <div className="p-6">
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-semibold mb-4">Nouveau document</h3>
            <div className="grid grid-cols-3 gap-4">
              <select
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.nom}>{c.nom}</option>
                ))}
              </select>

              <input
                placeholder="Montant (ex: 25000 FCFA)"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />

              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="Devis">Devis</option>
                <option value="En attente">Facture</option>
              </select>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={ajouter} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                Créer
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-5 py-3">Numéro</th>
                  <th className="text-left px-5 py-3">Client</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Montant</th>
                  <th className="text-left px-5 py-3">Statut</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {factures.map((fac) => (
                  <tr key={fac.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{fac.numero}</td>
                    <td className="px-5 py-3">{fac.client}</td>
                    <td className="px-5 py-3">{fac.date}</td>
                    <td className="px-5 py-3">{fac.montant}</td>
                    <td className="px-5 py-3">
                      <select
                        value={fac.statut}
                        onChange={(e) => changerStatut(fac.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatutStyle(fac.statut)}`}
                      >
                        <option value="Devis">Devis</option>
                        <option value="En attente">En attente</option>
                        <option value="Payée">Payée</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button
                        onClick={() => imprimerDocument(fac)}
                        className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-md"
                      >
                        Imprimer
                      </button>
                      <button
                        onClick={() => supprimer(fac.id)}
                        className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-md"
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