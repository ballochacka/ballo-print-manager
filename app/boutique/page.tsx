"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const produits = [
  { id: 1, nom: "T-shirt simple", prix: "3 500 FCFA", description: "T-shirt coton basique" },
  { id: 2, nom: "T-shirt personnalisé", prix: "5 500 FCFA", description: "Avec impression ou broderie" },
  { id: 3, nom: "T-shirt lourd personnalisé", prix: "7 500 FCFA", description: "Tissu épais + personnalisation" },
  { id: 4, nom: "Casquette personnalisée", prix: "4 000 FCFA", description: "Broderie ou impression" },
  { id: 5, nom: "Mug personnalisé", prix: "3 000 FCFA", description: "Impression haute qualité" },
  { id: 6, nom: "Pochette personnalisée", prix: "2 500 FCFA", description: "Pochette avec votre design" },
  { id: 7, nom: "Bol personnalisé", prix: "4 500 FCFA", description: "Bol avec gravure ou impression" },
  { id: 8, nom: "Flyer / Brochure", prix: "Sur devis", description: "Impression professionnelle" },
];

export default function BoutiquePage() {
  const [selectedProduit, setSelectedProduit] = useState("");
  const [type, setType] = useState("commande"); // commande ou devis
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const envoyerDemande = async () => {
    if (!nom || !prenom || !telephone || !selectedProduit) {
      alert("Merci de remplir tous les champs");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("commandes").insert([
      {
        numero: `WEB-${Date.now().toString().slice(-5)}`,
        client: `${prenom} ${nom}`,
        produit: selectedProduit,
        quantite: 1,
        statut: type === "devis" ? "Devis demandé" : "Commande web",
        montant: "À confirmer",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Erreur lors de l'envoi. Réessaie.");
      console.error(error);
      return;
    }

    setSuccess(true);
    setNom("");
    setPrenom("");
    setTelephone("");
    setSelectedProduit("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-8 px-4 text-center">
        <h1 className="text-3xl font-bold">Ballo Print</h1>
        <p className="mt-2 text-purple-100">Personnalisation & Impression</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Nos Produits</h2>

        {/* Liste des produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {produits.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
              <h3 className="font-semibold text-gray-800 text-lg">{p.nom}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.description}</p>
              <p className="text-purple-600 font-bold mt-3">{p.prix}</p>
              <button
                onClick={() => setSelectedProduit(p.nom)}
                className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg text-sm hover:bg-purple-700"
              >
                Choisir
              </button>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-md border p-6 max-w-lg mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            {type === "devis" ? "Demander un devis" : "Passer une commande"}
          </h3>

          {success ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium text-lg">Demande envoyée avec succès !</p>
              <p className="text-gray-500 mt-2 text-sm">Nous vous contacterons très bientôt.</p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 text-purple-600 text-sm underline"
              >
                Faire une autre demande
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setType("commande")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    type === "commande" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Commander
                </button>
                <button
                  onClick={() => setType("devis")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    type === "devis" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  Demander un devis
                </button>
              </div>

              <input
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              />
              <input
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              />
              <input
                placeholder="Téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              />

              <select
                value={selectedProduit}
                onChange={(e) => setSelectedProduit(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="">Sélectionner un produit</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.nom}>{p.nom}</option>
                ))}
              </select>

              <textarea
                placeholder="Message (optionnel)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm h-24"
              />

              <button
                onClick={envoyerDemande}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Envoi en cours..." : "Envoyer ma demande"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}