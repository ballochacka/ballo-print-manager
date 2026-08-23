"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FormationPage() {
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [paiementId, setPaiementId] = useState<string | null>(null);
  const [montantPaiement, setMontantPaiement] = useState("");
  const [editTarifId, setEditTarifId] = useState<string | null>(null);
  const [editTarifValue, setEditTarifValue] = useState("");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    tarif_total: "",
    montant_paye: "",
    date_inscription: new Date().toISOString().slice(0, 10),
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin: "",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase.from("eleves").select("*").order("created_at", { ascending: false });
    setEleves(data || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const ajouter = async () => {
    if (!form.nom || !form.prenom || !form.tarif_total) {
      alert("Nom, prénom et tarif total obligatoires");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("eleves").insert([{
      nom: form.nom,
      prenom: form.prenom,
      telephone: form.telephone || null,
      tarif_total: Number(form.tarif_total) || 0,
      total_paye: Number(form.montant_paye) || 0,
      statut: "Actif",
      date_inscription: form.date_inscription || null,
      date_debut: form.date_debut || null,
      date_fin: form.date_fin || null,
      owner_id: user.id,
    }]);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setForm({
      nom: "", prenom: "", telephone: "", tarif_total: "", montant_paye: "",
      date_inscription: new Date().toISOString().slice(0, 10),
      date_debut: new Date().toISOString().slice(0, 10),
      date_fin: "",
    });
    setShowForm(false);
    setMessage("Élève ajouté");
    setTimeout(() => setMessage(""), 3000);
    charger();
  };

  const ajouterPaiement = async (id: string) => {
    const montant = Number(montantPaiement);
    if (!montant || montant <= 0) return alert("Montant invalide");
    const eleve = eleves.find((e) => e.id === id);
    if (!eleve) return;
    await supabase.from("eleves").update({ total_paye: (eleve.total_paye || 0) + montant }).eq("id", id);
    setPaiementId(null);
    setMontantPaiement("");
    charger();
  };

  const sauvegarderTarif = async (id: string) => {
    await supabase.from("eleves").update({ tarif_total: Number(editTarifValue) || 0 }).eq("id", id);
    setEditTarifId(null);
    setEditTarifValue("");
    charger();
  };

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from("eleves").delete().eq("id", id);
    charger();
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
  const getReste = (e: any) => Math.max(0, (e.tarif_total || 0) - (e.total_paye || 0));

  const getAlerteFin = (dateFin: string | null) => {
    if (!dateFin) return null;
    const fin = new Date(dateFin);
    const auj = new Date();
    auj.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    const diff = Math.ceil((fin.getTime() - auj.getTime()) / 86400000);
    if (diff < 0) return { texte: "Terminée", couleur: "#dc2626", fond: "#fee2e2" };
    if (diff === 0) return { texte: "Aujourd'hui", couleur: "#ea580c", fond: "#ffedd5" };
    if (diff <= 7) return { texte: `Fin dans ${diff} j`, couleur: "#d97706", fond: "#fef3c7" };
    return null;
  };

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Formation</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}>+ Nouvel élève</button>
      </header>

      <div style={{ padding: 16 }}>
        {message && <div style={{ marginBottom: 12, padding: 12, background: "#dcfce7", color: "#166534", borderRadius: 10 }}>{message}</div>}

        {showForm && (
          <div style={{ marginBottom: 16, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
              <input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
              <input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Tarif total" value={form.tarif_total} onChange={(e) => setForm({ ...form, tarif_total: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Déjà payé" value={form.montant_paye} onChange={(e) => setForm({ ...form, montant_paye: e.target.value })} style={inputStyle} />
              <input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} style={inputStyle} />
              <input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={ajouter} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Enregistrer</button>
              <button onClick={() => setShowForm(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Annuler</button>
            </div>
          </div>
        )}

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {loading ? <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div> :
          eleves.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucun élève</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={th}>Élève</th><th style={th}>Début / Fin</th><th style={th}>Tarif</th><th style={th}>Payé</th><th style={th}>Reste</th><th style={th}>Alerte</th><th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((e) => {
                    const reste = getReste(e);
                    const alerte = getAlerteFin(e.date_fin);
                    return (
                      <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}><strong>{e.prenom} {e.nom}</strong><div style={{ fontSize: 11, color: "#6b7280" }}>{e.telephone || ""}</div></td>
                        <td style={td}>{formatDate(e.date_debut)} → {formatDate(e.date_fin)}</td>
                        <td style={td}>
                          {editTarifId === e.id ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <input type="number" value={editTarifValue} onChange={(ev) => setEditTarifValue(ev.target.value)} style={{ width: 90, padding: 4, borderRadius: 6, border: "1px solid #d1d5db" }} />
                              <button onClick={() => sauvegarderTarif(e.id)} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 6, padding: "4px 6px", cursor: "pointer" }}>OK</button>
                            </div>
                          ) : (
                            <span onClick={() => { setEditTarifId(e.id); setEditTarifValue(String(e.tarif_total || 0)); }} style={{ cursor: "pointer", textDecoration: "underline" }}>
                              {(e.tarif_total || 0).toLocaleString("fr-FR")} FCFA
                            </span>
                          )}
                        </td>
                        <td style={{ ...td, color: "#059669", fontWeight: 600 }}>{(e.total_paye || 0).toLocaleString("fr-FR")} FCFA</td>
                        <td style={{ ...td, color: reste > 0 ? "#ea580c" : "#16a34a", fontWeight: 700 }}>{reste.toLocaleString("fr-FR")} FCFA</td>
                        <td style={td}>
                          {alerte ? <span style={{ background: alerte.fond, color: alerte.couleur, padding: "3px 8px", borderRadius: 999, fontSize: 11 }}>{alerte.texte}</span> : <span style={{ color: "#16a34a", fontSize: 12 }}>En cours</span>}
                        </td>
                        <td style={td}>
                          {paiementId === e.id ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <input type="number" value={montantPaiement} onChange={(ev) => setMontantPaiement(ev.target.value)} style={{ width: 80, padding: 4, borderRadius: 6, border: "1px solid #d1d5db" }} />
                              <button onClick={() => ajouterPaiement(e.id)} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>OK</button>
                            </div>
                          ) : (
                            <button onClick={() => setPaiementId(e.id)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>+ Paiement</button>
                          )}
                          <button onClick={() => supprimer(e.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11, marginLeft: 6 }}>Supprimer</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", boxSizing: "border-box" };
const th: React.CSSProperties = { padding: "10px 12px", fontSize: 12, color: "#6b7280" };
const td: React.CSSProperties = { padding: "10px 12px" };