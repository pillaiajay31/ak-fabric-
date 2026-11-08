import { SessionUser, UserPermissions, UserRole } from "./types";

export const SESSION_COOKIE_NAME = "knitflow_session";
const SECRET_KEY =
  process.env.AUTH_SECRET || "knitflow-secret-key-ak-fabric-silvassa-2026-v1";

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    permissions: user.permissions,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const payloadStr = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadStr);

  const key = await getHmacKey();
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload)
  );

  let binarySig = "";
  const sigArr = new Uint8Array(signatureBytes);
  for (let i = 0; i < sigArr.length; i++) {
    binarySig += String.fromCharCode(sigArr[i]);
  }
  const encodedSignature = btoa(binarySig)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${encodedPayload}.${encodedSignature}`;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token || !token.includes(".")) return null;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  try {
    let base64Sig = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    while (base64Sig.length % 4) {
      base64Sig += "=";
    }
    const binarySig = atob(base64Sig);
    const sigBytes = new Uint8Array(binarySig.length);
    for (let i = 0; i < binarySig.length; i++) {
      sigBytes[i] = binarySig.charCodeAt(i);
    }

    const key = await getHmacKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const parsed = JSON.parse(payloadJson);

    if (parsed.exp && parsed.exp < Date.now()) {
      return null;
    }

    return {
      id: parsed.id,
      username: parsed.username,
      fullName: parsed.fullName,
      role: parsed.role as UserRole,
      permissions: parsed.permissions as UserPermissions,
    };
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plain + ":" + SECRET_KEY);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (plain === stored) return true;
  const hashed = await hashPassword(plain);
  return hashed === stored;
}
