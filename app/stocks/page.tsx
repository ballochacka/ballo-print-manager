"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StocksPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    produit: "",
    quantite: "0",
    seuil: "5",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stocks")
      .select("*")
      .order("produit", { ascending: true });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const resetForm = () => {
    setForm({ produit: "", quantite: "0", seuil: "5" });
    setEditId(null);
    setShowForm(false);
  };

  const ouvrirModif = (r: any) => {
    setEditId(r.id);
    setForm({
      produit: r.produit || r.nom || "",
      quantite: String(r.quantite ?? r.qte ?? 0),
      seuil: String(r.seuil ?? r.seuil_alerte ?? 5),
    });
    setShowForm(true);
  };

  const enregistrer = async () => {
    if (!form.produit.trim()) {
      alert("Nom du produit obligatoire");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    const payload: any = {
      produit: form.produit.trim(),
      quantite: Number(form.quantite) || 0,
      seuil: Number(form.seuil) || 0,
    };

    if (user) payload.owner_id = user.id;

    if (editId) {
      const { error } = await supabase.from("stocks").update(payload).eq("id", editId);
      if (error) {
        // colonnes alternatives
        const { error: e2 } = await supabase
          .from("stocks")
          .update({
            produit: payload.produit,
            qte: payload.quantite,
            seuil_alerte: payload.seuil,
          })
          .eq("id", editId);
        if (e2) {
          alert("Erreur : " + (error.message || e2.message));
          return;
        }
      }
    } else {
      const { error } = await supabase.from("stocks").insert([payload]);
      if (error) {
        alert("Erreur : " + error.message);
        return;
      }
    }

    resetForm();
    charger();
  };

  const ajouterQuantite = async (r: any) => {
    const saisie = prompt(
      `Ajouter quelle quantité pour « ${r.produit || r.nom} » ?\n(Stock actuel : ${r.quantite ?? r.qte ?? 0})`,
      "10"
    );
    if (saisie === null) return;
    const plus = Number(saisie);
    if (!plus || plus <= 0) {
      alert("Quantité invalide");
      return;
    }

    const actuelle = Number(r.quantite ?? r.qte ?? 0);
    const nouvelle = actuelle + plus;

    let { error } = await supabase
      .from("stocks")
      .update({ quantite: nouvelle })
      .eq("id", r.id);

    if (error) {
      ({ error } = await supabase.from("stocks").update({ qte: nouvelle }).eq("id", r.id));
    }

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce produit du stock ?")) return;
    await supabase.from("stocks").delete().eq("id", id);
    charger();
  };

  const nom = (r: any) => r.produit || r.nom || "—";
  const qte = (r: any) => Number(r.quantite ?? r.qte ?? 0);
  const seuil = (r: any) => Number(r.seuil ?? r.seuil_alerte ?? 5);
  const estBas = (r: any) => qte(r) <= seuil(r);

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
          <h2 style={{ margin: 0, fontSize: 18 }}>Stocks</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
            Modifier, ajouter une quantité, ou créer un produit
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          style={{
            background: "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          + Nouveau produit
        </button>
      </header>

      <div style={{ padding: 16 }}>
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
            <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>
              {editId ? "Modifier le stock" : "Nouveau produit"}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              <input
                placeholder="Nom du produit"
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min="0"
                placeholder="Seuil alerte"
                value={form.seuil}
                onChange={(e) => setForm({ ...form, seuil: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={enregistrer}
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
                onClick={resetForm}
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
              Aucun produit en stock
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Produit</th>
                    <th style={th}>Quantité</th>
                    <th style={th}>Seuil</th>
                    <th style={th}>État</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}>
                        <strong>{nom(r)}</strong>
                      </td>
                      <td style={{ ...td, fontWeight: 700 }}>{qte(r)}</td>
                      <td style={td}>{seuil(r)}</td>
                      <td style={td}>
                        {estBas(r) ? (
                          <span
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              padding: "2px 8px",
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
                              background: "#d1fae5",
                              color: "#059669",
                              padding: "2px 8px",
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
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => ajouterQuantite(r)}
                            style={btnVert}
                            title="Ajouter une quantité"
                          >
                            + Stock
                          </button>
                          <button onClick={() => ouvrirModif(r)} style={btnBleu}>
                            Modifier
                          </button>
                          <button onClick={() => supprimer(r.id)} style={btnRouge}>
                            Supprimer
                          </button>
                        </div>
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

const btnVert: React.CSSProperties = {
  background: "#d1fae5",
  color: "#047857",
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const btnBleu: React.CSSProperties = {
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: 600,
};

const btnRouge: React.CSSProperties = {
  background: "#fee2e2",
  color: "#dc2626",
  border: "none",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
  fontSize: 11,
};
