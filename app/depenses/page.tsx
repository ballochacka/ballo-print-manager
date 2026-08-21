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
    const { data } = await supabase
      .from("depenses")
      .select("*")
      .order("created_at", { ascending: false });
    setDepenses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.libelle || !form.montant) {
      alert("Remplis le libellé et le montant");
      return;
    }

    const { error } = await supabase.from("depenses").insert([
      {
        libelle: form.libelle,
        montant: Number(form.montant) || 0,
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({ libelle: "", montant: "" });
    setShowForm(false);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    await supabase.from("depenses").delete().eq("id", id);
    charger();
  };

  const total = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Dépenses / Achats</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>
          + Nouvelle dépense
        </button>
      </header>

      <div style={{ padding: 16 }}>
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <strong>Total des dépenses :</strong> {total.toLocaleString("fr-FR")} FCFA
        </div>

        {showForm && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Nouvelle dépense</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <input
                placeholder="Ex: Paquet papier A4"
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
              />
              <input
                type="number"
                placeholder="Montant (FCFA)"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                  Enregistrer
                </button>
                <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
          ) : depenses.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune dépense</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                  <th style={{ padding: 12 }}>Libellé</th>
                  <th style={{ padding: 12 }}>Montant</th>
                  <th style={{ padding: 12 }}>Date</th>
                  <th style={{ padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: 12 }}>{d.libelle}</td>
                    <td style={{ padding: 12, color: "#ea580c", fontWeight: 600 }}>
                      - {d.montant?.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td style={{ padding: 12, color: "#6b7280", fontSize: 12 }}>
                      {d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td style={{ padding: 12 }}>
                      <button onClick={() => supprimer(d.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>
                        Supprimer
                      </button>
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