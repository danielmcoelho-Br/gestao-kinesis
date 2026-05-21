import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Using a fallback secret for development if environment variable is missing
const secretKey = process.env.JWT_SECRET || "kinesis-super-secret-patient-key-2026";
const key = new TextEncoder().encode(secretKey);

export type PatientSessionPayload = {
  id: string;
  name: string;
  registration: string | null;
  role: "PATIENT";
};

export async function encryptPatient(payload: PatientSessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Patient session lasts 30 days
    .sign(key);
}

export async function decryptPatient(input: string): Promise<PatientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as PatientSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getPatientSession() {
  const sessionCookie = (await cookies()).get("patient_session")?.value;
  if (!sessionCookie) return null;
  
  return await decryptPatient(sessionCookie);
}

export async function setPatientSession(payload: PatientSessionPayload) {
  const session = await encryptPatient(payload);
  
  // Set cookie
  (await cookies()).set("patient_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearPatientSession() {
  (await cookies()).set("patient_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
