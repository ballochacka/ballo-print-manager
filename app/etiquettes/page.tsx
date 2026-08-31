"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EtiquettesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client: "",
    quantite: "1",
    largeur: "",
    hauteur: "",
    prix_m2: "4500",
    prix_client: "",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("etiquettes")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const getM2 = () => {
    const l = Number(String(form.largeur).replace(",", ".")) || 0;
    const h = Number(String(form.hauteur).replace(",", ".")) || 0;
    return (l * h) / 10000; // cm → m²
  };

  const coutFabricant = () => {
    const q = Number(form.quantite) || 1;
    const p = Number(form.prix_m2) || 0;
    return Math.round(q * getM2() * p);
  };

  const prixClient = () => Number(form.prix_client) || 0;

  const benefice = () => prixClient() - coutFabricant();

  const ajouter = async () => {
    if (!form.client) {
      alert("Client obligatoire");
      return;
    }
    if (!form.prix_client) {
      alert("Indique le prix communiqué au client");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const cout = coutFabricant();
    const clientPrix = prixClient();
    const benef = clientPrix - cout;

    const { error } = await supabase.from("etiquettes").insert([
      {
        client: form.client,
        quantite: Number(form.quantite) || 1,
        largeur: Number(String(form.largeur).replace(",", ".")) || 0,
        hauteur: Number(String(form.hauteur).replace(",", ".")) || 0,
        prix_m2: Number(form.prix_m2) || 4500,
        cout_fabricant: cout,
        prix_client: clientPrix,
        benefice: benef,
        total: clientPrix, // CA = prix facturé au client
        owner_id: user.id,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setForm({
      client: "",
      quantite: "1",
      largeur: "",
      hauteur: "",
      prix_m2: "4500",
      prix_client: "",
    });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("etiquettes").delete().eq("id", id);
    charger();
  };

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
        <h2 style={{ margin: 0, fontSize: 18 }}>Étiquettes</h2>
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
          + Nouvelle
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
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
              }}
            >
              <input
                placeholder="Client"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
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
                type="text"
                placeholder="Largeur (cm)"
                value={form.largeur}
                onChange={(e) => setForm({ ...form, largeur: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Hauteur (cm)"
                value={form.hauteur}
                onChange={(e) => setForm({ ...form, hauteur: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Prix / m² fabricant"
                value={form.prix_m2}
                onChange={(e) => setForm({ ...form, prix_m2: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Prix communiqué au client"
                value={form.prix_client}
                onChange={(e) => setForm({ ...form, prix_client: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <div style={{ background: "#fff7ed", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "#9a3412" }}>Coût fabricant</div>
                <div style={{ fontWeight: 700, color: "#ea580c" }}>
                  {coutFabricant().toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ background: "#eff6ff", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "#1e40af" }}>Prix client</div>
                <div style={{ fontWeight: 700, color: "#2563eb" }}>
                  {prixClient().toLocaleString("fr-FR")} FCFA
                </div>
              </div>
              <div style={{ background: "#ecfdf5", borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: "#065f46" }}>Mon bénéfice</div>
                <div
                  style={{
                    fontWeight: 700,
                    color: benefice() >= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {benefice().toLocaleString("fr-FR")} FCFA
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
              Aucune étiquette
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Client</th>
                    <th style={th}>Qté</th>
                    <th style={th}>Taille</th>
                    <th style={th}>Coût fabricant</th>
                    <th style={th}>Prix client</th>
                    <th style={th}>Bénéfice</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}>
                        <strong>{r.client}</strong>
                      </td>
                      <td style={td}>{r.quantite}</td>
                      <td style={td}>
                        {r.largeur} × {r.hauteur} cm
                      </td>
                      <td style={{ ...td, color: "#ea580c" }}>
                        {(r.cout_fabricant || 0).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td style={{ ...td, color: "#2563eb", fontWeight: 600 }}>
                        {(r.prix_client || r.total || 0).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td
                        style={{
                          ...td,
                          color: (r.benefice || 0) >= 0 ? "#059669" : "#dc2626",
                          fontWeight: 700,
                        }}
                      >
                        {(r.benefice || 0).toLocaleString("fr-FR")} FCFA
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