import test from 'node:test';
import assert from 'node:assert/strict';
import main, { ENDPOINT, STORAGE_KEY, STYLES, readConfig, parsePayload, loadReport, renderWidget } from '../china-broadnet.js';
import { ACCESS, DATA, payload, memoryStorage, requestContext, widgetContext } from './fixtures.mjs';

const families = ['systemSmall', 'systemMedium', 'systemLarge', 'systemExtraLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'];
const manual = { ACCESS, BODY: DATA };
const flatten = node => [node.type === 'text' ? node.text : '', ...(node.children || []).flatMap(flatten)];
function validate(widget) {
  assert.equal(widget.type, 'widget'); assert.ok(Number.isFinite(Date.parse(widget.refreshAfter)));
  const types = new Set(['widget', 'stack', 'text', 'image', 'spacer', 'date']);
  function visit(node) {
    assert.ok(types.has(node.type));
    if (node.type === 'text') { assert.equal(typeof node.text, 'string'); assert.doesNotMatch(node.text, /undefined|NaN|Infinity/); }
    if (node.type === 'date') assert.ok(Number.isFinite(Date.parse(node.date)));
    if (node.width !== undefined || node.height !== undefined) assert.ok(['stack', 'image'].includes(node.type));
    if (node.children) node.children.forEach(visit);
  }
  visit(widget);
  const json = JSON.stringify(widget); assert.ok(!json.includes(ACCESS)); assert.ok(!json.includes(DATA));
}

test('capture -> persistent pair -> official query -> widget, without BoxJs or changed request body', async () => {
  const storage = memoryStorage();
  const body = ' { "data" : "' + DATA + '", "extra": 1 }\n';
  const capture = requestContext({ storage, body });
  assert.deepEqual(await main(capture), { body }); assert.equal(capture.reads(), 1);
  const saved = JSON.parse(storage.get(STORAGE_KEY));
  assert.equal(saved.access, ACCESS); assert.equal(saved.data, DATA);
  assert.ok(Number.isFinite(Date.parse(saved.capturedAt))); assert.equal(storage.values.size, 1);
  assert.equal(capture.notices.length, 1); assert.ok(!JSON.stringify(capture.notices).includes(ACCESS)); assert.ok(!JSON.stringify(capture.notices).includes(DATA));
  const ctx = widgetContext({ storage }); const widget = await main(ctx); validate(widget);
  assert.equal(ctx.calls.length, 1);
  const { url, options } = ctx.calls[0];
  assert.equal(url, ENDPOINT); assert.deepEqual(options.headers, { access: ACCESS, 'content-type': 'application/json' });
  assert.equal(options.body, JSON.stringify({ data: DATA })); assert.equal(options.policy, 'DIRECT');
  assert.equal(options.timeout, 10000); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
  assert.equal(options.insecureTls, undefined);
  assert.match(flatten(widget).join(' '), /86\.50/); assert.match(flatten(widget).join(' '), /28\.50/); assert.match(flatten(widget).join(' '), /320/);
  assert.equal(ctx.notices.length, 0);
});

test('unchanged capture does not send repeated success notifications', async () => {
  const storage = memoryStorage(); await main(requestContext({ storage }));
  const previous = storage.get(STORAGE_KEY), ctx = requestContext({ storage });
  await main(ctx); assert.equal(ctx.notices.length, 0); assert.equal(storage.get(STORAGE_KEY), previous);
});

test('capture ignores other origins, paths and methods before consuming or storing a body', async () => {
  const cases = [{ url: ENDPOINT.replace('https:', 'http:') }, { url: ENDPOINT.replace('wx.10099.com.cn', 'wx.10099.com.cn.example.invalid') }, { url: ENDPOINT + '/other' }, { url: ENDPOINT + '#fragment' }, { url: ENDPOINT + '\n' }, { method: 'GET' }, { url: 'invalid-url' }];
  for (const options of cases) {
    const ctx = requestContext(options); assert.equal(await main(ctx), undefined);
    assert.equal(ctx.reads(), 0); assert.equal(ctx.storage.values.size, 0); assert.equal(ctx.notices.length, 0);
  }
  const query = requestContext({ url: ENDPOINT + '?from=account' }); await main(query); assert.equal(query.storage.values.size, 1);
});

test('capture is case insensitive and preserves old complete pair when new input is invalid', async () => {
  const storage = memoryStorage(); await main(requestContext({ storage, headers: { aCcEsS: ACCESS } }));
  const before = storage.get(STORAGE_KEY);
  for (const options of [{ body: '{broken' }, { body: 'null' }, { body: '{}' }, { body: '{"data":null}' }, { body: '{"data":7}' }, { access: null }, { headers: { access: 'bad\r\nheader' } }]) {
    const ctx = requestContext({ storage, ...options }); const result = await main(ctx);
    assert.deepEqual(result, { body: options.body ?? JSON.stringify({ data: DATA }) });
    assert.equal(storage.get(STORAGE_KEY), before);
  }
});

test('read and storage failures never expose secrets or replace the request with a response', async () => {
  const read = requestContext({ readError: new Error(ACCESS) }); assert.equal(await main(read), undefined);
  const ctx = requestContext(); ctx.storage.set = () => { throw new Error(ACCESS + DATA); };
  assert.deepEqual(await main(ctx), { body: JSON.stringify({ data: DATA }) });
  assert.ok(!JSON.stringify([...read.notices, ...ctx.notices]).includes(ACCESS));
  assert.ok(!JSON.stringify(ctx.notices).includes(DATA));
});

test('missing login renders setup guidance and makes no requests in any family', async () => {
  for (const family of families) {
    const ctx = widgetContext({ family }); const widget = await main(ctx); validate(widget);
    assert.match(flatten(widget).join(' '), /登录/); assert.equal(ctx.calls.length, 0);
  }
});

test('manual data supports the opaque value or JSON envelope and does not mix credential sources', async () => {
  const storage = memoryStorage(); await main(requestContext({ storage }));
  for (const BODY of [DATA, JSON.stringify({ data: DATA, ignored: 'unused' })]) {
    const ctx = widgetContext({ env: { ACCESS, BODY } }); assert.equal((await loadReport(ctx)).state, 'ready');
    assert.equal(ctx.calls[0].options.body, JSON.stringify({ data: DATA })); assert.equal(ctx.storage.values.size, 0);
  }
  for (const env of [{ ACCESS }, { BODY: DATA }, { ACCESS, BODY: '{}' }, { ACCESS, BODY: '{broken' }]) {
    const ctx = widgetContext({ storage, env }); assert.equal((await loadReport(ctx)).state, 'unconfigured'); assert.equal(ctx.calls.length, 0);
  }
  const ctx = widgetContext({ storage, env: { ACCESS: 'synthetic-other-access', BODY: 'synthetic-other-data' } });
  await main(ctx); assert.equal(ctx.calls[0].options.headers.access, 'synthetic-other-access');
  assert.equal(JSON.parse(storage.get(STORAGE_KEY)).access, ACCESS);
});

test('clear action only deletes this widget session and performs no account request', async () => {
  const storage = memoryStorage({ unrelated: 'keep' }); await main(requestContext({ storage }));
  const ctx = widgetContext({ storage, env: { ...manual, ACTION: '清除登录' } });
  assert.equal((await loadReport(ctx)).state, 'cleared'); assert.equal(storage.get(STORAGE_KEY), null);
  assert.equal(storage.get('unrelated'), 'keep'); assert.equal(ctx.calls.length, 0);
  assert.equal(ctx.env.ACCESS, ACCESS); // The UI must explicitly clear manual settings itself.
});

test('upstream units, negative fee and real zero values are preserved', () => {
  const ready = parsePayload(payload);
  assert.equal(ready.metrics.fee.value, 86.5); assert.equal(ready.metrics.flow.value, 28.5);
  assert.equal(ready.metrics.flow.fraction, 0.57); assert.equal(ready.metrics.voice.fraction, 0.64);
  const zero = parsePayload({ status: '000000', data: { userData: { fee: -123, flow: 0, flowAll: 10, voice: '0', voiceAll: '10' } } });
  assert.equal(zero.metrics.fee.value, -1.23); assert.equal(zero.metrics.flow.value, 0); assert.equal(zero.metrics.flow.fraction, 0); assert.equal(zero.metrics.voice.value, 0);
});

test('missing and invalid fields never become fake zero balances or ratios', () => {
  for (const bad of [null, undefined, '', ' ', false, true, {}, [], '10GB', NaN, Infinity]) {
    const report = parsePayload({ status: '000000', data: { userData: { fee: 1, flow: bad, voice: bad } } });
    assert.equal(report.metrics.flow.value, null); assert.equal(report.metrics.voice.value, null); assert.equal(report.metrics.flow.fraction, null); assert.equal(report.incomplete, true);
  }
  for (const total of [undefined, null, 0, -1, 5]) {
    const report = parsePayload({ status: '000000', data: { userData: { fee: 1, flow: 10, flowAll: total, voice: -1 } } });
    assert.equal(report.metrics.flow.fraction, null); assert.equal(report.metrics.voice.value, null);
  }
  assert.equal(parsePayload({ status: '000000', data: { userData: {} } }).state, 'failed');
  assert.equal(parsePayload({ status: '000000', data: {} }).state, 'failed');
});

test('HTTP failures, expired login, invalid JSON and network errors show no stale or fabricated balances', async () => {
  for (const options of [{ status: 401 }, { status: 403 }, { status: 429 }, { status: 500 }, { status: 302 }, { response: { status: 'invalid-login', message: ACCESS + DATA } }, { error: new Error(ACCESS + DATA) }, { jsonError: new Error(DATA) }]) {
    const ctx = widgetContext({ env: manual, ...options }); const report = await loadReport(ctx);
    assert.equal(report.state, 'failed'); assert.equal(report.metrics, undefined);
    assert.ok(!JSON.stringify(report).includes(ACCESS)); assert.ok(!JSON.stringify(report).includes(DATA));
    const widget = renderWidget(report); validate(widget); assert.match(flatten(widget).join(' '), /账户查询失败/); assert.doesNotMatch(flatten(widget).join(' '), /86\.50|28\.50/);
  }
});

test('each refresh queries current data and never caches balances or a response containing personal fields', async () => {
  const storage = memoryStorage(); await main(requestContext({ storage })); const saved = storage.get(STORAGE_KEY);
  const first = widgetContext({ storage }); await main(first);
  const response = structuredClone(payload); response.data.userData.fee = 1234; response.data.phone = 'synthetic-private-phone';
  const second = widgetContext({ storage, response }); const widget = await main(second);
  assert.equal(first.calls.length, 1); assert.equal(second.calls.length, 1); assert.match(flatten(widget).join(' '), /12\.34/);
  assert.equal(storage.get(STORAGE_KEY), saved); assert.equal(storage.values.size, 1); assert.ok(!JSON.stringify(widget).includes('synthetic-private-phone'));
});

test('all styles and families render valid DSL, preserve source credit, and do not mutate results', async () => {
  for (const style of STYLES) {
    const report = await loadReport(widgetContext({ env: { ...manual, STYLE: style, ACCOUNT_NAME: '很长的广电账号备注 / 合成数据 / 检查' } }));
    const before = structuredClone(report);
    for (const family of families) { const widget = renderWidget(report, family); validate(widget); if (!family.startsWith('accessory')) assert.match(flatten(widget).join(' '), /脑瓜原作/); }
    assert.deepEqual(report, before);
  }
});

test('configuration limits refresh and color values, with no code or markup in SVG colors', async () => {
  assert.equal(readConfig().refreshMinutes, 60); assert.equal(readConfig({ REFRESH_MINUTES: '1' }).refreshMinutes, 15); assert.equal(readConfig({ REFRESH_MINUTES: '9999' }).refreshMinutes, 1440);
  const config = readConfig({ FLOW_COLOR: '#00aa88', FEE_COLOR: "red'><script>alert(1)</script>", STYLE: 'unknown' });
  assert.equal(config.colors.flow, '#00aa88'); assert.equal(typeof config.colors.fee, 'object'); assert.equal(config.style, STYLES[0]);
  const ctx = widgetContext({ env: { ...manual, ...{ FLOW_COLOR: '#00aa88', FEE_COLOR: "red'><script>alert(1)</script>" } } });
  const widget = await main(ctx); validate(widget); assert.ok(!JSON.stringify(widget).includes('<script>'));
});
