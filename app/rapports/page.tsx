"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MonthKey = string;

type Totaux = {
  ca: number;
  achats: number;
  depenses: number;
  benefice: number;
  commandes: number;
  etiquettes: number;
  maillots: number;
  formation: number;
  wifi: number;
};

function monthLabel(key: MonthKey) {
  const [y, m] = key.split("-").map(Number);
  const names = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
  ];
  return (names[m - 1] || key) + " " + y;
}

function toMonthKey(dateStr: string | null | undefined): MonthKey | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function currentMonthKey(): MonthKey {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

function money(n: number) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " F";
}

function emptyTotaux(): Totaux {
  return {
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

export default function RapportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MonthKey>(currentMonthKey());
  const [byMonth, setByMonth] = useState<Record<MonthKey, Totaux>>({});

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
          .select(
            "created_at, date, montant_paye, inscription, total_paye, montant, owner_id"
          )
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

      const map: Record<MonthKey, Totaux> = {};

      const ensure = (key: MonthKey) => {
        if (!map[key]) map[key] = emptyTotaux();
        return map[key];
      };

      (commandesRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const t = ensure(key);
        const ca = Number(row.total ?? row.montant ?? 0) || 0;
        const achat = Number(row.prix_achat ?? 0) || 0;
        const ben = row.benefice != null ? Number(row.benefice) : ca - achat;
        t.ca += ca;
        t.achats += achat;
        t.commandes += ca;
        t.benefice += ben;
      });

      (etiquettesRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const t = ensure(key);
        const ca = Number(row.total ?? row.montant ?? 0) || 0;
        const cout = Number(row.cout ?? 0) || 0;
        const ben = row.benefice != null ? Number(row.benefice) : ca - cout;
        t.ca += ca;
        t.achats += cout;
        t.etiquettes += ca;
        t.benefice += ben;
      });

      (maillotsRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const t = ensure(key);
        const ca = Number(row.total ?? row.montant ?? 0) || 0;
        const achat = Number(row.prix_achat ?? 0) || 0;
        const ben = row.benefice != null ? Number(row.benefice) : ca - achat;
        t.ca += ca;
        t.achats += achat;
        t.maillots += ca;
        t.benefice += ben;
      });

      // FORMATION — barre + CA + benefice
      (formationRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const t = ensure(key);
        const paye =
          Number(
            row.montant_paye ??
              row.total_paye ??
              row.montant ??
              row.inscription ??
              0
          ) || 0;
        t.ca += paye;
        t.formation += paye;
        t.benefice += paye;
      });

      (wifiRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const t = ensure(key);
        const ca = Number(row.prix_total ?? row.montant ?? 0) || 0;
        t.ca += ca;
        t.wifi += ca;
        t.benefice += ca;
      });

      // Depenses = uniquement sur le benefice (pas le CA)
      (depensesRes.data || []).forEach((row: any) => {
        const key = toMonthKey(row.date || row.created_at);
        if (!key) return;
        const t = ensure(key);
        const dep = Number(row.montant ?? 0) || 0;
        t.depenses += dep;
        t.benefice -= dep;
      });

      setByMonth(map);
      setLoading(false);
    };

    load();
  }, [router]);

  const months = useMemo(
    () => Object.keys(byMonth).sort().reverse(),
    [byMonth]
  );

  const current = byMonth[selected] || emptyTotaux();
  const maxBar = Math.max(
    current.commandes,
    current.etiquettes,
    current.maillots,
    current.formation,
    current.wifi,
    1
  );

  const bars = [
    { label: "Commandes", value: current.commandes, color: "bg-blue-600" },
    { label: "Etiquettes", value: current.etiquettes, color: "bg-sky-500" },
    { label: "Maillots", value: current.maillots, color: "bg-indigo-500" },
    { label: "Formation", value: current.formation, color: "bg-emerald-500" },
    { label: "WiFi", value: current.wifi, color: "bg-amber-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3 shadow">
        <Link href="/" className="text-white text-lg font-bold">
          ←
        </Link>
        <h1 className="font-bold text-lg flex-1">Rapports</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
            Mois affiche
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 bg-white"
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
          <p className="text-[11px] text-slate-400 mt-2">
            Chaque mois a son compteur. Les anciens mois restent en historique.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Chiffre d affaires (CA)</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{money(current.ca)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Les depenses ne baissent pas le CA
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Achats / couts</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{money(current.achats)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Depenses</p>
            <p className="text-lg font-bold text-red-600 mt-1">{money(current.depenses)}</p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-emerald-700 font-semibold">Benefice net du mois</p>
          <p className="text-3xl font-black text-emerald-700 mt-1">{money(current.benefice)}</p>
          <p className="text-[11px] text-emerald-600 mt-1">CA − achats − depenses</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 mb-4">Detail par activite</h2>
          <div className="space-y-3">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{b.label}</span>
                  <span className="font-bold text-slate-800">{money(b.value)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={"h-full rounded-full " + b.color}
                    style={{
                      width: Math.min(100, (b.value / maxBar) * 100) + "%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <h2 className="font-bold text-sm text-slate-900 mb-3">Historique des mois</h2>
          {months.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              Aucune donnee pour l instant.
            </p>
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
                    "w-full text-left rounded-xl px-3 py-3 border transition " +
                    (k === selected
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100")
                  }
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">
                      {monthLabel(k)}
                    </span>
                    <span className="text-xs font-black text-emerald-700">
                      {money(row.benefice)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    CA {money(row.ca)} · Depenses {money(row.depenses)} · Formation{" "}
                    {money(row.formation)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 px-2 pb-4">
          Formation incluse dans le CA et la barre verte. Une depense diminue le{" "}
          <b>benefice</b>, pas le chiffre d affaires.
        </p>
      </div>
    </div>
  );
}
