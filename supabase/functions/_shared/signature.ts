// _shared/signature.ts
// Webhook signature verification for inbound providers.
// Uses Web Crypto (available in Deno).

/**
 * Verify Eventbrite webhook signature.
 *
 * Eventbrite signs webhooks with HMAC-SHA256 using the webhook signing secret
 * from the app's webhook configuration. Header: `x-eventbrite-signature: sha256=<hex>`
 *
 * Note: Eventbrite signature verification is sometimes presented as optional —
 * we still enforce it. Reject if missing.
 */
export async function verifyEventbriteSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const expected = await hmacSha256Hex(secret, rawBody);
  // Header format may be "sha256=<hex>" or just "<hex>"
  const provided = signatureHeader.replace(/^sha256=/, '');
  return timingSafeEqual(provided, expected);
}

/**
 * Verify Stripe webhook signature.
 * See: https://stripe.com/docs/webhooks/signatures#verify-manually
 */
export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<{ ok: boolean; reason?: string }> {
  if (!signatureHeader || !secret) {
    return { ok: false, reason: 'missing_signature_or_secret' };
  }

  const parts = signatureHeader.split(',').map((p) => p.trim());
  const tStr = parts.find((p) => p.startsWith('t='))?.slice(2);
  const v1Sigs = parts
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));

  if (!tStr || v1Sigs.length === 0) {
    return { ok: false, reason: 'malformed_signature_header' };
  }

  const t = parseInt(tStr, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - t) > toleranceSeconds) {
    return { ok: false, reason: 'timestamp_outside_tolerance' };
  }

  const signedPayload = `${tStr}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signedPayload);

  for (const v1 of v1Sigs) {
    if (timingSafeEqual(v1, expected)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'signature_mismatch' };
}

/**
 * Verify Square webhook signature.
 * See: https://developer.squareup.com/docs/webhooks/step3validate
 *
 * Square computes HMAC-SHA256 over (notification_url + raw_body) and base64-encodes.
 * Header: `x-square-hmacsha256-signature: <base64>`
 */
export async function verifySquareSignature(
  rawBody: string,
  signatureHeader: string | null,
  notificationUrl: string,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;
  const expected = await hmacSha256Base64(secret, notificationUrl + rawBody);
  return timingSafeEqual(signatureHeader, expected);
}

// ---------------------------------------------------------------------------

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256Base64(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  // base64 encode
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
