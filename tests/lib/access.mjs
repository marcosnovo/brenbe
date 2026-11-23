// Ayuda para las pruebas: JWT de Cloudflare Access firmado con una clave de prueba + URL del JWKS simulado.
export const TEAM = 'brenbe.cloudflareaccess.com';
export const AUD = 'aud-tag-123';
export const ACCESS_ENV = { ACCESS_TEAM_DOMAIN: 'brenbe', ACCESS_AUD: AUD };

const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
export async function keypair(kid = 'k1') {
  const kp = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  return { priv: kp.privateKey, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' }, kid };
}
export async function sign(kp, claims) {
  const h = enc({ alg: 'RS256', kid: kp.kid, typ: 'JWT' });
  const p = enc(claims);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.priv, new TextEncoder().encode(h + '.' + p));
  return h + '.' + p + '.' + Buffer.from(sig).toString('base64url');
}
export const goodClaims = () => {
  const now = Math.floor(Date.now() / 1000);
  return { iss: 'https://' + TEAM, aud: [AUD], exp: now + 600, iat: now, email: 'brenda@example.com' };
};
export const certsUrl = 'https://' + TEAM + '/cdn-cgi/access/certs';
