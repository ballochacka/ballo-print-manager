"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LeconsPage() {
  const [lecons, setLecons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recherche, setRecherche] = useState("");

  const [form, setForm] = useState({
    titre: "",
    matiere: "Word",
    description: "",
    duree: "",
    fichier: null as File | null,
  });

  const matieres = ["Word", "Excel", "PowerPoint", "Internet", "Photoshop", "Autre"];

  const couleurs: Record<string, string> = {
    Word: "#2563eb",
    Excel: "#16a34a",
    PowerPoint: "#ea580c",
    Internet: "#7c3aed",
    Photoshop: "#db2777",
    Autre: "#64748b",
  };

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("lecons").select("*").order("created_at", { ascending: false });
    setLecons(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const telechargerFichier = async (file: File) => {
    const nomPropre = file.name.replace(/\s/g, "_").replace(/[^\w.\-]/g, "");
    const nomFichier = Date.now() + "-" + nomPropre;

    const { error } = await supabase.storage.from("Lecons").upload(nomFichier, file);
    if (error) throw error;

    const { data } = supabase.storage.from("Lecons").getPublicUrl(nomFichier);
    return data.publicUrl;
  };

  const ajouter = async () => {
    if (!form.titre) {
      alert("Le titre est obligatoire");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
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
          owner_id: user.id,
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

  const filtrées = lecons.filter((l) => {
    const q = recherche.toLowerCase();
    return (
      (l.titre || "").toLowerCase().includes(q) ||
      (l.matiere || "").toLowerCase().includes(q) ||
      (l.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Leçons</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Rechercher une leçon..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", minWidth: 180 }}
          />
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}
          >
            + Nouvelle leçon
          </button>
        </div>
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
              <input placeholder="Titre de la leçon" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} style={inputStyle} />
              <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })} style={inputStyle}>
                {matieres.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input placeholder="Durée (ex: 1h)" value={form.duree} onChange={(e) => setForm({ ...form, duree: e.target.value })} style={inputStyle} />
              <textarea placeholder="Description (optionnel)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1", minHeight: 70 }} />
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 13, color: "#6b7280", display: "block", marginBottom: 6 }}>
                  Téléverser le PDF de la leçon
                </label>
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setForm({ ...form, fichier: e.target.files?.[0] || null })} style={{ fontSize: 13 }} />
                {form.fichier && (
                  <p style={{ fontSize: 12, color: "#059669", marginTop: 6 }}>
                    Fichier choisi : {form.fichier.name}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={ajouter} disabled={uploading} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                {uploading ? "Envoi..." : "Enregistrer"}
              </button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
        ) : filtrées.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucune leçon trouvée</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {filtrées.map((l) => {
              const couleur = couleurs[l.matiere] || "#64748b";
              return (
                <div key={l.id} style={{ background: "white", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 110, background: couleur, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 28, fontWeight: 700 }}>
                    {l.matiere}
                  </div>
                  <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>{l.titre}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Durée : {l.duree || "—"}</p>
                    {l.description && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>{l.description}</p>}
                    <div style={{ marginTop: "auto", paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {l.fichier_url ? (
                        <>
                          <a href={l.fichier_url} target="_blank" rel="noreferrer" style={{ background: "#dbeafe", color: "#1d4ed8", textDecoration: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600 }}>
                            📄 Voir PDF
                          </a>
                          <button onClick={() => imprimer(l.fichier_url)} style={{ background: "#f3e8ff", color: "#7c3aed", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                            🖨️ Imprimer
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>Pas de PDF</span>
                      )}
                      <button onClick={() => supprimer(l.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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