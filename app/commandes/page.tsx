"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CommandesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client: "",
    produit: "",
    quantite: "1",
    prix_unitaire: "",
    prix_achat_unitaire: "",
  });

  const qte = Number(form.quantite) || 0;
  const prixVenteUnit = Number(form.prix_unitaire) || 0;
  const prixAchatUnit = Number(form.prix_achat_unitaire) || 0;
  const totalVente = qte * prixVenteUnit;
  const totalAchat = qte * prixAchatUnit;
  const benefice = totalVente - totalAchat;

  const nomProduit = (s: any) =>
    s.produit || s.nom || s.name || s.designation || "Sans nom";

  const qteStock = (s: any) =>
    Number(s.quantite ?? s.qte ?? s.stock ?? 0);

  const charger = async () => {
    setLoading(true);
    const [{ data: commandes }, { data: clientsData }, { data: stocksData }] =
      await Promise.all([
        supabase.from("commandes").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*"),
        supabase.from("stocks").select("*"),
      ]);

    setRows(commandes || []);
    setClients(clientsData || []);
    setStocks(stocksData || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const trouverStock = (nom: string) =>
    stocks.find((s) => nomProduit(s).toLowerCase() === (nom || "").toLowerCase());

  const ajouter = async () => {
    if (!form.client || !form.produit) {
      alert("Client et produit obligatoires");
      return;
    }
    if (qte <= 0) {
      alert("Quantité invalide");
      return;
    }
    if (prixVenteUnit <= 0) {
      alert("Prix de vente unitaire obligatoire");
      return;
    }

    const stockItem = trouverStock(form.produit);
    if (stockItem) {
      const dispo = qteStock(stockItem);
      if (dispo < qte) {
        alert(`Stock insuffisant. Disponible : ${dispo}`);
        return;
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("commandes").insert([
      {
        client: form.client,
        produit: form.produit,
        quantite: qte,
        montant: totalVente,
        prix_achat: totalAchat,
        owner_id: user.id,
      },
    ]);

    if (error) {
      alert("Erreur commande : " + error.message);
      return;
    }

    // Diminuer le stock
    if (stockItem) {
      const nouvelleQte = qteStock(stockItem) - qte;
      const { error: stockErr } = await supabase
        .from("stocks")
        .update({ quantite: nouvelleQte })
        .eq("id", stockItem.id);

      if (stockErr) {
        // si la colonne s'appelle autrement
        await supabase
          .from("stocks")
          .update({ qte: nouvelleQte })
          .eq("id", stockItem.id);
      }
    }

    setForm({
      client: "",
      produit: "",
      quantite: "1",
      prix_unitaire: "",
      prix_achat_unitaire: "",
    });
    setShowForm(false);
    charger();
  };

  const supprimer = async (commande: any) => {
    if (!confirm("Supprimer cette commande ? Le stock sera remis.")) return;

    // Remettre le stock
    const stockItem = trouverStock(commande.produit);
    if (stockItem) {
      const retour = Number(commande.quantite) || 0;
      const nouvelleQte = qteStock(stockItem) + retour;
      const { error: stockErr } = await supabase
        .from("stocks")
        .update({ quantite: nouvelleQte })
        .eq("id", stockItem.id);

      if (stockErr) {
        await supabase
          .from("stocks")
          .update({ qte: nouvelleQte })
          .eq("id", stockItem.id);
      }
    }

    await supabase.from("commandes").delete().eq("id", commande.id);
    charger();
  };

  const nomClient = (c: any) =>
    c.nom || c.nom_complet || c.name || c.client || "Client";

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Commandes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          + Nouvelle commande
        </button>
      </header>

      <div style={{ padding: 16 }}>
        {showForm && (
          <div
            style={{
              marginBottom: 16,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <select
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                style={inputStyle}
              >
                <option value="">— Client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={nomClient(c)}>
                    {nomClient(c)}
                  </option>
                ))}
              </select>

              <select
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
                style={inputStyle}
              >
                <option value="">— Produit —</option>
                {stocks.length === 0 ? (
                  <option value="" disabled>
                    Aucun produit en stock
                  </option>
                ) : (
                  stocks.map((s) => (
                    <option key={s.id} value={nomProduit(s)}>
                      {nomProduit(s)} (stock: {qteStock(s)})
                    </option>
                  ))
                )}
              </select>

              <input
                type="number"
                min="1"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                placeholder="Prix vente unitaire"
                value={form.prix_unitaire}
                onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                placeholder="Prix achat unitaire"
                value={form.prix_achat_unitaire}
                onChange={(e) =>
                  setForm({ ...form, prix_achat_unitaire: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
              }}
            >
              <div style={{ background: "#eff6ff", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: "#1e40af" }}>Total vente</div>
                <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 16 }}>
                  {totalVente.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ background: "#fff7ed", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: "#9a3412" }}>Total achat</div>
                <div style={{ fontWeight: 700, color: "#ea580c", fontSize: 16 }}>
                  {totalAchat.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ background: "#ecfdf5", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, color: "#065f46" }}>Bénéfice</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: benefice >= 0 ? "#059669" : "#dc2626",
                    fontSize: 16,
                  }}
                >
                  {benefice.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={ajouter}
                style={{
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
              Aucune commande
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Client</th>
                    <th style={th}>Produit</th>
                    <th style={th}>Qté</th>
                    <th style={th}>Total vente</th>
                    <th style={th}>Total achat</th>
                    <th style={th}>Bénéfice</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const vente = Number(r.montant) || 0;
                    const achat = Number(r.prix_achat) || 0;
                    const benef = vente - achat;
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>
                          <strong>{r.client}</strong>
                        </td>
                        <td style={td}>{r.produit}</td>
                        <td style={td}>{r.quantite || "—"}</td>
                        <td style={{ ...td, color: "#2563eb", fontWeight: 600 }}>
                          {vente.toLocaleString("fr-FR")} FCFA
                        </td>
                        <td style={{ ...td, color: "#ea580c" }}>
                          {achat.toLocaleString("fr-FR")} FCFA
                        </td>
                        <td
                          style={{
                            ...td,
                            color: benef >= 0 ? "#059669" : "#dc2626",
                            fontWeight: 700,
                          }}
                        >
                          {benef.toLocaleString("fr-FR")} FCFA
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => supprimer(r)}
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "none",
                              borderRadius: 6,
                              padding: "4px 8px",
                              cursor: "pointer",
                              fontSize: 11,
                            }}
                          >
                            Supprimer
                          </button>
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

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#6b7280",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
};
