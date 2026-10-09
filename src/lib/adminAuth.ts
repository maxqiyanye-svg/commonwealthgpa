"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Shared password gate for the whole /admin section (catalog editor +
// student grades). One login unlocks both — same cookie, same password.
const COOKIE_NAME = "admin_auth";
// Effectively "remember this device forever" — the only way back to the
// password screen is clicking Log out, which deletes the cookie outright.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10; // 10 years

function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHmac("sha256", pw).update("commonwealth-gpa-admin").digest("hex");
}

export async function isAdminAuthed(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;

  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD;
  const redirectTo = String(formData.get("redirect_to") || "/admin");

  if (!expected || password !== expected) {
    redirect(`${redirectTo}?error=${encodeURIComponent("Wrong password.")}`);
  }

  cookies().set(COOKIE_NAME, expectedToken()!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  redirect(redirectTo);
}

export async function adminLogout() {
  cookies().delete(COOKIE_NAME);
  redirect("/admin");
}
