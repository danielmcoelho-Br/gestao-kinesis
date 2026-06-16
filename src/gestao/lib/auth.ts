import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

let KEY: Uint8Array | null = null;
function getJWTKey() {
  if (!KEY) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
        console.warn("⚠️ JWT_SECRET is missing from environment variables!");
      }
      return new TextEncoder().encode("temporary-fallback-secret-key-for-static-build");
    }
    KEY = new TextEncoder().encode(secret);
  }
  return KEY;
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJWTKey());
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, getJWTKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (e) {
    return null;
  }
}

export async function createSession(user: any) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ 
    id: user.id, 
    email: user.email, 
    name: user.name, 
    role: user.role,
    expires 
  });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0), path: "/" });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}
