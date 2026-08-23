"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [form, setForm] = useState({ nom: "", telephone: "", email: "" });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async () => {
    if (!form.nom) return alert("Le nom est obligatoire");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Tu n'es pas connecté");

    const { error } = await supabase.from("clients").insert([{
      nom: form.nom,
      telephone: form.telephone,
      email: form.email,
      owner_id: user.id,
    }]);

    if (error) return alert("Erreur : " + error.message);
    setForm({ nom: "", telephone: "", email: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    await supabase.from("clients").delete().eq("id", id);
    charger();
  };

  const filtrés = clients.filter((c) => {
    const q = recherche.toLowerCase();
    return (c.nom || "").toLowerCase().includes(q) ||
      (c.telephone || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
  });

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Clients</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 180 }} />
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>+ Nouveau client</button>
        </div>
      </header>

      <div style={{ padding: 16 }}>
        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
              <input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div> :
          filtrés.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucun client</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={th}>Nom</th><th style={th}>Téléphone</th><th style={th}>Email</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtrés.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={td}><strong>{c.nom}</strong></td>
                    <td style={td}>{c.telephone || "—"}</td>
                    <td style={td}>{c.email || "—"}</td>
                    <td style={td}>
                      <button onClick={() => supprimer(c.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>Supprimer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box" };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 12, color: "#6b7280" };
const td: React.CSSProperties = { padding: "10px 12px" };