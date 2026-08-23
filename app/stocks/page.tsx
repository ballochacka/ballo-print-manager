"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [form, setForm] = useState({ nom: "", quantite: "", prix: "" });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("stocks").select("*").order("nom");
    setStocks(data || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async () => {
    if (!form.nom) return alert("Nom obligatoire");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Tu n'es pas connecté");

    const { error } = await supabase.from("stocks").insert([{
      nom: form.nom,
      quantite: Number(form.quantite) || 0,
      prix: Number(form.prix) || 0,
      owner_id: user.id,
    }]);

    if (error) return alert("Erreur : " + error.message);
    setForm({ nom: "", quantite: "", prix: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("stocks").delete().eq("id", id);
    charger();
  };

  const filtrés = stocks.filter((s) => (s.nom || "").toLowerCase().includes(recherche.toLowerCase()));

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Stocks</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db" }} />
          <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>+ Ajouter</button>
        </div>
      </header>

      <div style={{ padding: 16 }}>
        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              <input placeholder="Nom produit" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Prix" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div> :
          filtrés.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucun stock</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={th}>Produit</th><th style={th}>Quantité</th><th style={th}>Prix</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtrés.map((s) => (
                  <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={td}><strong>{s.nom}</strong></td>
                    <td style={td}>{s.quantite}</td>
                    <td style={td}>{(s.prix || 0).toLocaleString("fr-FR")} FCFA</td>
                    <td style={td}>
                      <button onClick={() => supprimer(s.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>Supprimer</button>
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