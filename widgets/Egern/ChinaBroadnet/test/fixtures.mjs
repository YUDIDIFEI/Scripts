import { ENDPOINT } from '../china-broadnet.js';

// Synthetic test values only. Never insert real access/data or account responses.
export const ACCESS = 'synthetic-access-not-a-real-session';
export const DATA = 'synthetic-encrypted-data-not-a-real-account';
export const payload = { status: '000000', data: { userData: { fee: 8650, flow: 28.5 * 1048576, flowAll: 50 * 1048576, voice: 320, voiceAll: 500 } } };
export function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, get: key => values.get(key) ?? null, set: (key, value) => values.set(key, value), delete: key => values.delete(key) };
}
export function requestContext({ storage = memoryStorage(), url = ENDPOINT, method = 'POST', access = ACCESS, body = JSON.stringify({ data: DATA }), headers, readError } = {}) {
  const notices = [];
  let reads = 0;
  return {
    storage, notices, env: {},
    notify: value => notices.push(value),
    request: {
      url, method, headers: headers || new Headers(access === null ? {} : { Access: access }),
      text: async () => { reads++; if (readError) throw readError; if (reads > 1) throw new Error('Body already read'); return body; },
    },
    reads: () => reads,
  };
}
export function widgetContext({ storage = memoryStorage(), env = {}, response = payload, status = 200, error, jsonError, family = 'systemMedium' } = {}) {
  const calls = [], notices = [];
  return {
    storage, env, widgetFamily: family, calls, notices,
    notify: value => notices.push(value),
    http: { post: async (url, options) => {
      calls.push({ url, options });
      if (error) throw error;
      return { status, json: async () => { if (jsonError) throw jsonError; return structuredClone(response); } };
    } },
  };
}
