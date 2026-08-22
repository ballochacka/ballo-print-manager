"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [stats, setStats] = useState({
    commandesCA: 0,
    commandesAchat: 0,
    commandesBenefice: 0,
    commandesNb: 0,
    maillotsCA: 0,
    maillotsAchat: 0,
    maillotsBenefice: 0,
    maillotsNb: 0,
    formationsCA: 0,
    formationsNb: 0,
    etiquettesCA: 0,
    etiquettesNb: 0,
    wifiCA: 0,
    wifiCout: 16000,
    wifiBenefice: 0,
    wifiNb: 0,
    depensesTotal: 0,
    depensesNb: 0,
  });

  useEffect(() => {
    async function charger() {
      setLoading(true);

      const debut = mois + "-01";
      const finDate = new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0);
      const fin = finDate.toISOString().slice(0, 10);

      const dansMois = (dateStr: string | null) => {
        if (!dateStr) return false;
        const d = dateStr.slice(0, 10);
        return d >= debut && d <= fin;
      };

      const { data: commandes } = await supabase.from("commandes").select("*");
      const { data: maillots } = await supabase.from("maillots").select("*");
      const { data: eleves } = await supabase.from("eleves").select("*");
      const { data: etiquettes } = await supabase.from("etiquettes").select("*");
      const { data: wifi } = await supabase.from("wifi_zone").select("*");
      const { data: depenses } = await supabase.from("depenses").select("*");

      let commandesCA = 0, commandesAchat = 0, commandesNb = 0;
      (commandes || []).filter((c: any) => dansMois(c.created_at)).forEach((c: any) => {
        const vente = parseFloat((c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        commandesCA += vente;
        commandesAchat += c.prix_achat || 0;
        commandesNb += 1;
      });

      let maillotsCA = 0, maillotsAchat = 0, maillotsNb = 0;
      (maillots || []).filter((m: any) => dansMois(m.created_at)).forEach((m: any) => {
        maillotsCA += m.total || 0;
        maillotsAchat += (m.prix_maillot || 0) * (m.quantite || 1);
        maillotsNb += 1;
      });

      let formationsCA = 0, formationsNb = 0;
      (eleves || []).filter((e: any) => dansMois(e.created_at)).forEach((e: any) => {
        formationsCA += e.total_paye || 0;
        formationsNb += 1;
      });

      let etiquettesCA = 0, etiquettesNb = 0;
      (etiquettes || []).filter((e: any) => dansMois(e.created_at)).forEach((e: any) => {
        etiquettesCA += e.total || 0;
        etiquettesNb += 1;
      });

      let wifiCA = 0, wifiNb = 0;
      (wifi || []).filter((w: any) => dansMois(w.created_at)).forEach((w: any) => {
        wifiCA += w.prix || 0;
        wifiNb += 1;
      });

      let depensesTotal = 0, depensesNb = 0;
      (depenses || []).filter((d: any) => dansMois(d.created_at)).forEach((d: any) => {
        depensesTotal += d.montant || 0;
        depensesNb += 1;
      });

      const wifiCout = 16000;

      setStats({
        commandesCA,
        commandesAchat,
        commandesBenefice: commandesCA - commandesAchat,
        commandesNb,
        maillotsCA,
        maillotsAchat,
        maillotsBenefice: maillotsCA - maillotsAchat,
        maillotsNb,
        formationsCA,
        formationsNb,
        etiquettesCA,
        etiquettesNb,
        wifiCA,
        wifiCout,
        wifiBenefice: wifiCA - wifiCout,
        wifiNb,
        depensesTotal,
        depensesNb,
      });
      setLoading(false);
    }

    charger();
  }, [mois]);

  const totalCA =
    stats.commandesCA + stats.maillotsCA + stats.formationsCA + stats.etiquettesCA + stats.wifiCA;
  const totalAchat = stats.commandesAchat + stats.maillotsAchat + stats.wifiCout + stats.depensesTotal;
  const totalBenefice =
    stats.commandesBenefice + stats.maillotsBenefice + stats.formationsCA + stats.etiquettesCA + stats.wifiBenefice - stats.depensesTotal;

  const imprimerRapport = () => {
    window.print();
  };

  const labelMois = new Date(mois + "-01").toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Rapports</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="month"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
          />
          <button
            onClick={imprimerRapport}
            style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}
          >
            Imprimer ce mois
          </button>
        </div>
      </header>

      <div style={{ padding: 16 }}>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Rapport du mois : <strong>{labelMois}</strong>
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>Chargement...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Chiffre d'affaires</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{totalCA.toLocaleString("fr-FR")} FCFA</div>
              </div>
              <div style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Achats + dépenses</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{totalAchat.toLocaleString("fr-FR")} FCFA</div>
              </div>
              <div style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Bénéfice net</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{totalBenefice.toLocaleString("fr-FR")} FCFA</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {[
                ["Commandes", stats.commandesNb, stats.commandesCA, stats.commandesAchat, stats.commandesBenefice],
                ["Maillots", stats.maillotsNb, stats.maillotsCA, stats.maillotsAchat, stats.maillotsBenefice],
                ["Formations", stats.formationsNb, stats.formationsCA, 0, stats.formationsCA],
                ["Étiquettes", stats.etiquettesNb, stats.etiquettesCA, 0, stats.etiquettesCA],
                ["WiFi Zone", stats.wifiNb, stats.wifiCA, stats.wifiCout, stats.wifiBenefice],
                ["Dépenses", stats.depensesNb, 0, stats.depensesTotal, -stats.depensesTotal],
              ].map(([titre, nb, ca, achat, benef]) => (
                <div key={String(titre)} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
                  <h3 style={{ marginTop: 0 }}>{titre}</h3>
                  <p style={{ margin: "4px 0" }}>Nombre : {nb as number}</p>
                  <p style={{ margin: "4px 0" }}>CA : <b style={{ color: "#2563eb" }}>{(ca as number).toLocaleString("fr-FR")} FCFA</b></p>
                  <p style={{ margin: "4px 0" }}>Coûts : <b style={{ color: "#ea580c" }}>{(achat as number).toLocaleString("fr-FR")} FCFA</b></p>
                  <p style={{ margin: "4px 0" }}>Bénéfice : <b style={{ color: (benef as number) >= 0 ? "#059669" : "#dc2626" }}>{(benef as number).toLocaleString("fr-FR")} FCFA</b></p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}