"use client";

export default function AbonnementExpirePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "white", padding: 20 }}>
      <div style={{ maxWidth: 420, width: "100%", background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, textAlign: "center" }}>
        <h1 style={{ marginTop: 0 }}>Abonnement expiré</h1>
        <p style={{ color: "#cbd5e1", lineHeight: 1.5 }}>
          Votre accès est suspendu. Contactez Ballo Print pour renouveler votre abonnement mensuel.
        </p>
        <p style={{ color: "#c4b5fd", fontWeight: 600 }}>
          WhatsApp : +223 75 13 70 83
        </p>
        <a
          href="https://wa.me/22375137083?text=Bonjour,%20je%20veux%20renouveler%20mon%20abonnement%20Ballo%20Print%20Manager"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            marginTop: 12,
            background: "#7c3aed",
            color: "white",
            textDecoration: "none",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          Renouveler maintenant
        </a>
      </div>
    </div>
  );
}