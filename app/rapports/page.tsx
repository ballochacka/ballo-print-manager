"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
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

      const { data: commandes } = await supabase.from("commandes").select("*");
      const { data: maillots } = await supabase.from("maillots").select("*");
      const { data: eleves } = await supabase.from("eleves").select("*");
      const { data: etiquettes } = await supabase.from("etiquettes").select("*");
      const { data: wifi } = await supabase.from("wifi_zone").select("*");
      const { data: depenses } = await supabase.from("depenses").select("*");

      let commandesCA = 0;
      let commandesAchat = 0;
      (commandes || []).forEach((c: any) => {
        const vente =
          parseFloat(
            (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
          ) || 0;
        commandesCA += vente;
        commandesAchat += c.prix_achat || 0;
      });

      let maillotsCA = 0;
      let maillotsAchat = 0;
      (maillots || []).forEach((m: any) => {
        maillotsCA += m.total || 0;
        maillotsAchat += (m.prix_maillot || 0) * (m.quantite || 1);
      });

      let formationsCA = 0;
      (eleves || []).forEach((e: any) => {
        formationsCA += e.total_paye || 0;
      });

      let etiquettesCA = 0;
      (etiquettes || []).forEach((e: any) => {
        etiquettesCA += e.total || 0;
      });

      let wifiCA = 0;
      (wifi || []).forEach((w: any) => {
        wifiCA += w.prix || 0;
      });
      const wifiCout = 16000;
      const wifiBenefice = wifiCA - wifiCout;

      let depensesTotal = 0;
      (depenses || []).forEach((d: any) => {
        depensesTotal += d.montant || 0;
      });

      // Évolution
      const map: Record<string, number> = {};
      const ajouterJour = (dateStr: string | null, montant: number) => {
        if (!dateStr) return;
        const jour = new Date(dateStr).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
        map[jour] = (map[jour] || 0) + montant;
      };

      (commandes || []).forEach((c: any) => {
        const vente =
          parseFloat(
            (c.montant || "0").toString().replace(/[^\d.,]/g, "").replace(",", ".")
          ) || 0;
        ajouterJour(c.created_at, vente - (c.prix_achat || 0));
      });
      (maillots || []).forEach((m: any) => {
        ajouterJour(
          m.created_at,
          (m.total || 0) - (m.prix_maillot || 0) * (m.quantite || 1)
        );
      });
      (eleves || []).forEach((e: any) => ajouterJour(e.created_at, e.total_paye || 0));
      (etiquettes || []).forEach((e: any) => ajouterJour(e.created_at, e.total || 0));
      (wifi || []).forEach((w: any) => ajouterJour(w.created_at, w.prix || 0));
      (depenses || []).forEach((d: any) => ajouterJour(d.created_at, -(d.montant || 0)));

      const evo = Object.entries(map)
        .map(([jour, benefice]) => ({ jour, benefice }))
        .slice(-7);

      setStats({
        commandesCA,
        commandesAchat,
        commandesBenefice: commandesCA - commandesAchat,
        commandesNb: commandes?.length || 0,
        maillotsCA,
        maillotsAchat,
        maillotsBenefice: maillotsCA - maillotsAchat,
        maillotsNb: maillots?.length || 0,
        formationsCA,
        formationsNb: eleves?.length || 0,
        etiquettesCA,
        etiquettesNb: etiquettes?.length || 0,
        wifiCA,
        wifiCout,
        wifiBenefice,
        wifiNb: wifi?.length || 0,
        depensesTotal,
        depensesNb: depenses?.length || 0,
      });
      setEvolution(evo);
      setLoading(false);
    }

    charger();
  }, []);

  const totalCA =
    stats.commandesCA +
    stats.maillotsCA +
    stats.formationsCA +
    stats.etiquettesCA +
    stats.wifiCA;

  const totalAchat =
    stats.commandesAchat +
    stats.maillotsAchat +
    stats.wifiCout +
    stats.depensesTotal;

  const totalBenefice =
    stats.commandesBenefice +
    stats.maillotsBenefice +
    stats.formationsCA +
    stats.etiquettesCA +
    stats.wifiBenefice -
    stats.depensesTotal;

  const maxBenef = Math.max(...evolution.map((e) => Math.abs(e.benefice)), 1);

  const card = {
    background: "white",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 16,
  };

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Rapports</h2>
      </header>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Chargement...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "white", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Chiffre d'affaires total</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
                  {totalCA.toLocaleString("fr-FR")} FCFA
                </div>
              </div>

              <div style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Total achats + dépenses</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
                  {totalAchat.toLocaleString("fr-FR")} FCFA
                </div>
              </div>

              <div style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "white", borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, opacity: 0.9 }}>Bénéfice net</div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
                  {totalBenefice.toLocaleString("fr-FR")} FCFA
                </div>
              </div>
            </div>

            {/* Graphique simple */}
            <div style={{ ...card, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>Évolution des bénéfices</h3>
              <p style={{ marginTop: -6, color: "#6b7280", fontSize: 12 }}>Les dépenses baissent le bénéfice</p>

              {evolution.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>Pas encore assez de données</p>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180, marginTop: 12 }}>
                  {evolution.map((item, index) => {
                    const height = Math.max((Math.abs(item.benefice) / maxBenef) * 100, 8);
                    const isPositif = item.benefice >= 0;
                    return (
                      <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: isPositif ? "#059669" : "#dc2626" }}>
                          {item.benefice.toLocaleString("fr-FR")}
                        </span>
                        <div style={{ width: "100%", maxWidth: 40, height: 130, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
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
              <div style={card}>
                <h3 style={{ marginTop: 0 }}>Commandes</h3>
                <p>Nombre : {stats.commandesNb}</p>
                <p>CA : <b style={{ color: "#2563eb" }}>{stats.commandesCA.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Achats : <b style={{ color: "#ea580c" }}>{stats.commandesAchat.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Bénéfice : <b style={{ color: "#059669" }}>{stats.commandesBenefice.toLocaleString("fr-FR")} FCFA</b></p>
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>Maillots</h3>
                <p>Nombre : {stats.maillotsNb}</p>
                <p>CA : <b style={{ color: "#2563eb" }}>{stats.maillotsCA.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Achats : <b style={{ color: "#ea580c" }}>{stats.maillotsAchat.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Bénéfice : <b style={{ color: "#059669" }}>{stats.maillotsBenefice.toLocaleString("fr-FR")} FCFA</b></p>
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>Formations</h3>
                <p>Élèves : {stats.formationsNb}</p>
                <p>Encaissé : <b style={{ color: "#2563eb" }}>{stats.formationsCA.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Bénéfice : <b style={{ color: "#059669" }}>{stats.formationsCA.toLocaleString("fr-FR")} FCFA</b></p>
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>Étiquettes</h3>
                <p>Commandes : {stats.etiquettesNb}</p>
                <p>CA : <b style={{ color: "#2563eb" }}>{stats.etiquettesCA.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Bénéfice : <b style={{ color: "#059669" }}>{stats.etiquettesCA.toLocaleString("fr-FR")} FCFA</b></p>
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>WiFi Zone</h3>
                <p>Ventes : {stats.wifiNb}</p>
                <p>CA : <b style={{ color: "#2563eb" }}>{stats.wifiCA.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Coût mensuel : <b style={{ color: "#ea580c" }}>{stats.wifiCout.toLocaleString("fr-FR")} FCFA</b></p>
                <p>Bénéfice : <b style={{ color: stats.wifiBenefice >= 0 ? "#059669" : "#dc2626" }}>{stats.wifiBenefice.toLocaleString("fr-FR")} FCFA</b></p>
              </div>

              <div style={card}>
                <h3 style={{ marginTop: 0 }}>Dépenses / Achats</h3>
                <p>Nombre : {stats.depensesNb}</p>
                <p>Total dépensé : <b style={{ color: "#dc2626" }}>- {stats.depensesTotal.toLocaleString("fr-FR")} FCFA</b></p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>
                  Ces montants sont automatiquement retirés du bénéfice net.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}