import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const CUSTOMER_SESSION_COOKIE = "customerSession";
export const CUSTOMER_ACTIVITY_COOKIE = "customerLastActivity";
export const CUSTOMER_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const CUSTOMER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PIN_SALT_BYTES = 16;
const PIN_KEY_LENGTH = 64;
const SESSION_SECRET =
  process.env.CUSTOMER_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "change-me-customer-session-secret";

interface CustomerSessionPayload {
  customerId: string;
  customerCode: string | null;
  exp: number;
}

function isValidPin(pin: string) {
  return /^\d{4}$/.test(pin);
}

function signTokenSegment(segment: string) {
  return createHmac("sha256", SESSION_SECRET)
    .update(segment)
    .digest("base64url");
}

export function normalizeCustomerIdentifier(value: string) {
  return value.trim().toUpperCase();
}

export function generateCustomerCode() {
  return `CUS-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function hashPin(pin: string) {
  if (!isValidPin(pin)) {
    throw new Error("PIN must be exactly 4 digits");
  }

  const salt = randomBytes(PIN_SALT_BYTES).toString("hex");
  const derived = scryptSync(pin, salt, PIN_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPin(
  pin: string,
  storedPinHash: string | null | undefined,
) {
  if (!isValidPin(pin)) {
    return false;
  }

  // Existing customers may not yet have a stored hash.
  if (!storedPinHash) {
    return pin === "0000";
  }

  if (storedPinHash.startsWith("scrypt$")) {
    const parts = storedPinHash.split("$");
    if (parts.length !== 3) return false;

    const [, salt, hash] = parts;
    const derived = scryptSync(pin, salt, PIN_KEY_LENGTH).toString("hex");
    const derivedBuffer = Buffer.from(derived, "hex");
    const hashBuffer = Buffer.from(hash, "hex");

    if (derivedBuffer.length !== hashBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedBuffer, hashBuffer);
  }

  // Legacy plaintext PIN compatibility.
  return storedPinHash === pin;
}

export function createCustomerSessionToken(input: {
  customerId: string;
  customerCode?: string | null;
}) {
  const payload: CustomerSessionPayload = {
    customerId: input.customerId,
    customerCode: input.customerCode ?? null,
    exp: Date.now() + CUSTOMER_SESSION_TTL_MS,
  };

  const encoded = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url",
  );
  const signature = signTokenSegment(encoded);
  return `${encoded}.${signature}`;
}

export function verifyCustomerSessionToken(token: string | null | undefined) {
  if (!token) return null;

  const [payloadSegment, signatureSegment] = token.split(".");
  if (!payloadSegment || !signatureSegment) return null;

  const expectedSignature = signTokenSegment(payloadSegment);
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const signatureBuffer = Buffer.from(signatureSegment, "utf-8");

  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadSegment, "base64url").toString("utf-8"),
    ) as CustomerSessionPayload;

    if (!payload.customerId || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function isCustomerPinFormatValid(pin: string) {
  return isValidPin(pin);
}
