import { ENDPOINTS } from '../ip-quality.js';

// Documentation-only address ranges: synthetic data, not real measurements.
export const IP = '203.0.113.42';
export const SECOND_IP = '198.51.100.23';
export const pure = {
  ip: IP, asn: 64496, asOrganization: 'Example Network',
  country: 'Example Country', countryCode: 'XX', city: 'Example City',
  fraudScore: 17, isResidential: true, isBroadcast: false,
};
export const full = {
  ip: IP, asn: { asn: 64496, org: 'Example Network', type: 'isp' },
  location: { country_code: 'XX', country: 'Example Country', city: 'Example City' },
  company: { name: 'Example Network', type: 'isp', abuser_score: '0.001 (Low)' },
  is_datacenter: false, is_mobile: false,
};
export const anonymous = {
  ip: IP, asn: 'AS64496 Example Network', company: 'Example Network',
  country: 'Example Country', region: 'Example Region', city: 'Example City',
  docs: 'https://ipapi.is/free-tier.html',
};
export function mockContext({ env = {}, overrides = {}, finalIP = IP, family = 'systemLarge', delay = false } = {}) {
  const calls = [];
  let ipifyCalls = 0, active = 0, peak = 0;
  const data = {
    [ENDPOINTS.ippure]: pure,
    [ENDPOINTS.ipapi]: full,
    'https://api.openai.com/compliance/cookie_requirements': { cookie_consent_required: false },
    'https://chatgpt.com/cdn-cgi/trace': 'loc=XX\nip=203.0.113.42\n',
    'https://www.netflix.com/title/81280792': '<meta property="og:title" content="Netflix"><script>{"countryCode":"XX"}</script>',
    'https://www.netflix.com/title/70143836': '<meta property="og:title" content="Netflix"><script>{"countryCode":"XX"}</script>',
    'https://www.youtube.com/premium': 'YouTube Premium {"contentRegion":"XX"}',
    'https://www.tiktok.com/': 'TikTok {"region":"XX"}',
    'https://www.primevideo.com/': '{"currentTerritory":"XX"}',
    'https://www.reddit.com/': '<title>Reddit</title>',
  };
  async function request(method, url, options) {
    calls.push({ method, url, options }); active++; peak = Math.max(peak, active);
    if (delay) await new Promise(resolve => setTimeout(resolve, 2));
    active--;
    if (url === ENDPOINTS.ipify) ipifyCalls++;
    let value = Object.hasOwn(overrides, url) ? overrides[url]
      : url === ENDPOINTS.ipify ? { ip: ipifyCalls > 1 ? finalIP : IP } : data[url];
    if (typeof value === 'function') value = value({ method, url, options, ipifyCalls });
    if (value instanceof Error) throw value;
    if (value === undefined) throw new Error(`Unexpected fixture request: ${url}`);
    const status = value?.httpStatus ?? 200;
    const body = value && Object.hasOwn(value, 'rawBody') ? value.rawBody
      : typeof value === 'string' ? value : JSON.stringify(value);
    return { status, async text() { return body; } };
  }
  return {
    env: { POLICY: '🇭🇰 香港策略组', ...env }, widgetFamily: family,
    http: { get: (url, options) => request('GET', url, options), post: (url, options) => request('POST', url, options) },
    calls, peak: () => peak,
    storage: { get() { throw new Error('Do not reuse cached results'); }, set() { throw new Error('Do not persist results'); } },
  };
}
