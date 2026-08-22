"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LeconsPage() {
  const [lecons, setLecons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    titre: "",
    matiere: "Word",
    description: "",
    duree: "",
    fichier: null as File | null,
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

  const telechargerFichier = async (file: File) => {
    const nomFichier = `\( {Date.now()}- \){file.name.replace(/\s/g, "_")}`;
    const { error } = await supabase.storage
      .from("lecons")
      .upload(nomFichier, file);

    if (error) throw error;

    const { data } = supabase.storage.from("lecons").getPublicUrl(nomFichier);
    return data.publicUrl;
  };

  const ajouter = async () => {
    if (!form.titre) {
      alert("Le titre est obligatoire");
      return;
    }

    setUploading(true);
    let fichier_url = null;

    try {
      if (form.fichier) {
        fichier_url = await telechargerFichier(form.fichier);
      }

      const { error } = await supabase.from("lecons").insert([
        {
          titre: form.titre,
          matiere: form.matiere,
          description: form.description,
          duree: form.duree,
          fichier_url,
        },
      ]);

      if (error) throw error;

      setForm({ titre: "", matiere: "Word", description: "", duree: "", fichier: null });
      setShowForm(false);
      setMessage("Leçon ajoutée avec succès");
      setTimeout(() => setMessage(""), 3000);
      charger();
    } catch (err: any) {
      alert("Erreur : " + (err.message || "upload impossible"));
      console.error(err);
    }

    setUploading(false);
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette leçon ?")) return;
    await supabase.from("lecons").delete().eq("id", id);
    charger();
  };

  const imprimer = (url: string) => {
    const w = window.open(url, "_blank");
    if (w) {
      w.onload = () => {
        w.focus();
        w.print();
      };
    }
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
                placeholder="Durée (ex: 1h)"
                value={form.duree}
                onChange={(e) => setForm({ ...form, duree: e.target.value })}
                style={inputStyle}
              />
              <textarea
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 70 }}
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 6 }}>
                  Téléverser le PDF de la leçon
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) =>
                    setForm({ ...form, fichier: e.target.files?.[0] || null })
                  }
                  style={{ fontSize: 13 }}
                />
                {form.fichier && (
                  <p style={{ fontSize: 12, color: "#059669", marginTop: 6 }}>
                    Fichier choisi : {form.fichier.name}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={ajouter}
                disabled={uploading}
                style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}
              >
                {uploading ? "Envoi..." : "Enregistrer"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}
              >
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
                    <th style={thStyle}>Fichier</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lecons.map((l) => (
                    <tr key={l.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={tdStyle}>
                        <strong>{l.titre}</strong>
                        {l.description && (
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{l.description}</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "3px 8px", borderRadius: 999, fontSize: 11 }}>
                          {l.matiere}
                        </span>
                      </td>
                      <td style={tdStyle}>{l.duree || "—"}</td>
                      <td style={tdStyle}>
                        {l.fichier_url ? (
                          <a href={l.fichier_url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontSize: 12 }}>
                            Voir le PDF
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>Aucun</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {l.fichier_url && (
                            <button
                              onClick={() => imprimer(l.fichier_url)}
                              style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}
                            >
                              Imprimer
                            </button>
                          )}
                          <button
                            onClick={() => supprimer(l.id)}
                            style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}
                          >
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

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#6b7280",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
};