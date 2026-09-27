// Explicit opt-in, read-only public HTTP checks on this computer's network.
// This adapter does NOT implement Egern routing and cannot validate any policy group.
import { collectReport, readConfig } from '../ip-quality.js';
import { writeFile, mkdir } from 'node:fs/promises';
if (!process.argv.includes('--live')) throw new Error('Live requests require --live');
const env = { POLICY: 'LOCAL-HTTP-SMOKE', MEDIA_TEST: 'false' };
async function request(url, options) {
  const response = await fetch(url, {
    headers: options.headers, redirect: options.redirect, credentials: 'omit',
    signal: AbortSignal.timeout(options.timeout),
  });
  return { status: response.status, text: () => response.text() };
}
const report = await collectReport({ env, http: { get: request } }, readConfig(env));
const summary = {
  checkedAt: report.updatedAt,
  transport: 'Node fetch on local network; not Egern or an iPhone policy test',
  state: report.state,
  sources: report.sources.map(s => ({ name: s.name, ok: s.ok, error: s.error || null,
    shape: s.ok ? { hasIP: !!s.value.ip, hasScore: Object.hasOwn(s.value, 'fraudScore'),
      asnType: typeof s.value.asn, hasLocation: !!s.value.location, anonymous: !!s.value.docs } : null })),
  uniqueExits: new Set(report.observations.map(o => o.ip)).size,
  profilePresent: !!report.profile,
  scoreAvailable: report.risk?.score != null,
};
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/local-live-smoke.json', import.meta.url), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!report.sources.some(s => s.ok)) process.exitCode = 1;
