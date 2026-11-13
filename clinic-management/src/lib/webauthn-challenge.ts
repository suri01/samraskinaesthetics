import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { webauthnChallenges } from "@/db/schema";

const CHALLENGE_COOKIE = "ssa_wa_chal";

function challengeCookieOptions(maxAgeSeconds: number) {
  const secure =
    process.env.NODE_ENV === "production" ||
    (process.env.APP_URL ?? "").startsWith("https://");
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    path: "/ipad",
    maxAge: maxAgeSeconds,
  };
}

/** Bind the issued WebAuthn challenge to this browser via HttpOnly cookie. */
export async function bindChallengeCookie(challengeId: string) {
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, challengeId, challengeCookieOptions(5 * 60));
}

export async function loadBoundChallenge(purpose: string) {
  const jar = await cookies();
  const id = jar.get(CHALLENGE_COOKIE)?.value;
  if (!id) return null;

  const rows = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.id, id),
        eq(webauthnChallenges.purpose, purpose),
        gt(webauthnChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function clearChallengeCookie() {
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, "", { ...challengeCookieOptions(0), maxAge: 0 });
}
