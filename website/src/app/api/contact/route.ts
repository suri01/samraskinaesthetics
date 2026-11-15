import { Resend } from "resend";
import { site } from "@/lib/site";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message?: string;
  consent?: boolean;
  /** Honeypot — must stay empty */
  company?: string;
};

const TOPIC_LABELS: Record<string, string> = {
  consultation: "Book a consultation",
  treatment: "Treatment question",
  skincare: "Skincare advice",
  other: "Something else",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Silent success for bots filling the honeypot.
  if (typeof body.company === "string" && body.company.trim()) {
    return Response.json({ ok: true });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const topic = String(body.topic || "other").trim();
  const message = String(body.message || "").trim();
  const consent = body.consent === true;

  if (!name || !email || !message || !consent) {
    return Response.json(
      { error: "Please complete name, email, message, and consent." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (name.length > 120 || email.length > 200 || message.length > 5000) {
    return Response.json({ error: "One or more fields are too long." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Enquiry delivery is not configured yet. Please email us directly for now.",
      },
      { status: 503 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL || site.email;
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    `${site.shortName} Website <onboarding@resend.dev>`;
  const topicLabel = TOPIC_LABELS[topic] || topic;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `Website enquiry — ${topicLabel} — ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : "Phone: (not provided)",
      `Topic: ${topicLabel}`,
      "",
      message,
    ].join("\n"),
  });

  if (error) {
    console.error("contact form send failed", error);
    return Response.json(
      { error: "We couldn’t send your message just now. Please try emailing us directly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
