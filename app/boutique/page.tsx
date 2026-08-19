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
  const [type, setType] = useState("commande");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 py-10 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Ballo Print</h1>
        <p className="mt-2 text-purple-100">Personnalisation & Impression professionnelle</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-6 text-center">Nos Produits</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {produits.map((p) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <h3 className="font-semibold text-lg">{p.nom}</h3>
              <p className="text-sm text-slate-300 mt-1">{p.description}</p>
              <p className="text-purple-300 font-bold mt-3">{p.prix}</p>
              <button
                onClick={() => setSelectedProduit(p.nom)}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm"
              >
                Choisir
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-lg mx-auto">
          <h3 className="text-xl font-bold mb-4 text-center">
            {type === "devis" ? "Demander un devis" : "Passer une commande"}
          </h3>

          {success ? (
            <div className="text-center py-8">
              <p className="text-green-400 font-medium text-lg">Demande envoyée avec succès !</p>
              <p className="text-slate-300 mt-2 text-sm">Nous vous contacterons très bientôt.</p>
              <button onClick={() => setSuccess(false)} className="mt-4 text-purple-300 text-sm underline">
                Faire une autre demande
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setType("commande")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    type === "commande" ? "bg-purple-600 text-white" : "bg-white/10 text-slate-300"
                  }`}
                >
                  Commander
                </button>
                <button
                  onClick={() => setType("devis")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    type === "devis" ? "bg-purple-600 text-white" : "bg-white/10 text-slate-300"
                  }`}
                >
                  Demander un devis
                </button>
              </div>

              <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
              <input placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />
              <input placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-400" />

              <select value={selectedProduit} onChange={(e) => setSelectedProduit(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white">
                <option value="">Sélectionner un produit</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.nom}>{p.nom}</option>
                ))}
              </select>

              <textarea placeholder="Message (optionnel)" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-400 h-24" />

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