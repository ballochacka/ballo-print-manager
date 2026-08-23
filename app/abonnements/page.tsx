"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AbonnementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: "",
    nom_entreprise: "",
    montant: "15000",
    jours: "30",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("abonnements")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const activer = async () => {
    if (!form.email) {
      alert("Email obligatoire");
      return;
    }

    const jours = Number(form.jours) || 30;
    const debut = new Date();
    const fin = new Date();
    fin.setDate(fin.getDate() + jours);

    const { error } = await supabase.from("abonnements").insert([
      {
        email: form.email,
        nom_entreprise: form.nom_entreprise,
        actif: true,
        date_debut: debut.toISOString().slice(0, 10),
        date_fin: fin.toISOString().slice(0, 10),
        montant: Number(form.montant) || 0,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setForm({ email: "", nom_entreprise: "", montant: "15000", jours: "30" });
    charger();
  };

  const prolonger = async (id: string, dateFinActuelle: string) => {
    const base = dateFinActuelle ? new Date(dateFinActuelle) : new Date();
    if (base < new Date()) {
      base.setTime(Date.now());
    }
    base.setDate(base.getDate() + 30);

    await supabase
      .from("abonnements")
      .update({
        actif: true,
        date_fin: base.toISOString().slice(0, 10),
      })
      .eq("id", id);

    charger();
  };

  const suspendre = async (id: string) => {
    await supabase.from("abonnements").update({ actif: false }).eq("id", id);
    charger();
  };

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Abonnements</h2>
      </header>

      <div style={{ padding: 16 }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Activer un client</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <input placeholder="Email client" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            <input placeholder="Nom entreprise" value={form.nom_entreprise} onChange={(e) => setForm({ ...form, nom_entreprise: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Montant" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} style={inputStyle} />
            <input type="number" placeholder="Jours" value={form.jours} onChange={(e) => setForm({ ...form, jours: e.target.value })} style={inputStyle} />
          </div>
          <button onClick={activer} style={{ marginTop: 12, background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
            Activer 30 jours
          </button>
        </div>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucun abonnement</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={th}>Entreprise</th>
                  <th style={th}>Email</th>
                  <th style={th}>Fin</th>
                  <th style={th}>Statut</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const expire = r.date_fin ? new Date(r.date_fin) < new Date() : true;
                  const actif = r.actif && !expire;
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}>{r.nom_entreprise || "—"}</td>
                      <td style={td}>{r.email}</td>
                      <td style={td}>{r.date_fin ? new Date(r.date_fin).toLocaleDateString("fr-FR") : "—"}</td>
                      <td style={td}>
                        <span style={{ color: actif ? "#059669" : "#dc2626", fontWeight: 700 }}>
                          {actif ? "Actif" : "Expiré / suspendu"}
                        </span>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => prolonger(r.id, r.date_fin)} style={{ background: "#dcfce7", color: "#166534", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                            +30 jours
                          </button>
                          <button onClick={() => suspendre(r.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                            Suspendre
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 12, color: "#6b7280" };
const td: React.CSSProperties = { padding: "10px 12px" };