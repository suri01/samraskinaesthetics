import { stripeMode } from "@/lib/stripe";
import { whatsappMode } from "@/lib/whatsapp";

export function MockBanner() {
  const stripe = stripeMode();
  const wa = whatsappMode();
  if (stripe !== "mocked" && wa !== "mocked") return null;
  return (
    <div className="panel" style={{ marginBottom: "1rem", padding: "0.75rem 1rem" }}>
      <span className="badge badge--mock">Integrations</span>{" "}
      <span className="muted">
        Stripe is <strong>{stripe}</strong>; WhatsApp is <strong>{wa}</strong>. No live charges or
        messages unless credentials are configured.
      </span>
    </div>
  );
}
