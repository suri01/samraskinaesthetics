export function appOrigin(): string {
  return (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export function rpID(): string {
  try {
    return new URL(appOrigin()).hostname;
  } catch {
    return "localhost";
  }
}

export function rpName(): string {
  return "Samra Skin & Aesthetics Clinic";
}

export function expectedOrigins(): string[] {
  const origin = appOrigin();
  const origins = new Set<string>([origin]);
  // Local Safari / Chrome sometimes present 127.0.0.1
  if (origin.includes("localhost")) {
    origins.add(origin.replace("localhost", "127.0.0.1"));
  }
  // Allow common Vercel aliases when APP_URL is the custom clinic domain (and vice versa).
  for (const extra of (process.env.WEBAUTHN_EXTRA_ORIGINS ?? "").split(",")) {
    const trimmed = extra.trim().replace(/\/$/, "");
    if (trimmed) origins.add(trimmed);
  }
  if (origin.includes("clinic.samraskinaesthetics.com")) {
    origins.add("https://samra-clinic-management.vercel.app");
  }
  if (origin.includes("samra-clinic-management.vercel.app")) {
    origins.add("https://clinic.samraskinaesthetics.com");
  }
  return [...origins];
}

export function asTransports(
  value: string[] | null | undefined,
): AuthenticatorTransport[] | undefined {
  if (!value?.length) return undefined;
  return value as AuthenticatorTransport[];
}
