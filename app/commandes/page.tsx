"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    client: "",
    produit: "",
    quantite: "1",
    montant: "",
    prix_achat: "",
    statut: "En attente",
  });

  const charger = async () => {
    setLoading(true);
    const { data: cmds } = await supabase.from("commandes").select("*").order("created_at", { ascending: false });
    const { data: cls } = await supabase.from("clients").select("*").order("nom");
    const { data: stk } = await supabase.from("stocks").select("*").order("nom");
    setCommandes(cmds || []);
    setClients(cls || []);
    setStocks(stk || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.client || !form.produit || !form.montant) {
      alert("Client, produit et montant sont obligatoires");
      return;
    }

    const quantite = Number(form.quantite) || 1;
    const montant = Number(form.montant) || 0;
    const prixAchat = Number(form.prix_achat) || 0;

    const { error } = await supabase.from("commandes").insert([
      {
        numero: "CMD-" + Date.now().toString().slice(-5),
        client: form.client,
        produit: form.produit,
        quantite,
        montant: String(montant),
        prix_achat: prixAchat,
        statut: form.statut,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    // Réduire le stock si le produit existe
    const stockItem = stocks.find((s) => s.nom === form.produit);
    if (stockItem) {
      const nouvelleQte = Math.max(0, (stockItem.quantite || 0) - quantite);
      await supabase.from("stocks").update({ quantite: nouvelleQte }).eq("id", stockItem.id);
    }

    setForm({
      client: "",
      produit: "",
      quantite: "1",
      montant: "",
      prix_achat: "",
      statut: "En attente",
    });
    setShowForm(false);
    setMessage("Commande ajoutée");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const changerStatut = async (id: string, statut: string) => {
    await supabase.from("commandes").update({ statut }).eq("id", id);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    await supabase.from("commandes").delete().eq("id", id);
    charger();
  };

  const imprimerRecu = (c: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>Reçu ${c.numero || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { margin: 0 0 8px; }
          .ligne { margin: 6px 0; }
          .total { font-size: 18px; font-weight: bold; margin-top: 16px; }
        </style>
        </head>
        <body>
          <h1>Ballo Print</h1>
          <div class="ligne">Reçu n° ${c.numero || "—"}</div>
          <div class="ligne">Date : ${c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : "—"}</div>
          <div class="ligne">Client : ${c.client || "—"}</div>
          <div class="ligne">Produit : ${c.produit || "—"}</div>
          <div class="ligne">Quantité : ${c.quantite || 1}</div>
          <div class="total">Total : ${c.montant || 0} FCFA</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const filtrées = commandes.filter((c) => {
    const q = recherche.toLowerCase();
    return (
      (c.client || "").toLowerCase().includes(q) ||
      (c.produit || "").toLowerCase().includes(q) ||
      (c.numero || "").toLowerCase().includes(q) ||
      (c.statut || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Commandes</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Rechercher commande, client, produit..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 220 }}
          />
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}
          >
            + Nouvelle commande
          </button>
        </div>
      </header>

      <div style={{ padding: 16 }}>
        {message && (
          <div style={{ marginBottom: 12, padding: 12, background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 14 }}>
            {message}
          </div>
        )}

        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Nouvelle commande</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} style={inputStyle}>
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.nom}>{c.nom}</option>
                ))}
              </select>

              <select value={form.produit} onChange={(e) => setForm({ ...form, produit: e.target.value })} style={inputStyle}>
                <option value="">Sélectionner un produit</option>
                {stocks.map((s) => (
                  <option key={s.id} value={s.nom}>{s.nom} (stock: {s.quantite})</option>
                ))}
              </select>

              <input type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Montant vente (FCFA)" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Prix d'achat (FCFA)" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} style={inputStyle} />

              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} style={inputStyle}>
                <option value="En attente">En attente</option>
                <option value="En production">En production</option>
                <option value="Terminée">Terminée</option>
                <option value="Livrée">Livrée</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                Enregistrer
              </button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
          ) : filtrées.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune commande trouvée</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={thStyle}>N°</th>
                    <th style={thStyle}>Client</th>
                    <th style={thStyle}>Produit</th>
                    <th style={thStyle}>Qté</th>
                    <th style={thStyle}>Montant</th>
                    <th style={thStyle}>Achat</th>
                    <th style={thStyle}>Bénéfice</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrées.map((c) => {
                    const vente = parseFloat((c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
                    const achat = c.prix_achat || 0;
                    const benef = vente - achat;
                    return (
                      <tr key={c.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={tdStyle}>{c.numero || "—"}</td>
                        <td style={tdStyle}><strong>{c.client}</strong></td>
                        <td style={tdStyle}>{c.produit}</td>
                        <td style={tdStyle}>{c.quantite || 1}</td>
                        <td style={tdStyle}>{vente.toLocaleString("fr-FR")} FCFA</td>
                        <td style={tdStyle}>{achat.toLocaleString("fr-FR")} FCFA</td>
                        <td style={{ ...tdStyle, color: "#059669", fontWeight: 600 }}>{benef.toLocaleString("fr-FR")} FCFA</td>
                        <td style={tdStyle}>
                          <select
                            value={c.statut || "En attente"}
                            onChange={(e) => changerStatut(c.id, e.target.value)}
                            style={{ padding: 4, borderRadius: 6, border: "1px solid #d1d5db" }}
                          >
                            <option value="En attente">En attente</option>
                            <option value="En production">En production</option>
                            <option value="Terminée">Terminée</option>
                            <option value="Livrée">Livrée</option>
                          </select>
                        </td>
                        <td style={tdStyle}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button onClick={() => imprimerRecu(c)} style={{ background: "#dcfce7", color: "#166534", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                              Reçu
                            </button>
                            <button onClick={() => supprimer(c.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#6b7280",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
};