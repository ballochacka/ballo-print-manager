"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function n(v: any) {
  return Number(v) || 0;
}

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [cmd, setCmd] = useState({ ca: 0, achat: 0, benef: 0 });
  const [maillots, setMaillots] = useState({ ca: 0, achat: 0, benef: 0 });
  const [etiquettes, setEtiquettes] = useState({ ca: 0, achat: 0, benef: 0 });
  const [business, setBusiness] = useState({ ca: 0, achat: 0, benef: 0 });
  const [formation, setFormation] = useState({ ca: 0, benef: 0 });
  const [parJour, setParJour] = useState<{ jour: string; benef: number }[]>([]);

  const dansPeriode = (created_at?: string) => {
    if (!created_at) return true;
    const d = created_at.slice(0, 10);
    if (dateDebut && d < dateDebut) return false;
    if (dateFin && d > dateFin) return false;
    return true;
  };

  const charger = async () => {
    setLoading(true);

    const [
      { data: commandes },
      { data: maillotsData },
      { data: etiquettesData },
      { data: businessData },
      { data: formationData },
    ] = await Promise.all([
      supabase.from("commandes").select("*"),
      supabase.from("maillots").select("*"),
      supabase.from("etiquettes").select("*"),
      supabase.from("business_ventes").select("*"),
      supabase.from("formations").select("*"),
    ]);

    const mapJour: Record<string, number> = {};

    const addJour = (created_at: string | undefined, benef: number) => {
      if (!created_at || !dansPeriode(created_at)) return;
      const j = created_at.slice(0, 10);
      mapJour[j] = (mapJour[j] || 0) + benef;
    };

    // Commandes
    let cCa = 0,
      cAchat = 0;
    (commandes || []).forEach((r: any) => {
      if (!dansPeriode(r.created_at)) return;
      const ca = n(r.montant);
      const achat = n(r.prix_achat);
      cCa += ca;
      cAchat += achat;
      addJour(r.created_at, ca - achat);
    });
    setCmd({ ca: cCa, achat: cAchat, benef: cCa - cAchat });

    // Maillots
    let mCa = 0,
      mAchat = 0;
    (maillotsData || []).forEach((r: any) => {
      if (!dansPeriode(r.created_at)) return;
      const ca = n(r.montant || r.prix_total || r.total || r.prix_vente);
      const achat = n(r.prix_achat || r.cout || r.total_achat);
      mCa += ca;
      mAchat += achat;
      addJour(r.created_at, ca - achat);
    });
    setMaillots({ ca: mCa, achat: mAchat, benef: mCa - mAchat });

    // Étiquettes
    let eCa = 0,
      eAchat = 0;
    (etiquettesData || []).forEach((r: any) => {
      if (!dansPeriode(r.created_at)) return;
      const ca = n(r.montant_client || r.montant || r.prix_total || r.total);
      const achat = n(r.prix_entreprise || r.prix_achat || r.cout);
      eCa += ca;
      eAchat += achat;
      addJour(r.created_at, ca - achat);
    });
    setEtiquettes({ ca: eCa, achat: eAchat, benef: eCa - eAchat });

    // Business
    let bCa = 0,
      bAchat = 0;
    (businessData || []).forEach((r: any) => {
      if (!dansPeriode(r.created_at)) return;
      const ca = n(r.prix_vente || r.montant);
      const achat = n(r.prix_achat);
      bCa += ca;
      bAchat += achat;
      addJour(r.created_at, ca - achat);
    });
    setBusiness({ ca: bCa, achat: bAchat, benef: bCa - bAchat });

    // Formation
    let fCa = 0;
    (formationData || []).forEach((r: any) => {
      if (!dansPeriode(r.created_at)) return;
      const paye = n(r.montant_paye || r.paye || r.inscription || r.total_paye || r.montant);
      fCa += paye;
      addJour(r.created_at, paye);
    });
    setFormation({ ca: fCa, benef: fCa });

    const jours = Object.keys(mapJour)
      .sort()
      .map((jour) => ({ jour, benef: mapJour[jour] }));
    setParJour(jours);

    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, [dateDebut, dateFin]);

  const beneficeTotal =
    cmd.benef + maillots.benef + etiquettes.benef + business.benef + formation.benef;

  const lignes = [
    { nom: "Commandes", benef: cmd.benef, couleur: "#7c3aed" },
    { nom: "Maillots", benef: maillots.benef, couleur: "#2563eb" },
    { nom: "Étiquettes", benef: etiquettes.benef, couleur: "#ea580c" },
    { nom: "Business", benef: business.benef, couleur: "#0f766e" },
    { nom: "Formation", benef: formation.benef, couleur: "#ca8a04" },
  ];

  const maxBarre = Math.max(...lignes.map((l) => Math.abs(l.benef)), 1);
  const maxJour = Math.max(...parJour.map((j) => Math.abs(j.benef)), 1);

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "12px 16px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18 }}>Rapports</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
          Bénéfice total + graphiques par activité et par date
        </p>
      </header>

      <div style={{ padding: 16 }}>
        {/* Filtres */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <label style={{ fontSize: 13 }}>
            Du{" "}
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: 13 }}>
            Au{" "}
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              style={inputStyle}
            />
          </label>
          <button
            onClick={() => {
              setDateDebut("");
              setDateFin("");
            }}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Tout afficher
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center" }}>Chargement...</div>
        ) : (
          <>
            {/* BÉNÉFICE TOTAL — inchangé */}
            <div
              style={{
                background: "linear-gradient(135deg, #065f46 0%, #047857 50%, #ca8a04 100%)",
                borderRadius: 16,
                padding: 20,
                color: "white",
                marginBottom: 20,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ fontSize: 14, opacity: 0.95, marginBottom: 6 }}>
                Bénéfice total (toutes activités)
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>
                {beneficeTotal.toLocaleString("fr-FR")} FCFA
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
                Commandes + Maillots + Étiquettes + Business + Formation
              </div>
            </div>

            {/* Cartes détail */}
            <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Détail des bénéfices</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {lignes.map((l) => (
                <div
                  key={l.nom}
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b" }}>{l.nom}</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: l.benef >= 0 ? l.couleur : "#dc2626",
                      marginTop: 4,
                    }}
                  >
                    {l.benef.toLocaleString("fr-FR")} F
                  </div>
                </div>
              ))}
            </div>

            {/* GRAPHIQUE 1 — barres par activité */}
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Bénéfices par activité</h3>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}>
                Plus la barre est haute, plus cette activité rapporte
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {lignes.map((l) => {
                  const pct = Math.round((Math.abs(l.benef) / maxBarre) * 100);
                  return (
                    <div key={l.nom}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          marginBottom: 4,
                        }}
                      >
                        <span>{l.nom}</span>
                        <strong style={{ color: l.benef >= 0 ? l.couleur : "#dc2626" }}>
                          {l.benef.toLocaleString("fr-FR")} F
                        </strong>
                      </div>
                      <div
                        style={{
                          height: 14,
                          background: "#f1f5f9",
                          borderRadius: 999,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: pct + "%",
                            height: "100%",
                            background: l.benef >= 0 ? l.couleur : "#dc2626",
                            borderRadius: 999,
                            transition: "width 0.4s ease",
                            minWidth: l.benef !== 0 ? 6 : 0,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRAPHIQUE 2 — évolution par date */}
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Évolution des bénéfices par date</h3>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}>
                Barre vers le haut = gain · vers le bas si un jour est négatif
              </p>

              {parJour.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Pas encore de données sur cette période.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    height: 180,
                    overflowX: "auto",
                    paddingBottom: 28,
                    position: "relative",
                  }}
                >
                  {/* ligne zéro */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 28 + 80,
                      borderTop: "1px dashed #cbd5e1",
                      pointerEvents: "none",
                    }}
                  />
                  {parJour.map((j) => {
                    const h = Math.round((Math.abs(j.benef) / maxJour) * 80);
                    const positif = j.benef >= 0;
                    return (
                      <div
                        key={j.jour}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: 36,
                          height: 160,
                          justifyContent: "flex-end",
                        }}
                        title={j.jour + " : " + j.benef.toLocaleString("fr-FR") + " F"}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: "#64748b",
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {j.benef !== 0 ? Math.round(j.benef / 1000) + "k" : "0"}
                        </div>
                        <div
                          style={{
                            width: 22,
                            height: Math.max(h, 4),
                            background: positif
                              ? "linear-gradient(180deg, #34d399, #059669)"
                              : "linear-gradient(180deg, #f87171, #dc2626)",
                            borderRadius: "6px 6px 2px 2px",
                          }}
                        />
                        <div
                          style={{
                            fontSize: 9,
                            color: "#94a3b8",
                            marginTop: 6,
                            transform: "rotate(-40deg)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {j.jour.slice(8, 10)}/{j.jour.slice(5, 7)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Détail CA commandes */}
            <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Commandes (détail CA)</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              <Mini titre="CA commandes" valeur={cmd.ca} couleur="#2563eb" />
              <Mini titre="Achats commandes" valeur={cmd.achat} couleur="#ea580c" />
              <Mini titre="Bénéfice commandes" valeur={cmd.benef} couleur="#059669" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Mini({
  titre,
  valeur,
  couleur,
}: {
  titre: string;
  valeur: number;
  couleur: string;
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b" }}>{titre}</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: couleur, marginTop: 4 }}>
        {valeur.toLocaleString("fr-FR")} FCFA
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginLeft: 6,
};
