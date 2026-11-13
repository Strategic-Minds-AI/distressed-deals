// Bounded, fail-closed read for the pinned property source. Never writes.
const MAX_ROWS = 2000;
const SOURCE_ORIGIN = 'https://fwtchbsebygwifmmqhur.supabase.co/rest/v1/distressed_properties';
const PAGE_SIZE = 200;
const TIMEOUT_MS = 8000;
const err = code => Object.assign(new Error(code), { code });
export function classifyPageReadError(error) {
  const code = error?.code;
  return new Set(['SOURCE_READ_DENIED', 'SOURCE_TABLE_NOT_FOUND', 'SOURCE_SCHEMA_INVALID',
    'SOURCE_RESPONSE_INVALID', 'SOURCE_PAGE_LIMIT_EXCEEDED', 'SOURCE_READ_TIMEOUT',
    'SOURCE_READ_NETWORK_ERROR']).has(code) ? code : 'SOURCE_READ_NETWORK_ERROR';
}
export async function readBoundedSourcePages({ endpoint, headers, fetchImpl = fetch,
  pageSize = PAGE_SIZE, maxRows = MAX_ROWS, timeoutMs = TIMEOUT_MS } = {}) {
  if (endpoint !== SOURCE_ORIGIN) throw err('SOURCE_SCHEMA_INVALID');
  if (!headers || typeof headers !== 'object' ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000 ||
      !Number.isSafeInteger(maxRows) || maxRows < pageSize || maxRows > MAX_ROWS ||
      !Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000)
    throw err('SOURCE_SCHEMA_INVALID');
  const all = [];
  let offset = 0;
  let pages = 0;
  // Additional one-row overflow probe prevents silently ingesting a truncated source.
  while (offset <= maxRows) {
    const size = offset === maxRows ? 1 : Math.min(pageSize, maxRows - offset);
    const url = endpoint + '?select=*&order=id.asc&limit=' + size + '&offset=' + offset;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try { response = await fetchImpl(url, { headers, signal: controller.signal }); }
    catch (e) { clearTimeout(timer); throw err(e?.name === 'AbortError' ? 'SOURCE_READ_TIMEOUT' : 'SOURCE_READ_NETWORK_ERROR'); }
    if (!response || typeof response.status !== 'number') { clearTimeout(timer); throw err('SOURCE_RESPONSE_INVALID'); }
    if (response.status === 401 || response.status === 403) { clearTimeout(timer); throw err('SOURCE_READ_DENIED'); }
    if (response.status === 404) { clearTimeout(timer); throw err('SOURCE_TABLE_NOT_FOUND'); }
    if (response.status < 200 || response.status >= 300) { clearTimeout(timer); throw err('SOURCE_READ_NETWORK_ERROR'); }
    if (response.headers?.get?.('content-type') &&
        !response.headers.get('content-type').toLowerCase().includes('application/json')) {
      clearTimeout(timer); throw err('SOURCE_RESPONSE_INVALID');
    }
    let rows;
    try { rows = await response.json(); }
    catch (e) { clearTimeout(timer); throw err(e?.name === 'AbortError' ? 'SOURCE_READ_TIMEOUT' : 'SOURCE_RESPONSE_INVALID'); }
    clearTimeout(timer);
    if (!Array.isArray(rows) || rows.length > size ||
        rows.some(row => !row || typeof row !== 'object' || Array.isArray(row)))
      throw err('SOURCE_RESPONSE_INVALID');
    pages++;
    if (offset === maxRows) {
      if (rows.length) throw err('SOURCE_PAGE_LIMIT_EXCEEDED');
      return { rows: all, pages, truncated: false };
    }
    all.push(...rows);
    if (rows.length < size) return { rows: all, pages, truncated: false };
    offset += size;
  }
  throw err('SOURCE_PAGE_LIMIT_EXCEEDED');
}
