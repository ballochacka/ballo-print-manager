"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [form, setForm] = useState({
    nom: "",
    quantite: "",
    seuil: "",
  });

  const charger = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("nom");

    if (error) console.error(error);
    setStocks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.nom) {
      alert("Le nom du produit est obligatoire");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("stocks").insert([
      {
        nom: form.nom,
        quantite: Number(form.quantite) || 0,
        seuil: Number(form.seuil) || 0,
        owner_id: user.id,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setForm({ nom: "", quantite: "", seuil: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce stock ?")) return;
    await supabase.from("stocks").delete().eq("id", id);
    charger();
  };

  const filtrés = stocks.filter((s) =>
    (s.nom || "").toLowerCase().includes(recherche.toLowerCase())
  );

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
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Stocks</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="Rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              minWidth: 160,
            }}
          />
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            + Ajouter
          </button>
        </div>
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
              <input
                placeholder="Nom du produit"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Seuil d'alerte"
                value={form.seuil}
                onChange={(e) => setForm({ ...form, seuil: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
          ) : filtrés.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
              Aucun stock
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Produit</th>
                    <th style={th}>Quantité</th>
                    <th style={th}>Seuil d'alerte</th>
                    <th style={th}>État</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrés.map((s) => {
                    const quantite = s.quantite || 0;
                    const seuil = s.seuil ?? s.seuil_alerte ?? 0;
                    const alerte = quantite <= seuil;

                    return (
                      <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>
                          <strong>{s.nom}</strong>
                        </td>
                        <td style={td}>{quantite}</td>
                        <td style={td}>{seuil}</td>
                        <td style={td}>
                          {alerte ? (
                            <span
                              style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                padding: "3px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              Stock bas
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "#dcfce7",
                                color: "#166534",
                                padding: "3px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              OK
                            </span>
                          )}
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => supprimer(s.id)}
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