const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    produit: "",
    nom: "",
    quantite: "0",
    seuil: "5",
  });

  const charger = async () => {
    setLoading(true);
    const { data } = await supabase
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("produit", { ascending: true });
    setRows(data || []);
      .order("nom", { ascending: true });

    if (error) {
      alert("Erreur chargement : " + error.message);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

@@ -29,23 +35,23 @@ export default function StocksPage() {
  }, []);

  const resetForm = () => {
    setForm({ produit: "", quantite: "0", seuil: "5" });
    setForm({ nom: "", quantite: "0", seuil: "5" });
    setEditId(null);
    setShowForm(false);
  };

  const ouvrirModif = (r: any) => {
    setEditId(r.id);
    setForm({
      produit: r.produit || r.nom || "",
      quantite: String(r.quantite ?? r.qte ?? 0),
      seuil: String(r.seuil ?? r.seuil_alerte ?? 5),
      nom: r.nom || "",
      quantite: String(r.quantite ?? 0),
      seuil: String(r.seuil ?? 5),
    });
    setShowForm(true);
  };

  const enregistrer = async () => {
    if (!form.produit.trim()) {
    if (!form.nom.trim()) {
      alert("Nom du produit obligatoire");
      return;
    }
@@ -54,36 +60,36 @@ export default function StocksPage() {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      alert("Session expirée. Reconnecte-toi.");
      return;
    }

    const payload: any = {
      produit: form.produit.trim(),
    const payload = {
      nom: form.nom.trim(),
      quantite: Number(form.quantite) || 0,
      seuil: Number(form.seuil) || 0,
      owner_id: user.id,
    };

    if (user) payload.owner_id = user.id;

    if (editId) {
      const { error } = await supabase.from("stocks").update(payload).eq("id", editId);
      const { error } = await supabase
        .from("stocks")
        .update({
          nom: payload.nom,
          quantite: payload.quantite,
          seuil: payload.seuil,
        })
        .eq("id", editId);

      if (error) {
        // colonnes alternatives
        const { error: e2 } = await supabase
          .from("stocks")
          .update({
            produit: payload.produit,
            qte: payload.quantite,
            seuil_alerte: payload.seuil,
          })
          .eq("id", editId);
        if (e2) {
          alert("Erreur : " + (error.message || e2.message));
          return;
        }
        alert("Erreur modification : " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("stocks").insert([payload]);
      if (error) {
        alert("Erreur : " + error.message);
        alert("Erreur création : " + error.message);
        return;
      }
    }
@@ -94,7 +100,7 @@ export default function StocksPage() {

  const ajouterQuantite = async (r: any) => {
    const saisie = prompt(
      `Ajouter quelle quantité pour « ${r.produit || r.nom} » ?\n(Stock actuel : ${r.quantite ?? r.qte ?? 0})`,
      `Ajouter quelle quantité pour « ${r.nom} » ?\n(Stock actuel : ${r.quantite ?? 0})`,
      "10"
    );
    if (saisie === null) return;
@@ -104,18 +110,12 @@ export default function StocksPage() {
      return;
    }

    const actuelle = Number(r.quantite ?? r.qte ?? 0);
    const nouvelle = actuelle + plus;

    let { error } = await supabase
    const nouvelle = (Number(r.quantite) || 0) + plus;
    const { error } = await supabase
      .from("stocks")
      .update({ quantite: nouvelle })
      .eq("id", r.id);

    if (error) {
      ({ error } = await supabase.from("stocks").update({ qte: nouvelle }).eq("id", r.id));
    }

    if (error) {
      alert("Erreur : " + error.message);
      return;
@@ -129,11 +129,6 @@ export default function StocksPage() {
    charger();
  };

  const nom = (r: any) => r.produit || r.nom || "—";
  const qte = (r: any) => Number(r.quantite ?? r.qte ?? 0);
  const seuil = (r: any) => Number(r.seuil ?? r.seuil_alerte ?? 5);
  const estBas = (r: any) => qte(r) <= seuil(r);

  return (
    <div style={{ color: "#0f172a", background: "#f8fafc", minHeight: "100%" }}>
      <header
@@ -195,8 +190,8 @@ export default function StocksPage() {
            >
              <input
                placeholder="Nom du produit"
                value={form.produit}
                onChange={(e) => setForm({ ...form, produit: e.target.value })}
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                style={inputStyle}
              />
              <input
@@ -273,61 +268,38 @@ export default function StocksPage() {
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={td}>
                        <strong>{nom(r)}</strong>
                      </td>
                      <td style={{ ...td, fontWeight: 700 }}>{qte(r)}</td>
                      <td style={td}>{seuil(r)}</td>
                      <td style={td}>
                        {estBas(r) ? (
                          <span
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            Stock bas
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#d1fae5",
                              color: "#059669",
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            OK
                          </span>
                        )}
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            onClick={() => ajouterQuantite(r)}
                            style={btnVert}
                            title="Ajouter une quantité"
                          >
                            + Stock
                          </button>
                          <button onClick={() => ouvrirModif(r)} style={btnBleu}>
                            Modifier
                          </button>
                          <button onClick={() => supprimer(r.id)} style={btnRouge}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.map((r) => {
                    const bas = (Number(r.quantite) || 0) <= (Number(r.seuil) || 0);
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                        <td style={td}>
                          <strong>{r.nom}</strong>
                        </td>
                        <td style={{ ...td, fontWeight: 700 }}>{r.quantite}</td>
                        <td style={td}>{r.seuil}</td>
                        <td style={td}>
                          {bas ? (
                            <span style={badgeRouge}>Stock bas</span>
                          ) : (
                            <span style={badgeVert}>OK</span>
                          )}
                        </td>
                        <td style={td}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button onClick={() => ajouterQuantite(r)} style={btnVert}>
                              + Stock
                            </button>
                            <button onClick={() => ouvrirModif(r)} style={btnBleu}>
                              Modifier
                            </button>
                            <button onClick={() => supprimer(r.id)} style={btnRouge}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
@@ -345,17 +317,8 @@ const inputStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const th: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 12,
  color: "#6b7280",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
};

const th: React.CSSProperties = { padding: "10px 12px", fontSize: 12, color: "#6b7280" };
const td: React.CSSProperties = { padding: "10px 12px" };
const btnVert: React.CSSProperties = {
  background: "#d1fae5",
  color: "#047857",
@@ -366,7 +329,6 @@ const btnVert: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
};

const btnBleu: React.CSSProperties = {
  background: "#dbeafe",
  color: "#1d4ed8",
@@ -377,7 +339,6 @@ const btnBleu: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
};

const btnRouge: React.CSSProperties = {
  background: "#fee2e2",
  color: "#dc2626",
@@ -387,3 +348,19 @@ const btnRouge: React.CSSProperties = {
  cursor: "pointer",
  fontSize: 11,
};
const badgeRouge: React.CSSProperties = {
  background: "#fee2e2",
  color: "#dc2626",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
};
const badgeVert: React.CSSProperties = {
  background: "#d1fae5",
  color: "#059669",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
};
