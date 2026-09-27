import test from 'node:test';
import assert from 'node:assert/strict';
import main, { ENDPOINTS, MEDIA, collectReport, parseRisk, parseMedia, normalizeIP, renderWidget, readConfig, profileFor } from '../ip-quality.js';
import { IP, SECOND_IP, pure, full, anonymous, mockContext } from './fixtures.mjs';

const families = ['systemSmall', 'systemMedium', 'systemLarge', 'systemExtraLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'];
function validateDSL(widget) {
  assert.equal(widget.type, 'widget');
  assert.ok(Number.isFinite(Date.parse(widget.refreshAfter)));
  const types = new Set(['widget', 'stack', 'text', 'image', 'spacer', 'date']);
  const walk = element => {
    assert.ok(types.has(element.type), `Unknown DSL element ${element.type}`);
    if (element.type === 'text') { assert.equal(typeof element.text, 'string'); assert.ok(!/undefined|NaN/.test(element.text)); }
    if (element.type === 'date') assert.ok(Number.isFinite(Date.parse(element.date)));
    if (element.children) { assert.ok(Array.isArray(element.children)); element.children.forEach(walk); }
  };
  walk(widget);
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(widget)));
}

test('empty/whitespace POLICY performs no requests and gives setup instructions', async () => {
  for (const policy of ['', '   ']) for (const family of families) {
    const ctx = mockContext({ env: { POLICY: policy }, family });
    const widget = await main(ctx);
    validateDSL(widget); assert.equal(ctx.calls.length, 0);
    assert.match(JSON.stringify(widget), /请设置检测策略组/);
  }
});

test('every request uses the exact policy, omits cookies and carries a bounded timeout', async () => {
  const policy = ' 🇭🇰 香港 / AI "组" ';
  const ctx = mockContext({ env: { POLICY: policy }, delay: true });
  const report = await collectReport(ctx);
  assert.equal(report.state, 'ready'); assert.equal(report.media.length, 6);
  assert.ok(ctx.calls.length >= 12); assert.ok(ctx.peak() <= 4);
  for (const call of ctx.calls) {
    assert.equal(call.options.policy, policy); assert.equal(call.options.credentials, 'omit');
    assert.ok(call.options.timeout > 0 && call.options.timeout <= 6000);
    assert.ok(!Object.hasOwn(call.options, 'insecureTls'));
  }
});

test('fresh requests after node change do not reuse results for the same group name', async () => {
  const first = await collectReport(mockContext({ env: { MEDIA_TEST: 'false' } }));
  const second = await collectReport(mockContext({ env: { MEDIA_TEST: 'false' }, overrides: {
    [ENDPOINTS.ippure]: { ...pure, ip: SECOND_IP, fraudScore: 88 },
    [ENDPOINTS.ipapi]: { ...full, ip: SECOND_IP }, [ENDPOINTS.ipify]: { ip: SECOND_IP },
  } }));
  assert.equal(first.ip, IP); assert.equal(second.ip, SECOND_IP);
  assert.equal(first.risk.score, 17); assert.equal(second.risk.score, 88);
});

test('initial multi-exit result suppresses risk and does not start media probes', async () => {
  const ctx = mockContext({ overrides: { [ENDPOINTS.ipify]: { ip: SECOND_IP } } });
  const report = await collectReport(ctx);
  assert.equal(report.state, 'inconsistent'); assert.equal(report.risk.score, null);
  assert.equal(report.risk.abuse, null); assert.deepEqual(report.media, []);
  assert.equal(ctx.calls.length, 3);
});

test('exit change at end invalidates media and scores', async () => {
  const report = await collectReport(mockContext({ finalIP: SECOND_IP }));
  assert.equal(report.state, 'inconsistent'); assert.equal(report.risk.score, null);
  assert.ok(report.media.every(m => m.state === 'unknown' && !m.region));
  assert.equal(report.observations.at(-1).ip, SECOND_IP);
});

test('failed final check is explicitly marked rather than claimed consistent', async () => {
  const report = await collectReport(mockContext({ overrides: {
    [ENDPOINTS.ipify]: ({ ipifyCalls }) => ipifyCalls > 1 ? new Error('network error') : { ip: IP },
  } }));
  assert.match(report.warnings.join(' '), /出口复核失败/);
});

test('zero is a valid score; null, booleans, blank and invalid ranges stay unknown', () => {
  assert.equal(parseRisk({ fraudScore: 0 }, null, IP).score, 0);
  for (const value of [null, undefined, '', ' ', true, false, {}, [], -1, 101, 'bad']) {
    assert.equal(parseRisk({ fraudScore: value }, null, IP).score, null);
  }
  assert.equal(parseRisk({ fraudScore: '0' }, { company: { abuser_score: '0 (Very Low)' } }, IP).abuse, '0%');
  assert.equal(parseRisk(null, { company: { abuser_score: '4 (Invalid)' } }, IP).abuse, null);
});

test('anonymous ipapi shape and absent security flags do not become zero risk or residential', () => {
  assert.equal(profileFor(null, anonymous).country, 'Example Country');
  assert.equal(profileFor(null, anonymous).asn, 'AS64496 Example Network');
  assert.deepEqual(parseRisk(null, anonymous, IP), { score: null, abuse: null, type: '未知', native: '未知' });
  assert.equal(parseRisk({ isResidential: false }, null, IP).type, '非住宅');
});

test('anonymous data remains useful if IPPure is unavailable', async () => {
  const report = await collectReport(mockContext({ env: { MEDIA_TEST: 'false' }, overrides: {
    [ENDPOINTS.ippure]: new Error('blocked'), [ENDPOINTS.ipapi]: anonymous,
  } }));
  assert.equal(report.state, 'ready'); assert.equal(report.profile.source, 'ipapi');
  assert.equal(report.risk.score, null); assert.ok(report.warnings.length);
});

test('key goes only to ipapi HTTPS POST body and cannot appear in widget JSON or errors', async () => {
  const key = 'synthetic-test-key-do-not-use';
  const ctx = mockContext({ env: { IPAPI_KEY: key, MEDIA_TEST: 'false' }, overrides: {
    [ENDPOINTS.ipapi]: new Error(`socket failure includes ${key}`),
  } });
  const widget = await main(ctx);
  const keyed = ctx.calls.filter(c => c.options.body?.key);
  assert.equal(keyed.length, 1); assert.equal(keyed[0].url, ENDPOINTS.ipapi);
  assert.equal(keyed[0].method, 'POST'); assert.equal(keyed[0].options.body.key, key);
  assert.equal(keyed[0].options.redirect, 'error');
  assert.ok(ctx.calls.every(c => !c.url.includes(key)));
  assert.ok(!JSON.stringify(widget).includes(key));
});

test('all source failures produce an error widget, never a cached score', async () => {
  for (const family of families) {
    const ctx = mockContext({ family, overrides: Object.fromEntries(Object.values(ENDPOINTS).map(url => [url, new Error('timeout')])) });
    const widget = await main(ctx); validateDSL(widget);
    assert.match(JSON.stringify(widget), /出口检测失败/); assert.equal(ctx.calls.length, 3);
    assert.ok(!JSON.stringify(widget).includes('/100'));
  }
});

test('HTTP rate limits, HTML and payload error are not accepted as valid sources', async () => {
  const ctx = mockContext({ overrides: {
    [ENDPOINTS.ippure]: { httpStatus: 429, rawBody: 'too many requests' },
    [ENDPOINTS.ipapi]: { rawBody: '<html>login</html>' },
    [ENDPOINTS.ipify]: { ip: IP, error: 'API failed' },
  } });
  const report = await collectReport(ctx);
  assert.equal(report.state, 'failed'); assert.ok(report.sources.every(s => !s.ok));
});

test('IP validation and IPv6 normalization do not treat IPv6 zero as zero risk', () => {
  assert.equal(normalizeIP('2001:0db8:0:0:0:0:0:1'), '2001:db8::1');
  assert.equal(normalizeIP('::'), '::');
  assert.equal(normalizeIP('::ffff:192.0.2.1'), '::ffff:c000:201');
  assert.equal(normalizeIP('2001:DB8:1:2:3:4:5:6'), '2001:db8:1:2:3:4:5:6');
  for (const ip of ['999.1.1.1', '01.2.3.4', 'hello', '::1::2', '1.2.3', 'http://1.2.3.4']) assert.equal(normalizeIP(ip), '');
  assert.equal(parseRisk({ fraudScore: 0 }, null, '2001:db8::1').score, null);
});

test('mask covers primary and inconsistent-exit IPs in all widget sizes', async () => {
  const report = await collectReport(mockContext({ env: { MASK_IP: 'true' }, finalIP: SECOND_IP }));
  for (const family of families) {
    const widget = renderWidget(report, family); validateDSL(widget);
    const json = JSON.stringify(widget); assert.ok(!json.includes(IP)); assert.ok(!json.includes(SECOND_IP));
  }
});

test('valid output renders for all seven families, including a long group name', async () => {
  const report = await collectReport(mockContext({ env: { POLICY: '🇭🇰 很长的策略组名称 - 带空格 / 自动选择 / AI 专用' } }));
  for (const family of families) validateDSL(renderWidget(report, family));
});

test('compact large layout preserves partial failure, raw score, media results and masking', async () => {
  const report = await collectReport(mockContext({ env: { POLICY: '美国手动', MASK_IP: 'true' }, overrides: {
    [ENDPOINTS.ippure]: { ...pure, fraudScore: 86, isResidential: false },
    [ENDPOINTS.ipapi]: new Error('synthetic timeout'),
    [ENDPOINTS.ipify]: { httpStatus: 400, rawBody: 'synthetic bad request' },
    'https://www.tiktok.com/': 'Verify that you are human',
  } }));
  const before = structuredClone(report);
  const widget = renderWidget(report, 'systemLarge'); validateDSL(widget);
  const texts = node => [node.type === 'text' ? node.text : '', ...(node.children || []).flatMap(texts)];
  const content = texts(widget).join('\n');
  for (const label of ['美国手动', 'IPPure 风险', '86', '/100', '非住宅', '原生 IP', '仅页面探测', '出口复核失败', 'ipapi 未响应', 'ipify HTTP 400']) assert.ok(content.includes(label), label);
  for (const media of report.media) {
    assert.ok(content.includes(media.name === 'ChatGPT Web' ? 'ChatGPT' : media.name));
    assert.ok(content.includes(media.label));
  }
  assert.ok(!content.includes(IP));
  assert.deepEqual(report, before);
});

test('rendered risk keeps zero distinct from missing score', async () => {
  for (const score of [0, null]) {
    const report = await collectReport(mockContext({ overrides: { [ENDPOINTS.ippure]: { ...pure, fraudScore: score } } }));
    const widget = renderWidget(report, 'systemLarge'); validateDSL(widget);
    const json = JSON.stringify(widget);
    if (score === 0) { assert.match(json, /"text":"0"/); assert.match(json, /"text":"\/100"/); }
    else { assert.match(json, /"text":"未知"/); assert.doesNotMatch(json, /\/100/); }
  }
});

test('refresh defaults and bounds are respected; media off emits only three probes', async () => {
  for (const value of ['', '-1', 'bad']) assert.equal(readConfig({ REFRESH_MINUTES: value }).refreshMinutes, 60);
  assert.equal(readConfig({ REFRESH_MINUTES: '1' }).refreshMinutes, 15);
  assert.equal(readConfig({ REFRESH_MINUTES: '999999' }).refreshMinutes, 1440);
  const ctx = mockContext({ env: { MEDIA_TEST: 'false' } });
  const report = await collectReport(ctx); assert.equal(ctx.calls.length, 3); assert.equal(report.media.length, 0);
});

test('queue stops issuing network requests when the total deadline is exhausted', async t => {
  const ctx = mockContext();
  let count = 0;
  t.mock.method(Date, 'now', () => count++ < 4 ? 1000 : 30000);
  const report = await collectReport(ctx);
  assert.equal(ctx.calls.length, 3);
  assert.ok(report.media.every(m => m.state === 'unknown'));
});

for (const name of MEDIA) {
  test(`${name}: HTTP failures, generic HTML and challenges never mean reachable`, () => {
    const n = name === 'Netflix' || name === 'ChatGPT Web' ? 2 : 1;
    for (const response of [
      { status: 403, body: 'Forbidden' }, { status: 429, body: 'limited' },
      { status: 302, body: 'redirect' }, { status: 200, body: '<html>Hello</html>' },
      { status: 200, body: 'Just a moment... Netflix TikTok Reddit YouTube Premium "contentRegion":"US"' },
    ]) assert.equal(parseMedia(name, Array(n).fill(response)).state, 'unknown');
  });
}

test('explicit restrictions are recognized without treating a bare 403 as proof', () => {
  assert.equal(parseMedia('ChatGPT Web', [{ status: 403, body: '{"error":{"code":"unsupported_country_region_territory"}}' }, null]).state, 'restricted');
  assert.equal(parseMedia('YouTube', [{ status: 200, body: 'Premium is not available in your country' }]).state, 'restricted');
  assert.equal(parseMedia('Netflix', [{ status: 200, body: 'NSEZ-404' }, { status: 200, body: 'Oh no!' }]).state, 'restricted');
});

test('all six positive fixtures are only described as page or endpoint probes', async () => {
  const report = await collectReport(mockContext());
  assert.ok(report.media.every(m => m.state === 'reachable'));
  assert.ok(report.media.every(m => !/解锁|可播放/.test(m.label)));
});
