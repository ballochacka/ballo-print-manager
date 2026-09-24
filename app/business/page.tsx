"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BusinessPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    produit: "",
    quantite: "1",
    prix_vente_unit: "",
    prix_achat_unit: "",
    client: "",
    note: "",
  });

  const qte = Number(form.quantite) || 0;
  const venteUnit = Number(form.prix_vente_unit) || 0;
  const achatUnit = Number(form.prix_achat_unit) || 0;
  const totalVente = qte * venteUnit;
  const totalAchat = qte * achatUnit;
  const benefice = totalVente - totalAchat;

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("business_ventes")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.produit) {
      alert("Nom du produit obligatoire");
      return;
    }
    if (qte <= 0 || venteUnit <= 0) {
      alert("Quantité et prix de vente obligatoires");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée");
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("business_ventes").insert([
      {
        owner_id: user.id,
        produit: form.produit,
        quantite: qte,
        prix_vente: totalVente,
        prix_achat: totalAchat,
        client: form.client || null,
        note: form.note || null,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setForm({
      produit: "",
      quantite: "1",
      prix_vente_unit: "",
      prix_achat_unit: "",
      client: "",
      note: "",
    });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette vente ?")) return;
    await supabase.from("business_ventes").delete().eq("id", id);
    charger();
  };

  const totalVentes = rows.reduce((s, r) => s + (Number(r.prix_vente) || 0), 0);
  const totalAchats = rows.reduce((s, r) => s + (Number(r.prix_achat) || 0), 0);
  const totalBenef = totalVentes - totalAchats;

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
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Business annexe</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            Ordinateurs, presse à chaud, etc. — séparé des impressions
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: "#0f766e",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          + Nouvelle vente
        </button>
      </header>

      <div style={{ padding: 16 }}>
        {/* Totaux séparés */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ background: "#ecfeff", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#0e7490" }}>CA Business</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#0f766e" }}>
              {totalVentes.toLocaleString("fr-FR")} F
            </div>
          </div>
          <div style={{ background: "#fff7ed", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#c2410c" }}>Achats</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#ea580c" }}>
              {totalAchats.toLocaleString("fr-FR")} F
            </div>
          </div>
          <div style={{ background: "#ecfdf5", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#047857" }}>Bénéfice Business</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#059669" }}>
              {totalBenef.toLocaleString("fr-FR")} F
            </div>
          </div>
        </div>

        {showForm && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <input
                placeholder="Produit (ex: Presse à chaud)"
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Client (optionnel)"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                style={inputStyle}
              />
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
                value={form.prix_vente_unit}
                onChange={(e) => setForm({ ...form, prix_vente_unit: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                placeholder="Prix achat unitaire"
                value={form.prix_achat_unit}
                onChange={(e) => setForm({ ...form, prix_achat_unit: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Note (optionnel)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                fontSize: 13,
              }}
            >
              <span>
                Total vente : <b>{totalVente.toLocaleString("fr-FR")} F</b>
              </span>
              <span>
                Total achat : <b>{totalAchat.toLocaleString("fr-FR")} F</b>
              </span>
              <span style={{ color: "#059669" }}>
                Bénéfice : <b>{benefice.toLocaleString("fr-FR")} F</b>
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={ajouter}
                style={{
                  background: "#0f766e",
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
              Aucune vente business pour le moment
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Produit</th>
                    <th style={th}>Client</th>
                    <th style={th}>Qté</th>
                    <th style={th}>Vente</th>
                    <th style={th}>Achat</th>
                    <th style={th}>Bénéfice</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const v = Number(r.prix_vente) || 0;
                    const a = Number(r.prix_achat) || 0;
                    const b = v - a;
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>
                          <strong>{r.produit}</strong>
                          {r.note && (
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.note}</div>
                          )}
                        </td>
                        <td style={td}>{r.client || "—"}</td>
                        <td style={td}>{r.quantite}</td>
                        <td style={{ ...td, color: "#0f766e", fontWeight: 600 }}>
                          {v.toLocaleString("fr-FR")} F
                        </td>
                        <td style={{ ...td, color: "#ea580c" }}>
                          {a.toLocaleString("fr-FR")} F
                        </td>
                        <td
                          style={{
                            ...td,
                            color: b >= 0 ? "#059669" : "#dc2626",
                            fontWeight: 700,
                          }}
                        >
                          {b.toLocaleString("fr-FR")} F
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => supprimer(r.id)}
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
