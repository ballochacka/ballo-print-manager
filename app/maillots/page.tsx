"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MaillotsPage() {
  const [maillots, setMaillots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    client: "",
    type_maillot: "Maillot personnalisé DTF",
    quantite: "1",
    prix_maillot: "0",
    prix_perso: "2000",
  });

  const types = [
    "Maillot personnalisé DTF",
    "Maillot personnalisé vinyle",
    "Personnalisation seule (client apporte maillot)",
  ];

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("maillots").select("*").order("created_at", { ascending: false });
    setMaillots(data || []);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const totalLigne = () => {
    const qte = Number(form.quantite) || 1;
    const prixMaillot = Number(form.prix_maillot) || 0;
    const prixPerso = Number(form.prix_perso) || 0;
    return qte * (prixMaillot + prixPerso);
  };

  const ajouter = async () => {
    if (!form.client) {
      alert("Nom du client obligatoire");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const quantite = Number(form.quantite) || 1;
    const prix_maillot = Number(form.prix_maillot) || 0;
    const prix_perso = Number(form.prix_perso) || 0;
    const total = quantite * (prix_maillot + prix_perso);

    const { error } = await supabase.from("maillots").insert([
      {
        client: form.client,
        type_maillot: form.type_maillot,
        quantite,
        prix_maillot,
        prix_perso,
        total,
        owner_id: user.id,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setForm({
      client: "",
      type_maillot: "Maillot personnalisé DTF",
      quantite: "1",
      prix_maillot: "0",
      prix_perso: "2000",
    });
    setShowForm(false);
    setMessage("Maillot enregistré");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("maillots").delete().eq("id", id);
    charger();
  };

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Maillots</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}
        >
          + Nouveau
        </button>
      </header>

      <div style={{ padding: 16 }}>
        {message && (
          <div style={{ marginBottom: 12, padding: 12, background: "#dcfce7", color: "#166534", borderRadius: 10 }}>
            {message}
          </div>
        )}

        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <input placeholder="Nom client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} style={inputStyle} />
              <select value={form.type_maillot} onChange={(e) => setForm({ ...form, type_maillot: e.target.value })} style={inputStyle}>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input type="number" placeholder="Quantité" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Prix maillot (0 si client apporte)" value={form.prix_maillot} onChange={(e) => setForm({ ...form, prix_maillot: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Prix personnalisation" value={form.prix_perso} onChange={(e) => setForm({ ...form, prix_perso: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ marginTop: 10, fontSize: 14 }}>
              Total : <strong style={{ color: "#7c3aed" }}>{totalLigne().toLocaleString("fr-FR")} FCFA</strong>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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
          ) : maillots.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucun maillot</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Client</th>
                    <th style={th}>Type</th>
                    <th style={th}>Qté</th>
                    <th style={th}>Total</th>
                    <th style={th}>Date</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {maillots.map((m) => (
                    <tr key={m.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}><strong>{m.client}</strong></td>
                      <td style={td}>{m.type_maillot}</td>
                      <td style={td}>{m.quantite}</td>
                      <td style={{ ...td, color: "#059669", fontWeight: 600 }}>{(m.total || 0).toLocaleString("fr-FR")} FCFA</td>
                      <td style={td}>{m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                      <td style={td}>
                        <button onClick={() => supprimer(m.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
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

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#6b7280",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
};