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

    // --- Commandes ---
    let cCa = 0,
      cAchat = 0;
    (commandes || []).filter((r) => dansPeriode(r.created_at)).forEach((r: any) => {
      cCa += n(r.montant);
      cAchat += n(r.prix_achat);
    });
    setCmd({ ca: cCa, achat: cAchat, benef: cCa - cAchat });

    // --- Maillots ---
    let mCa = 0,
      mAchat = 0;
    (maillotsData || []).filter((r) => dansPeriode(r.created_at)).forEach((r: any) => {
      // total client / vente
      mCa += n(r.montant || r.prix_total || r.total || r.prix_vente);
      mAchat += n(r.prix_achat || r.cout || r.total_achat);
    });
    setMaillots({ ca: mCa, achat: mAchat, benef: mCa - mAchat });

    // --- Étiquettes ---
    let eCa = 0,
      eAchat = 0;
    (etiquettesData || []).filter((r) => dansPeriode(r.created_at)).forEach((r: any) => {
      eCa += n(r.montant_client || r.montant || r.prix_total || r.total);
      eAchat += n(r.prix_entreprise || r.prix_achat || r.cout);
    });
    setEtiquettes({ ca: eCa, achat: eAchat, benef: eCa - eAchat });

    // --- Business ---
    let bCa = 0,
      bAchat = 0;
    (businessData || []).filter((r) => dansPeriode(r.created_at)).forEach((r: any) => {
      bCa += n(r.prix_vente || r.montant);
      bAchat += n(r.prix_achat);
    });
    setBusiness({ ca: bCa, achat: bAchat, benef: bCa - bAchat });

    // --- Formation (souvent tout le payé = bénéfice) ---
    let fCa = 0;
    (formationData || []).filter((r) => dansPeriode(r.created_at)).forEach((r: any) => {
      fCa += n(r.montant_paye || r.paye || r.inscription || r.total_paye || r.montant);
    });
    setFormation({ ca: fCa, benef: fCa });

    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, [dateDebut, dateFin]);

  const beneficeTotal =
    cmd.benef + maillots.benef + etiquettes.benef + business.benef + formation.benef;

  const lignes = [
    { nom: "Commandes / Ventes", benef: cmd.benef, detail: `CA ${cmd.ca.toLocaleString("fr-FR")} − Achats ${cmd.achat.toLocaleString("fr-FR")}` },
    { nom: "Maillots", benef: maillots.benef, detail: `CA ${maillots.ca.toLocaleString("fr-FR")} − Achats ${maillots.achat.toLocaleString("fr-FR")}` },
    { nom: "Étiquettes", benef: etiquettes.benef, detail: `Client ${etiquettes.ca.toLocaleString("fr-FR")} − Fabrication ${etiquettes.achat.toLocaleString("fr-FR")}` },
    { nom: "Business annexe", benef: business.benef, detail: `CA ${business.ca.toLocaleString("fr-FR")} − Achats ${business.achat.toLocaleString("fr-FR")}` },
    { nom: "Formation", benef: formation.benef, detail: `Montants encaissés ${formation.ca.toLocaleString("fr-FR")}` },
  ];

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
          Détail par activité + bénéfice total réel
        </p>
      </header>

      <div style={{ padding: 16 }}>
        {/* Filtres date */}
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
            {/* ========== BÉNÉFICE TOTAL (nouveau) ========== */}
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
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {beneficeTotal.toLocaleString("fr-FR")} FCFA
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 8 }}>
                Commandes + Maillots + Étiquettes + Business + Formation
              </div>
            </div>

            {/* Détail des bénéfices par partie */}
            <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Détail des bénéfices</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
                      fontSize: 20,
                      fontWeight: 800,
                      color: l.benef >= 0 ? "#059669" : "#dc2626",
                      marginTop: 4,
                    }}
                  >
                    {l.benef.toLocaleString("fr-FR")} FCFA
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{l.detail}</div>
                </div>
              ))}
            </div>

            {/* Récap classique CA / Achats (commandes) — inchangé dans l’esprit */}
            <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Commandes (détail CA)</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Mini titre="CA commandes" valeur={cmd.ca} couleur="#2563eb" />
              <Mini titre="Achats commandes" valeur={cmd.achat} couleur="#ea580c" />
              <Mini titre="Bénéfice commandes" valeur={cmd.benef} couleur="#059669" />
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Le bénéfice total en haut regroupe uniquement les gains (pas le chiffre d’affaires
              global mélangé). Filtre par dates pour voir un mois précis.
            </p>
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
