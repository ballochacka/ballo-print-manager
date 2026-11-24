"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MonthKey = string; // "2026-11"

function monthLabel(key: MonthKey) {
  const [y, m] = key.split("-").map(Number);
  const names = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
  ];
  return names[m - 1] + " " + y;
}

function toMonthKey(dateStr: string | null | undefined): MonthKey | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return y + "-" + m;
}

function currentMonthKey(): MonthKey {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function money(n: number) {
  return Math.round(n).toLocaleString("fr-FR") + " F";
}

export default function RapportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MonthKey>(currentMonthKey());
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Totaux par mois
  const [byMonth, setByMonth] = useState<
    Record<
      MonthKey,
      {
        ca: number;
        achats: number;
        depenses: number;
        benefice: number;
        commandes: number;
        etiquettes: number;
        maillots: number;
        formation: number;
        wifi: number;
      }
    >
  >({});

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const uid = session.user.id;
      setOwnerId(uid);

      // --- Charger chaque source (adapte les noms de tables si besoin) ---
      const [
        commandesRes,
        etiquettesRes,
        maillotsRes,
        formationRes,
        wifiRes,
        depensesRes,
      ] = await Promise.all([
        supabase
          .from("commandes")
          .select("created_at, date, total, montant, prix_achat, benefice, owner_id")
          .eq("owner_id", uid),
        supabase
          .from("etiquettes")
          .select("created_at, date, total, montant, benefice, cout, owner_id")
          .eq("owner_id", uid),
        supabase
          .from("maillots")
          .select("created_at, date, total, montant, benefice, prix_achat, owner_id")
          .eq("owner_id", uid),
        supabase
          .from("formations")
          .select("created_at, date, montant_paye, inscription, total_paye, owner_id")
          .eq("owner_id", uid),
        supabase
          .from("wifi_zone")
          .select("created_at, date, prix_total, montant, owner_id")
          .eq("owner_id", uid),
        supabase
          .from("depenses")
          .select("created_at, date, montant, owner_id")
          .eq("owner_id", uid),
      ]);

      const map: typeof byMonth = {};

      const ensure = (key: MonthKey) => {
        if (!map[key]) {
          map[key] = {
            ca: 0,
            achats: 0,
            depenses: 0,
            benefice: 0,
            commandes: 0,
            etiquettes: 0,
            maillots: 0,
            formation: 0,
            wifi: 0,
          };
        }
        return map[key];
      };

      // Commandes
      (commandesRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const m = ensure(key);
        const ca = Number(row.total ?? row.montant ?? 0) || 0;
        const achat = Number(row.prix_achat ?? 0) || 0;
        const ben =
          row.benefice != null ? Number(row.benefice) : ca - achat;
        m.ca += ca;
        m.achats += achat;
        m.commandes += ca;
        m.benefice += ben;
      });

      // Etiquettes
      (etiquettesRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const m = ensure(key);
        const ca = Number(row.total ?? row.montant ?? 0) || 0;
        const cout = Number(row.cout ?? 0) || 0;
        const ben =
          row.benefice != null ? Number(row.benefice) : ca - cout;
        m.ca += ca;
        m.achats += cout;
        m.etiquettes += ca;
        m.benefice += ben;
      });

      // Maillots
      (maillotsRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const m = ensure(key);
        const ca = Number(row.total ?? row.montant ?? 0) || 0;
        const achat = Number(row.prix_achat ?? 0) || 0;
        const ben =
          row.benefice != null ? Number(row.benefice) : ca - achat;
        m.ca += ca;
        m.achats += achat;
        m.maillots += ca;
        m.benefice += ben;
      });

      // Formation (argent paye = CA + benefice)
      (formationRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const m = ensure(key);
        const paye =
          Number(
            row.montant_paye ?? row.total_paye ?? row.inscription ?? 0
          ) || 0;
        m.ca += paye;
        m.formation += paye;
        m.benefice += paye; // formation = benefice tant qu'il n'y a pas de cout
      });

      // WiFi
      (wifiRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const m = ensure(key);
        const ca = Number(row.prix_total ?? row.montant ?? 0) || 0;
        m.ca += ca;
        m.wifi += ca;
        m.benefice += ca;
      });

      // Depenses : UNIQUEMENT sur le benefice (pas sur le CA)
      (depensesRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const m = ensure(key);
        const dep = Number(row.montant ?? 0) || 0;
        m.depenses += dep;
        m.benefice -= dep;
      });

      setByMonth(map);
      setLoading(false);
    };

    load();
  }, [router]);

  const months = useMemo(() => {
    return Object.keys(byMonth).sort().reverse();
  }, [byMonth]);

  const current = byMonth[selected] || {
    ca: 0,
    achats: 0,
    depenses: 0,
    benefice: 0,
    commandes: 0,
    etiquettes: 0,
    maillots: 0,
    formation: 0,
    wifi: 0,
  };

  const maxBar = Math.max(
    current.commandes,
    current.etiquettes,
    current.maillots,
    current.formation,
    current.wifi,
    1
  );

  const bars = [
    { label: "Commandes", value: current.commandes, color: "bg-purple-600" },
    { label: "Etiquettes", value: current.etiquettes, color: "bg-indigo-500" },
    { label: "Maillots", value: current.maillots, color: "bg-blue-500" },
    { label: "Formation", value: current.formation, color: "bg-emerald-500" },
    { label: "WiFi", value: current.wifi, color: "bg-amber-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-purple-800 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-white text-lg">
          ←
        </Link>
        <h1 className="font-bold text-lg flex-1">Rapports</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Selecteur de mois */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
          <label className="text-xs text-gray-500 font-medium">Mois affiche</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 bg-white"
          >
            {!months.includes(currentMonthKey()) && (
              <option value={currentMonthKey()}>
                {monthLabel(currentMonthKey())} (en cours)
              </option>
            )}
            {months.map((k) => (
              <option key={k} value={k}>
                {monthLabel(k)}
                {k === currentMonthKey() ? " (en cours)" : ""}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-gray-400 mt-1">
            Chaque mois a son propre compteur. Les anciens mois restent en historique.
          </p>
        </div>

        {/* Cartes resume */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Chiffre d affaires (CA)</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{money(current.ca)}</p>
            <p className="text-[11px] text-gray-400 mt-1">Argent encaisse — les depenses ne le baissent pas</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-xs text-gray-500">Achats / couts</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{money(current.achats)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <p className="text-xs text-gray-500">Depenses</p>
              <p className="text-lg font-bold text-red-600 mt-1">{money(current.depenses)}</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <p className="text-xs text-emerald-700 font-medium">Benefice net du mois</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{money(current.benefice)}</p>
            <p className="text-[11px] text-emerald-600 mt-1">
              CA − achats − depenses
            </p>
          </div>
        </div>

        {/* Barres par activite (dont Formation) */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-sm text-gray-900 mb-3">Detail par activite</h2>
          <div className="space-y-3">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{b.label}</span>
                  <span className="text-gray-600">{money(b.value)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={"h-full rounded-full " + b.color}
                    style={{ width: Math.min(100, (b.value / maxBar) * 100) + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Historique des mois */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-sm text-gray-900 mb-3">Historique des mois</h2>
          {months.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnee pour l instant.</p>
          )}
          <div className="space-y-2">
            {months.map((k) => {
              const row = byMonth[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  className={
                    "w-full text-left rounded-lg px-3 py-2.5 border transition " +
                    (k === selected
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-100 bg-gray-50 hover:bg-gray-100")
                  }
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {monthLabel(k)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {money(row.benefice)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    CA {money(row.ca)} · Depenses {money(row.depenses)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-center text-gray-400 px-2">
          Rappel : une depense diminue le <b>benefice</b>, jamais le chiffre d affaires.
        </p>
      </div>
    </div>
  );
}
