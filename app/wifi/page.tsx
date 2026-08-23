"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WifiPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client: "",
    duree: "1 jour",
    prix: "",
  });

  const durees = ["1 heure", "3 heures", "1 jour", "1 mois", "2 mois"];

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("wifi_zone").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async () => {
    if (!form.client || !form.prix) return alert("Client et prix obligatoires");
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("wifi_zone").insert([{
      client: form.client,
      duree: form.duree,
      prix: Number(form.prix) || 0,
      owner_id: user.id,
    }]);

    if (error) return alert("Erreur : " + error.message);
    setForm({ client: "", duree: "1 jour", prix: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("wifi_zone").delete().eq("id", id);
    charger();
  };

  const total = rows.reduce((s, r) => s + (r.prix || 0), 0);

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18 }}>WiFi Zone</h2>
        <button onClick={() => setShowForm(!showForm)} style={btnPrimary}>+ Vente</button>
      </header>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12, padding: 14, background: "#ecfdf5", borderRadius: 12, color: "#047857", fontWeight: 700 }}>
          Total WiFi : {total.toLocaleString("fr-FR")} FCFA
        </div>

        {showForm && (
          <div style={cardStyle}>
            <div style={gridStyle}>
              <input placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} style={inputStyle} />
              <select value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} style={inputStyle}>
                {durees.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="number" placeholder="Prix (FCFA)" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={ajouter} style={btnPrimary}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={btnGray}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div> :
          rows.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune vente</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Client</th><th style={th}>Durée</th><th style={th}>Prix</th><th style={th}>Date</th><th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}><strong>{r.client}</strong></td>
                      <td style={td}>{r.duree}</td>
                      <td style={{ ...td, color: "#059669", fontWeight: 600 }}>{(r.prix || 0).toLocaleString("fr-FR")} FCFA</td>
                      <td style={td}>{r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—"}</td>
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