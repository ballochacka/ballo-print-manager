"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));
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
  const [evolution, setEvolution] = useState<{ jour: string; benefice: number }[]>([]);

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

      // Graphique par jour du mois
      const map: Record<string, number> = {};
      const ajouterJour = (dateStr: string | null, montant: number) => {
        if (!dateStr || !dansMois(dateStr)) return;
        const jour = new Date(dateStr).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
        map[jour] = (map[jour] || 0) + montant;
      };

      (commandes || []).forEach((c: any) => {
        const vente = parseFloat((c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        ajouterJour(c.created_at, vente - (c.prix_achat || 0));
      });
      (maillots || []).forEach((m: any) => {
        ajouterJour(m.created_at, (m.total || 0) - (m.prix_maillot || 0) * (m.quantite || 1));
      });
      (eleves || []).forEach((e: any) => ajouterJour(e.created_at, e.total_paye || 0));
      (etiquettes || []).forEach((e: any) => ajouterJour(e.created_at, e.total || 0));
      (wifi || []).forEach((w: any) => ajouterJour(w.created_at, w.prix || 0));
      (depenses || []).forEach((d: any) => ajouterJour(d.created_at, -(d.montant || 0)));

      const evo = Object.entries(map)
        .map(([jour, benefice]) => ({ jour, benefice }))
        .sort((a, b) => {
          const [da, ma] = a.jour.split("/").map(Number);
          const [db, mb] = b.jour.split("/").map(Number);
          return ma === mb ? da - db : ma - mb;
        });

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
        wifiCout: 16000,
        wifiBenefice: wifiCA - 16000,
        wifiNb,
        depensesTotal,
        depensesNb,
      });
      setEvolution(evo);
      setLoading(false);
    }

    charger();
  }, [mois]);

  const totalCA =
    stats.commandesCA + stats.maillotsCA + stats.formationsCA + stats.etiquettesCA + stats.wifiCA;
  const totalAchat =
    stats.commandesAchat + stats.maillotsAchat + stats.wifiCout + stats.depensesTotal;
  const totalBenefice =
    stats.commandesBenefice +
    stats.maillotsBenefice +
    stats.formationsCA +
    stats.etiquettesCA +
    stats.wifiBenefice -
    stats.depensesTotal;

  const maxBenef = Math.max(...evolution.map((e) => Math.abs(e.benefice)), 1);

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
            onClick={() => window.print()}
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

            {/* Graphique */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Évolution des bénéfices</h3>
              <p style={{ marginTop: -6, color: "#6b7280", fontSize: 12 }}>Par jour sur le mois sélectionné</p>

              {evolution.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>Pas de données pour ce mois</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 180, marginTop: 12, overflowX: "auto" }}>
                  {evolution.map((item, index) => {
                    const height = Math.max((Math.abs(item.benefice) / maxBenef) * 100, 8);
                    const isPositif = item.benefice >= 0;
                    return (
                      <div key={index} style={{ flex: "1 0 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: isPositif ? "#059669" : "#dc2626" }}>
                          {item.benefice.toLocaleString("fr-FR")}
                        </span>
                        <div style={{ width: "100%", maxWidth: 36, height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                          <div
                            style={{
                              width: "100%",
                              height: height + "%",
                              borderRadius: "8px 8px 0 0",
                              background: isPositif
                                ? "linear-gradient(to top, #10b981, #34d399)"
                                : "linear-gradient(to top, #ef4444, #f87171)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{item.jour}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Détails */}
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