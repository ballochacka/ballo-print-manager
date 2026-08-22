"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LeconsPage() {
  const [lecons, setLecons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    titre: "",
    matiere: "Word",
    description: "",
    duree: "",
  });

  const matieres = ["Word", "Excel", "PowerPoint", "Internet", "Photoshop", "Autre"];

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("lecons")
      .select("*")
      .order("created_at", { ascending: false });
    setLecons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async () => {
    if (!form.titre) {
      alert("Le titre est obligatoire");
      return;
    }

    const { error } = await supabase.from("lecons").insert([
      {
        titre: form.titre,
        matiere: form.matiere,
        description: form.description,
        duree: form.duree,
      },
    ]);

    if (error) {
      alert("Erreur lors de l'ajout");
      return;
    }

    setForm({ titre: "", matiere: "Word", description: "", duree: "" });
    setShowForm(false);
    setMessage("Leçon ajoutée");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette leçon ?")) return;
    await supabase.from("lecons").delete().eq("id", id);
    charger();
  };

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Leçons</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}
        >
          + Nouvelle leçon
        </button>
      </header>

      <div style={{ padding: 16 }}>
        {message && (
          <div style={{ marginBottom: 12, padding: 12, background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 14 }}>
            {message}
          </div>
        )}

        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Nouvelle leçon</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <input
                placeholder="Titre de la leçon"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                style={inputStyle}
              />
              <select
                value={form.matiere}
                onChange={(e) => setForm({ ...form, matiere: e.target.value })}
                style={inputStyle}
              >
                {matieres.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                placeholder="Durée (ex: 1h, 2 séances)"
                value={form.duree}
                onChange={(e) => setForm({ ...form, duree: e.target.value })}
                style={inputStyle}
              />
              <textarea
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 80 }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                Enregistrer
              </button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
          ) : lecons.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune leçon enregistrée</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={thStyle}>Titre</th>
                    <th style={thStyle}>Matière</th>
                    <th style={thStyle}>Durée</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lecons.map((l) => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={tdStyle}><strong>{l.titre}</strong></td>
                      <td style={tdStyle}>
                        <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "3px 8px", borderRadius: 999, fontSize: 11 }}>
                          {l.matiere}
                        </span>
                      </td>
                      <td style={tdStyle}>{l.duree || "—"}</td>
                      <td style={tdStyle}>{l.description || "—"}</td>
                      <td style={{ ...tdStyle, color: "#6b7280", fontSize: 12 }}>
                        {l.created_at ? new Date(l.created_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => supprimer(l.id)}
                          style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}
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

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#6b7280",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
};