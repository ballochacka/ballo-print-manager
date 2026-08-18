"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CommandesPage() {
  const [showForm, setShowForm] = useState(false);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    client: "",
    produit: "",
    quantite: "",
    prix_achat: "",
    montant: "",
  });

  const chargerDonnees = async () => {
    setLoading(true);

    const { data: cmd } = await supabase
      .from("commandes")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: cli } = await supabase
      .from("clients")
      .select("*")
      .order("nom");

    const { data: stk } = await supabase
      .from("stocks")
      .select("*")
      .order("nom");

    setCommandes(cmd || []);
    setClients(cli || []);
    setStocks(stk || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const quantite = Number(form.quantite) || 0;
  const prixAchatUnitaire = Number(form.prix_achat) || 0;
  const totalAchat = quantite * prixAchatUnitaire;
  const totalVente = parseFloat(
    (form.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
  ) || 0;
  const beneficeEstime = totalVente - totalAchat;

  const ajouterCommande = async () => {
    if (!form.client || !form.produit || !form.quantite || !form.montant) {
      alert("Merci de remplir les champs obligatoires");
      return;
    }

    const quantiteCommandee = Number(form.quantite);
    const produitStock = stocks.find((s) => s.nom === form.produit);

    if (produitStock && produitStock.quantite < quantiteCommandee) {
      alert(`Stock insuffisant ! Il ne reste que ${produitStock.quantite} unités.`);
      return;
    }

    const { error } = await supabase.from("commandes").insert([
      {
        numero: `CMD-${Date.now().toString().slice(-4)}`,
        client: form.client,
        produit: form.produit,
        quantite: quantiteCommandee,
        prix_achat: totalAchat,
        statut: "En attente",
        montant: form.montant.includes("FCFA")
          ? form.montant
          : `${form.montant} FCFA`,
      },
    ]);

    if (error) {
      alert("Erreur lors de la création de la commande");
      console.error(error);
      return;
    }

    // Diminuer le stock si le produit existe
    if (produitStock) {
      await supabase
        .from("stocks")
        .update({ quantite: produitStock.quantite - quantiteCommandee })
        .eq("id", produitStock.id);
    }

    setForm({
      client: "",
      produit: "",
      quantite: "",
      prix_achat: "",
      montant: "",
    });
    setShowForm(false);
    setMessage("Commande ajoutée avec succès");
    setTimeout(() => setMessage(""), 3000);
    chargerDonnees();
  };

  const supprimerCommande = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette commande ?")) return;
    await supabase.from("commandes").delete().eq("id", id);
    chargerDonnees();
  };

  const changerStatut = async (id: string, nouveauStatut: string) => {
    await supabase.from("commandes").update({ statut: nouveauStatut }).eq("id", id);
    chargerDonnees();
  };

  const imprimerRecu = (cmd: any) => {
    const fenetre = window.open("", "_blank", "width=400,height=600");
    if (!fenetre) return;

    fenetre.document.write(`
      <html>
        <head>
          <title>Reçu - ${cmd.numero}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; max-width: 350px; margin: 0 auto; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 25px; }
            .ligne { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .total { border-top: 2px solid #000; margin-top: 15px; padding-top: 10px; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Ballo Print Manager</h1>
          <div class="subtitle">Reçu de commande</div>
          <div class="ligne"><span>N° Commande :</span> <span>${cmd.numero}</span></div>
          <div class="ligne"><span>Date :</span> <span>${new Date().toLocaleDateString("fr-FR")}</span></div>
          <div class="ligne"><span>Client :</span> <span>${cmd.client}</span></div>
          <hr style="margin: 15px 0;">
          <div class="ligne"><span>Produit :</span> <span>${cmd.produit}</span></div>
          <div class="ligne"><span>Quantité :</span> <span>${cmd.quantite}</span></div>
          <div class="ligne total"><span>Total à payer :</span> <span>${cmd.montant}</span></div>
          <div class="footer">Merci pour votre confiance !<br>Ballo Print Manager</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    fenetre.document.close();
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case "Terminée":
        return "bg-green-100 text-green-700";
      case "Prêt":
        return "bg-purple-100 text-purple-700";
      case "En production":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getBenefice = (cmd: any) => {
    const vente =
      parseFloat(
        (cmd.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
      ) || 0;
    const achat = cmd.prix_achat || 0;
    return vente - achat;
  };

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Commandes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
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
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold mb-4">Nouvelle commande</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.nom}>
                    {c.nom}
                  </option>
                ))}
              </select>

              <select
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un produit</option>
                {stocks.map((s) => (
                  <option key={s.id} value={s.nom}>
                    {s.nom} (Stock: {s.quantite})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />

              <input
                type="number"
                placeholder="Prix d'achat unitaire (FCFA)"
                value={form.prix_achat}
                onChange={(e) => setForm({ ...form, prix_achat: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />

              <input
                placeholder="Prix total facturé au client (FCFA)"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {(form.quantite || form.prix_achat || form.montant) && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm space-y-1">
                <p>Coût total d'achat : <strong>{totalAchat.toLocaleString()} FCFA</strong></p>
                <p>Prix de vente : <strong>{totalVente.toLocaleString()} FCFA</strong></p>
                <p className="text-green-700 font-bold">
                  Bénéfice estimé : {beneficeEstime.toLocaleString()} FCFA
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={ajouterCommande}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : commandes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune commande</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">N°</th>
                    <th className="text-left px-4 py-3">Client</th>
                    <th className="text-left px-4 py-3">Produit</th>
                    <th className="text-left px-4 py-3">Qté</th>
                    <th className="text-left px-4 py-3">Achat</th>
                    <th className="text-left px-4 py-3">Vente</th>
                    <th className="text-left px-4 py-3">Bénéfice</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commandes.map((cmd) => (
                    <tr key={cmd.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{cmd.numero}</td>
                      <td className="px-4 py-3">{cmd.client}</td>
                      <td className="px-4 py-3">{cmd.produit}</td>
                      <td className="px-4 py-3">{cmd.quantite}</td>
                      <td className="px-4 py-3 text-orange-600">
                        {(cmd.prix_achat || 0).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3">{cmd.montant}</td>
                      <td className="px-4 py-3 font-medium text-green-600">
                        {getBenefice(cmd).toLocaleString()} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={cmd.statut}
                          onChange={(e) => changerStatut(cmd.id, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getStatutStyle(
                            cmd.statut
                          )}`}
                        >
                          <option value="En attente">En attente</option>
                          <option value="En production">En production</option>
                          <option value="Prêt">Prêt</option>
                          <option value="Terminée">Terminée</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {(cmd.statut === "Prêt" || cmd.statut === "Terminée") && (
                          <button
                            onClick={() => imprimerRecu(cmd)}
                            className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-md"
                          >
                            Reçu
                          </button>
                        )}
                        <button
                          onClick={() => supprimerCommande(cmd.id)}
                          className="px-2.5 py-1 bg-red-100 text-red-600 text-xs rounded-md"
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