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
              <div style={{ fontSize: 12, opacity: 0.9, margin
