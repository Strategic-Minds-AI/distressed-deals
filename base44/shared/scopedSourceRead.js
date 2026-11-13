// Builds a read-only, project-pinned Supabase REST request. No management API and no service_role key.
export const PINNED_PROJECT_REF = 'fwtchbsebygwifmmqhur';
export const PINNED_PROPERTY_TABLE = 'distressed_properties';
const fail = code => { const err = new Error(code); err.code = code; throw err; };
function claimsOf(jwt) {
  if (typeof jwt !== 'string' || jwt.split('.').length !== 3) return null;
  try {
    const segment = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')));
  } catch { return null; }
}
export function buildScopedSourceRead({
  projectRef, table = PINNED_PROPERTY_TABLE, apiKey, accessToken, now = Date.now()
} = {}) {
  if (projectRef !== PINNED_PROJECT_REF) fail('WRONG_PROJECT');
  if (table !== PINNED_PROPERTY_TABLE) fail('WRONG_TABLE');
  if (!Number.isFinite(now)) fail('INVALID_CLOCK');
  if (!apiKey || typeof apiKey !== 'string' || !accessToken || typeof accessToken !== 'string') {
    fail('SOURCE_READ_CREDENTIALS_MISSING');
  }
  // The publishable / anon API key alone is insufficient: use an authenticated,
  // RLS-constrained bearer with dedicated source-reader privileges.
  if (apiKey.startsWith('sb_secret_') || claimsOf(apiKey)?.role === 'service_role') {
    fail('PRIVILEGED_API_KEY_FORBIDDEN');
  }
  const claims = claimsOf(accessToken);
  if (!claims || !['authenticated', 'property_reader'].includes(claims.role)) {
    fail('SCOPED_BEARER_REQUIRED');
  }
  if (claims.iss !== `https://${PINNED_PROJECT_REF}.supabase.co/auth/v1`) {
    fail('BEARER_ISSUER_MISMATCH');
  }
  if (!Number.isSafeInteger(claims.exp) || claims.exp * 1000 <= now + 60000) {
    fail('BEARER_EXPIRED_OR_NEAR_EXPIRY');
  }
  if (claims.aud && claims.aud !== 'authenticated') fail('BEARER_AUDIENCE_MISMATCH');
  // A decoded JWT is only a client-side least-privilege policy check. The
  // actual token signature, expiry and RLS are validated by Supabase.
  return Object.freeze({
    endpoint: `https://${PINNED_PROJECT_REF}.supabase.co/rest/v1/${PINNED_PROPERTY_TABLE}`,
    headers: Object.freeze({
      apikey: apiKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }),
    projectRef: PINNED_PROJECT_REF,
    table: PINNED_PROPERTY_TABLE
  });
}
export function classifySourceReadFailure(status) {
  if (status === 401 || status === 403) return 'source_read_denied';
  if (status === 404) return 'no_source_table';
  return 'source_read_error';
}