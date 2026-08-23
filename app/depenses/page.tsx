"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ libelle: "", montant: "" });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("depenses").select("*").order("created_at", { ascending: false });
    setDepenses(data || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async () => {
    if (!form.libelle || !form.montant) return alert("Libellé et montant obligatoires");
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("depenses").insert([{
      libelle: form.libelle,
      montant: Number(form.montant) || 0,
      owner_id: user.id,
    }]);

    if (error) return alert("Erreur : " + error.message);
    setForm({ libelle: "", montant: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("depenses").delete().eq("id", id);
    charger();
  };

  const total = depenses.reduce((s, d) => s + (d.montant || 0), 0);

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Dépenses</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>+ Dépense</button>
      </header>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12, padding: 14, background: "#fff7ed", borderRadius: 12, color: "#c2410c", fontWeight: 700 }}>
          Total dépenses : {total.toLocaleString("fr-FR")} FCFA
        </div>

        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <input placeholder="Libellé (ex: Papier A4)" value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Montant" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div> :
          depenses.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune dépense</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={th}>Libellé</th><th style={th}>Montant</th><th style={th}>Date</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={td}>{d.libelle}</td>
                    <td style={{ ...td, color: "#ea580c", fontWeight: 600 }}>{(d.montant || 0).toLocaleString("fr-FR")} FCFA</td>
                    <td style={td}>{d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td style={td}>
                      <button onClick={() => supprimer(d.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>Supprimer</button>
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