"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CalculateurPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [produit, setProduit] = useState("");
  const [quantite, setQuantite] = useState(10);
  const [typePerso, setTypePerso] = useState("impression");
  const [prixBase, setPrixBase] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("stocks").select("*").order("nom");
      setStocks(data || []);
    }
    load();
  }, []);

  useEffect(() => {
    // Prix de base approximatif selon le nom du produit
    const nom = produit.toLowerCase();
    if (nom.includes("t-shirt") || nom.includes("maillot")) setPrixBase(8.5);
    else if (nom.includes("casquette")) setPrixBase(6);
    else if (nom.includes("mug")) setPrixBase(4.5);
    else if (nom.includes("flyer")) setPrixBase(0.15);
    else if (nom.includes("brochure")) setPrixBase(1.8);
    else if (nom.includes("bâche") || nom.includes("bache")) setPrixBase(45);
    else setPrixBase(5);
  }, [produit]);

  const prixPerso: Record<string, number> = {
    impression: 2.5,
    broderie: 4.0,
    gravure: 3.5,
  };

  const sousTotal = quantite * prixBase;
  const totalPerso = quantite * (prixPerso[typePerso] || 0);
  const total = sousTotal + totalPerso;

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <h2 className="text-lg font-semibold text-gray-800">Calculateur de prix</h2>
      </header>

      <div className="p-6 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Produit (depuis les stocks)</label>
                <select
                  value={produit}
                  onChange={(e) => setProduit(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="">Sélectionner un produit</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.nom}>
                      {s.nom} (Stock: {s.quantite})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={quantite}
                  onChange={(e) => setQuantite(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Type de personnalisation</label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="perso"
                      value="impression"
                      checked={typePerso === "impression"}
                      onChange={(e) => setTypePerso(e.target.value)}
                    />
                    Impression (+2,50 €)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="perso"
                      value="broderie"
                      checked={typePerso === "broderie"}
                      onChange={(e) => setTypePerso(e.target.value)}
                    />
                    Broderie (+4,00 €)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="perso"
                      value="gravure"
                      checked={typePerso === "gravure"}
                      onChange={(e) => setTypePerso(e.target.value)}
                    />
                    Gravure (+3,50 €)
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="font-medium text-gray-700 mb-4">Récapitulatif</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Produit</span>
                  <span className="font-medium">{produit || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prix unitaire</span>
                  <span>{prixBase.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantité</span>
                  <span>{quantite}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span>{sousTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Personnalisation</span>
                  <span>{totalPerso.toFixed(2)} €</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between text-base font-semibold text-purple-700">
                  <span>Total estimé HT</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}