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
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("etiquettes").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const calculerTotal = () => {
    const q = Number(form.quantite) || 1;
    const l = Number(form.largeur) || 0;
    const h = Number(form.hauteur) || 0;
    const p = Number(form.prix_m2) || 4500;
    const m2 = (l * h) / 10000;
    return Math.round(q * m2 * p);
  };

  const ajouter = async () => {
    if (!form.client) return alert("Client obligatoire");
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const total = calculerTotal();
    const { error } = await supabase.from("etiquettes").insert([{
      client: form.client,
      quantite: Number(form.quantite) || 1,
      largeur: Number(form.largeur) || 0,
      hauteur: Number(form.hauteur) || 0,
      prix_m2: Number(form.prix_m2) || 4500,
      total,
      owner_id: user.id,
    }]);

    if (error) return alert("Erreur : " + error.message);
    setForm({ client: "", quantite: "1", largeur: "", hauteur: "", prix_m2: "4500" });
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
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Étiquettes</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>+ Nouvelle</button>
      </header>

      <div style={{ padding: 16 }}>
        {showForm && (
          <div style={cardStyle}>
            <div style={gridStyle}>
              <input placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Largeur (cm)" value={form.largeur} onChange={(e) => setForm({ ...form, largeur: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Hauteur (cm)" value={form.hauteur} onChange={(e) => setForm({ ...form, hauteur: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Prix / m²" value={form.prix_m2} onChange={(e) => setForm({ ...form, prix_m2: e.target.value })} style={inputStyle} />
            </div>
            <p style={{ marginTop: 10 }}>Total : <b style={{ color: "#7c3aed" }}>{calculerTotal().toLocaleString("fr-FR")} FCFA</b></p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={ajouter} style={btnPrimary}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={btnGray}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div> :
          rows.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune étiquette</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Client</th><th style={th}>Qté</th><th style={th}>Taille</th><th style={th}>Total</th><th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}><strong>{r.client}</strong></td>
                      <td style={td}>{r.quantite}</td>
                      <td style={td}>{r.largeur} × {r.hauteur} cm</td>
                      <td style={{ ...td, color: "#059669", fontWeight: 600 }}>{(r.total || 0).toLocaleString("fr-FR")} FCFA</td>
                      <td style={td}>
                        <button onClick={() => supprimer(r.id)} style={btnDanger}>Supprimer</button>
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

const headerStyle: React.CSSProperties = { background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" };
const cardStyle: React.CSSProperties = { marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" };
const btnGray: React.CSSProperties = { background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" };
const btnDanger: React.CSSProperties = { background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 12, color: "#6b7280" };
const td: React.CSSProperties = { padding: "10px 12px" };