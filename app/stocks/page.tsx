"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Stock = {
  id: string;
  nom: string;
  quantite: number;
  seuil_alerte: number;
  owner_id?: string;
  created_at?: string;
  date?: string;
};

export default function StocksPage() {
  const router = useRouter();
  const [items, setItems] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [quantite, setQuantite] = useState("");
  const [seuil, setSeuil] = useState("5");
  const [editId, setEditId] = useState<string | null>(null);

  const load = async (uid: string) => {
    const { data, error } = await supabase
      .from("stocks")
      .select("id, nom, quantite, seuil_alerte, owner_id, created_at, date")
      .eq("owner_id", uid)
      .order("nom", { ascending: true });

    if (error) {
      setMsg("Erreur chargement: " + error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserId(session.user.id);
      await load(session.user.id);
    };
    init();
  }, [router]);

  const resetForm = () => {
    setNom("");
    setQuantite("");
    setSeuil("5");
    setEditId(null);
  };

  const save = async () => {
    if (!userId) return;
    const q = Number(quantite);
    const s = Number(seuil);
    if (!nom.trim()) {
      setMsg("Indique le nom du produit.");
      return;
    }
    if (isNaN(q) || q < 0) {
      setMsg("Quantite invalide.");
      return;
    }
    if (isNaN(s) || s < 0) {
      setMsg("Seuil d alerte invalide.");
      return;
    }

    setSaving(true);
    setMsg("");

    if (editId) {
      const { error } = await supabase
        .from("stocks")
        .update({
          nom: nom.trim(),
          quantite: q,
          seuil_alerte: s,
        })
        .eq("id", editId)
        .eq("owner_id", userId);

      if (error) {
        setMsg("Erreur modification: " + error.message);
        setSaving(false);
        return;
      }
      setMsg("Stock modifie.");
    } else {
      const { error } = await supabase.from("stocks").insert({
        nom: nom.trim(),
        quantite: q,
        seuil_alerte: s,
        owner_id: userId,
        date: new Date().toISOString().slice(0, 10),
      });

      if (error) {
        setMsg("Erreur ajout: " + error.message);
        setSaving(false);
        return;
      }
      setMsg("Produit ajoute au stock.");
    }

    resetForm();
    await load(userId);
    setSaving(false);
  };

  const startEdit = (row: Stock) => {
    setEditId(row.id);
    setNom(row.nom || "");
    setQuantite(String(row.quantite ?? 0));
    setSeuil(String(row.seuil_alerte ?? 5));
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!userId) return;
    if (!confirm("Supprimer ce produit du stock ?")) return;

    const { error } = await supabase
      .from("stocks")
      .delete()
      .eq("id", id)
      .eq("owner_id", userId);

    if (error) {
      setMsg("Erreur suppression: " + error.message);
      return;
    }
    setMsg("Produit supprime.");
    if (editId === id) resetForm();
    await load(userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-purple-800 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-white text-lg">
          ←
        </Link>
        <h1 className="font-bold text-lg flex-1">Stocks</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Formulaire */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
          <h2 className="font-bold text-sm text-gray-900">
            {editId ? "Modifier le stock" : "Ajouter un produit"}
          </h2>

          <div>
            <label className="text-xs text-gray-500">Nom du produit</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Maillot, Papier A4, Bol..."
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Quantite</label>
              <input
                type="number"
                min="0"
                value={quantite}
                onChange={(e) => setQuantite(e.target.value)}
                placeholder="0"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Seuil d alerte</label>
              <input
                type="number"
                min="0"
                value={seuil}
                onChange={(e) => setSeuil(e.target.value)}
                placeholder="5"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60"
            >
              {saving ? "..." : editId ? "Enregistrer" : "Ajouter"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 rounded-lg border border-gray-200 text-sm text-gray-600"
              >
                Annuler
              </button>
            )}
          </div>

          {msg && (
            <p className="text-xs text-center text-purple-700 bg-purple-50 rounded-lg py-2">
              {msg}
            </p>
          )}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-bold text-sm text-gray-900">
              Liste des stocks ({items.length})
            </h2>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Aucun produit en stock.
            </p>
          )}

          <ul className="divide-y divide-gray-100">
            {items.map((row) => {
              const low = Number(row.quantite) <= Number(row.seuil_alerte);
              return (
                <li key={row.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {row.nom}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qte:{" "}
                      <span className={low ? "text-red-600 font-bold" : "font-medium"}>
                        {row.quantite}
                      </span>
                      {" · "}Seuil: {row.seuil_alerte}
                      {low && (
                        <span className="ml-2 text-red-600 font-semibold">
                          Alerte stock bas
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium"
                  >
                    Suppr.
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-[11px] text-center text-gray-400 px-2">
          Quand le stock est a 0, clique sur <b>Modifier</b> pour remettre une quantite
          (pas besoin de recreer le produit).
        </p>
      </div>
    </div>
  );
}
