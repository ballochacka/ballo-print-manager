"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FormationPage() {
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

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

  const [paiementId, setPaiementId] = useState<string | null>(null);
  const [montantPaiement, setMontantPaiement] = useState("");

  const chargerEleves = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("eleves")
      .select("*")
      .order("created_at", { ascending: false });
    setEleves(data || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerEleves();
  }, []);

  const ajouterEleve = async () => {
    if (!form.nom || !form.prenom || !form.tarif_total) {
      alert("Nom, prénom et tarif total sont obligatoires");
      return;
    }

    const tarif = Number(form.tarif_total) || 0;
    const paye = Number(form.montant_paye) || 0;

    const { error } = await supabase.from("eleves").insert([
      {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        frais_inscription: 0,
        mensualite: 0,
        total_paye: paye,
        statut: "Actif",
        date_inscription: form.date_inscription || null,
        date_debut: form.date_debut || null,
        date_fin: form.date_fin || null,
        // on stocke le tarif total dans mensualite temporairement si pas de colonne dédiée
        // mieux: utiliser une colonne tarif_total si elle existe
      },
    ]);

    // On ajoute aussi tarif_total si la colonne existe
    // Pour être sûr, on met à jour juste après si besoin

    if (error) {
      // Essai avec tarif_total
      const { error: error2 } = await supabase.from("eleves").insert([
        {
          nom: form.nom,
          prenom: form.prenom,
          telephone: form.telephone,
          total_paye: paye,
          statut: "Actif",
          date_inscription: form.date_inscription || null,
          date_debut: form.date_debut || null,
          date_fin: form.date_fin || null,
          tarif_total: tarif,
        },
      ]);

      if (error2) {
        alert("Erreur. Vérifie que la colonne tarif_total existe (voir SQL plus bas).");
        console.error(error2);
        return;
      }
    } else {
      // Si insert OK sans tarif_total, on essaie de mettre à jour
      // (ignoré si colonne absente)
    }

    setForm({
      nom: "",
      prenom: "",
      telephone: "",
      tarif_total: "",
      montant_paye: "",
      date_inscription: new Date().toISOString().slice(0, 10),
      date_debut: new Date().toISOString().slice(0, 10),
      date_fin: "",
    });
    setShowForm(false);
    setMessage("Élève ajouté avec succès");
    setTimeout(() => setMessage(""), 3000);
    chargerEleves();
  };

  const ajouterPaiement = async (id: string) => {
    const montant = Number(montantPaiement);
    if (!montant || montant <= 0) {
      alert("Montant invalide");
      return;
    }

    const eleve = eleves.find((e) => e.id === id);
    if (!eleve) return;

    const nouveauTotal = (eleve.total_paye || 0) + montant;

    await supabase
      .from("eleves")
      .update({ total_paye: nouveauTotal })
      .eq("id", id);

    setPaiementId(null);
    setMontantPaiement("");
    chargerEleves();
  };

  const supprimerEleve = async (id: string) => {
    if (!confirm("Supprimer cet élève ?")) return;
    await supabase.from("eleves").delete().eq("id", id);
    chargerEleves();
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR");
  };

  const getTarif = (e: any) => {
    return e.tarif_total || e.mensualite || 0;
  };

  const getReste = (e: any) => {
    return Math.max(0, getTarif(e) - (e.total_paye || 0));
  };

  const getAlerteFin = (dateFin: string | null) => {
    if (!dateFin) return null;
    const fin = new Date(dateFin);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    const diffJours = Math.ceil((fin.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));

    if (diffJours < 0) return { texte: "Terminée", couleur: "#dc2626", fond: "#fee2e2" };
    if (diffJours === 0) return { texte: "Aujourd'hui", couleur: "#ea580c", fond: "#ffedd5" };
    if (diffJours <= 7) return { texte: `Fin dans ${diffJours} j`, couleur: "#d97706", fond: "#fef3c7" };
    return null;
  };

  const apercuReste =
    Math.max(0, (Number(form.tarif_total) || 0) - (Number(form.montant_paye) || 0));

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Formation</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer" }}
        >
          + Nouvel élève
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
            <h3 style={{ marginTop: 0 }}>Nouvel élève</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <input placeholder="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
              <input placeholder="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
              <input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />

              <input
                type="number"
                placeholder="Tarif total de la formation (FCFA)"
                value={form.tarif_total}
                onChange={(e) => setForm({ ...form, tarif_total: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Montant déjà payé (FCFA)"
                value={form.montant_paye}
                onChange={(e) => setForm({ ...form, montant_paye: e.target.value })}
                style={inputStyle}
              />

              <div>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Date d'inscription</label>
                <input type="date" value={form.date_inscription} onChange={(e) => setForm({ ...form, date_inscription: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Date de début</label>
                <input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280" }}>Date de fin</label>
                <input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {(form.tarif_total || form.montant_paye) && (
              <div style={{ marginTop: 12, padding: 12, background: "#f5f3ff", borderRadius: 10, fontSize: 14 }}>
                <div>Tarif total : <strong>{(Number(form.tarif_total) || 0).toLocaleString("fr-FR")} FCFA</strong></div>
                <div>Déjà payé : <strong style={{ color: "#059669" }}>{(Number(form.montant_paye) || 0).toLocaleString("fr-FR")} FCFA</strong></div>
                <div>Reste à payer : <strong style={{ color: "#ea580c" }}>{apercuReste.toLocaleString("fr-FR")} FCFA</strong></div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={ajouterEleve} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
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
          ) : eleves.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Aucun élève inscrit</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb", textAlign: "left" }}>
                    <th style={thStyle}>Élève</th>
                    <th style={thStyle}>Début / Fin</th>
                    <th style={thStyle}>Tarif total</th>
                    <th style={thStyle}>Payé</th>
                    <th style={thStyle}>Reste à payer</th>
                    <th style={thStyle}>Alerte</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {eleves.map((e) => {
                    const tarif = getTarif(e);
                    const reste = getReste(e);
                    const alerte = getAlerteFin(e.date_fin);

                    return (
                      <tr key={e.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={tdStyle}>
                          <strong>{e.prenom} {e.nom}</strong>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{e.telephone || ""}</div>
                        </td>
                        <td style={tdStyle}>
                          <div>{formatDate(e.date_debut)}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>→ {formatDate(e.date_fin)}</div>
                        </td>
                        <td style={tdStyle}>{tarif.toLocaleString("fr-FR")} FCFA</td>
                        <td style={{ ...tdStyle, color: "#059669", fontWeight: 600 }}>
                          {(e.total_paye || 0).toLocaleString("fr-FR")} FCFA
                        </td>
                        <td style={{ ...tdStyle, color: reste > 0 ? "#ea580c" : "#16a34a", fontWeight: 700 }}>
                          {reste.toLocaleString("fr-FR")} FCFA
                        </td>
                        <td style={tdStyle}>
                          {alerte ? (
                            <span style={{ background: alerte.fond, color: alerte.couleur, padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                              {alerte.texte}
                            </span>
                          ) : (
                            <span style={{ color: "#16a34a", fontSize: 12 }}>En cours</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {paiementId === e.id ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <input
                                  type="number"
                                  placeholder="Montant"
                                  value={montantPaiement}
                                  onChange={(ev) => setMontantPaiement(ev.target.value)}
                                  style={{ width: 90, padding: 4, borderRadius: 6, border: "1px solid #d1d5db" }}
                                />
                                <button onClick={() => ajouterPaiement(e.id)} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                                  OK
                                </button>
                                <button onClick={() => setPaiementId(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setPaiementId(e.id)} style={{ background: "#dbeafe", color: "#1d4ed8", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                                + Paiement
                              </button>
                            )}
                            <button onClick={() => supprimerEleve(e.id)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                              Supprimer
                            </button>
                          </div>
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