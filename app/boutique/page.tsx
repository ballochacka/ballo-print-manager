"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const produits = [
  { id: 1, nom: "T-shirt simple personnalisé", prix: "2 000 FCFA", description: "T-shirt simple avec personnalisation", emoji: "👕", couleur: "#3b82f6" },
  { id: 2, nom: "T-shirt lourd personnalisé", prix: "2 500 - 3 000 FCFA", description: "T-shirt lourd avec personnalisation", emoji: "👕", couleur: "#6366f1" },
  { id: 3, nom: "T-shirt très lourd personnalisé", prix: "4 000 FCFA", description: "T-shirt très lourd personnalisé", emoji: "👕", couleur: "#8b5cf6" },
  { id: 4, nom: "Lacoste simple", prix: "2 500 FCFA", description: "Lacoste simple personnalisé", emoji: "🧥", couleur: "#0ea5e9" },
  { id: 5, nom: "Lacoste très lourd", prix: "5 000 FCFA", description: "Lacoste très lourd personnalisé", emoji: "🧥", couleur: "#06b6d4" },
  { id: 6, nom: "Bol personnalisé", prix: "2 500 FCFA / unité", description: "Bol avec personnalisation", emoji: "🥣", couleur: "#f59e0b" },
  { id: 7, nom: "Pochette personnalisée", prix: "5 000 FCFA", description: "Pochette personnalisée", emoji: "👜", couleur: "#ef4444" },
  { id: 8, nom: "Casquette personnalisée", prix: "2 500 FCFA", description: "Casquette avec personnalisation", emoji: "🧢", couleur: "#22c55e" },
  { id: 9, nom: "Porte-clé", prix: "1 500 FCFA", description: "Porte-clé personnalisé", emoji: "🔑", couleur: "#a855f7" },
  { id: 10, nom: "Impression une face", prix: "1 000 FCFA", description: "Impression simple une face", emoji: "🖨️", couleur: "#64748b" },
  { id: 11, nom: "Impression double face", prix: "Sur devis", description: "Impression recto-verso", emoji: "🖨️", couleur: "#475569" },
  { id: 12, nom: "Flyers / Brochures / Étiquettes / Bâche", prix: "3 500 FCFA / m²", description: "Grand format et supports publicitaires", emoji: "📄", couleur: "#dc2626" },
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
  const [dernierEnvoi, setDernierEnvoi] = useState(0);

  const envoyerDemande = async () => {
    const maintenant = Date.now();
    if (maintenant - dernierEnvoi < 30000) {
      alert("Patiente 30 secondes avant une nouvelle demande.");
      return;
    }

    if (!nom || !prenom || !telephone || !selectedProduit) {
      alert("Merci de remplir tous les champs");
      return;
    }

    setLoading(true);

    const clientNom = prenom + " " + nom;
    const typeLabel = type === "devis" ? "Devis demandé" : "Commande web";
    const messageNotif = clientNom + " (" + telephone + ") — " + selectedProduit;

    const { error } = await supabase.from("commandes").insert([
      {
        numero: "WEB-" + Date.now().toString().slice(-5),
        client: clientNom,
        produit: selectedProduit,
        quantite: 1,
        statut: typeLabel,
        montant: "À confirmer",
      },
    ]);

    if (error) {
      setLoading(false);
      alert("Erreur lors de l'envoi. Réessaie.");
      return;
    }

    await supabase.from("notifications").insert([
      {
        titre: typeLabel,
        message: messageNotif,
      },
    ]);

    const texteWhatsApp =
      "Nouvelle " + typeLabel +
      "%0AClient: " + clientNom +
      "%0ATel: " + telephone +
      "%0AProduit: " + selectedProduit +
      "%0AMessage: " + (message || "Aucun");

    window.open("https://wa.me/22375137083?text=" + texteWhatsApp, "_blank");

    setDernierEnvoi(Date.now());
    setLoading(false);
    setSuccess(true);
    setNom("");
    setPrenom("");
    setTelephone("");
    setSelectedProduit("");
    setMessage("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #3b0764, #0f172a)", color: "white" }}>
      <header style={{ background: "linear-gradient(90deg, #7c3aed, #2563eb)", padding: "40px 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: 34, margin: 0 }}>Ballo Print</h1>
        <p style={{ marginTop: 8, color: "#ede9fe" }}>Personnalisation & Impression professionnelle</p>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 16px" }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Nos Produits</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 40 }}>
          {produits.map((p) => (
            <div key={p.id} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, overflow: "hidden" }}>
              <div style={{ height: 120, background: p.couleur, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                {p.emoji}
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{p.nom}</h3>
                <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13 }}>{p.description}</p>
                <p style={{ margin: "10px 0", color: "#c4b5fd", fontWeight: 700 }}>{p.prix}</p>
                <button
                  onClick={() => setSelectedProduit(p.nom)}
                  style={{
                    width: "100%",
                    background: selectedProduit === p.nom ? "#16a34a" : "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 0",
                    cursor: "pointer",
                  }}
                >
                  {selectedProduit === p.nom ? "Sélectionné" : "Choisir"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: 20 }}>
          <h3 style={{ textAlign: "center", marginTop: 0 }}>
            {type === "devis" ? "Demander un devis" : "Passer une commande"}
          </h3>

          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "#4ade80", fontSize: 18, fontWeight: 600 }}>Demande envoyée avec succès !</p>
              <p style={{ color: "#cbd5e1", fontSize: 14 }}>Nous vous contacterons très bientôt.</p>
              <button
                onClick={() => setSuccess(false)}
                style={{ marginTop: 12, background: "transparent", color: "#c4b5fd", border: "none", textDecoration: "underline", cursor: "pointer" }}
              >
                Faire une autre demande
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setType("commande")}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: type === "commande" ? "#7c3aed" : "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  Commander
                </button>
                <button
                  onClick={() => setType("devis")}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: type === "devis" ? "#7c3aed" : "rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  Demander un devis
                </button>
              </div>

              <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} />
              <input placeholder="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inputStyle} />
              <input placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} />

              <select
                value={selectedProduit}
                onChange={(e) => setSelectedProduit(e.target.value)}
                style={{ ...inputStyle, background: "#1e293b" }}
              >
                <option value="">Sélectionner un produit</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.nom}>
                    {p.nom} — {p.prix}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Message (optionnel)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ ...inputStyle, height: 90, resize: "vertical" }}
              />

              <button
                onClick={envoyerDemande}
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #7c3aed, #2563eb)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
};