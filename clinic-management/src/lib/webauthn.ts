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
  // Local Safari / Chrome sometimes present 127.0.0.1
  if (origin.includes("localhost")) {
    return [origin, origin.replace("localhost", "127.0.0.1")];
  }
  return [origin];
}

export function asTransports(
  value: string[] | null | undefined,
): AuthenticatorTransport[] | undefined {
  if (!value?.length) return undefined;
  return value as AuthenticatorTransport[];
}
