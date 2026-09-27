import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { ENDPOINT, VERSION, STYLES } from '../china-broadnet.js';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
test('display module has all Egern settings, a real widget and explicit original attribution, without MITM', async () => {
  const module = parse(await read('china-broadnet.yaml'));
  assert.match(module.author, /脑瓜/); assert.match(module.description, /非商业/); assert.ok(module.description.includes(VERSION));
  assert.equal(module.mitm, undefined); assert.equal(module.rules, undefined);
  assert.equal(module.scriptings.length, 1); const script = module.scriptings[0].generic;
  assert.equal(module.widgets[0].script_name, script.name); assert.equal(module.widgets[0].name, '中国广电');
  assert.equal(script.timeout, 15); assert.equal(script.script_url, `https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/ChinaBroadnet/china-broadnet.js?v=${VERSION}`);
  assert.deepEqual(module.env_schema.STYLE.options, STYLES);
  for (const key of ['ACCOUNT_NAME', 'STYLE', 'REFRESH_MINUTES', 'FEE_COLOR', 'FLOW_COLOR', 'VOICE_COLOR', 'ACCESS', 'BODY', 'API_HOST', 'ACTION']) assert.ok(module.env_schema[key]);
  assert.deepEqual(module.env_schema.API_HOST.options, ['wx.10099.com.cn', 'app.10099.com.cn']);
  assert.equal(module.env_schema.ACCESS.default_value, undefined); assert.equal(module.env_schema.BODY.default_value, undefined);
});
test('capture module only targets wx/app and the exact query path, and uses the same versioned JS', async () => {
  const display = parse(await read('china-broadnet.yaml')), capture = parse(await read('china-broadnet-capture.yaml'));
  assert.deepEqual(capture.mitm, { hostnames: ['wx.10099.com.cn', 'app.10099.com.cn'] }); assert.equal(capture.widgets, undefined); assert.equal(capture.rules, undefined);
  const script = capture.scriptings[0].http_request;
  assert.equal(script.body_required, true); assert.equal(script.timeout, 5); assert.equal(script.script_url, display.scriptings[0].generic.script_url);
  const match = new RegExp(script.match);
  for (const endpoint of [ENDPOINT, ENDPOINT.replace('wx.', 'app.')]) {
    assert.ok(match.test(endpoint)); assert.ok(match.test(endpoint + '?from=account')); assert.ok(match.test(endpoint.replace('.cn/', '.cn:443/')));
    for (const bad of [endpoint + '/other', endpoint + '?from=x#fragment', endpoint.replace('.cn/', '.cn.example.invalid/'), endpoint.replace('.cn/', '.cn:444/')]) assert.ok(!match.test(bad));
  }
  assert.ok(!match.test(ENDPOINT.replace('wx.', 'h5.')));
  assert.match(capture.author, /livinmoon/); assert.match(capture.description, /关闭/);
});
test('published script and notice retain original author, source URLs and noncommercial statement', async () => {
  const js = await read('china-broadnet.js'), notice = await read('NOTICE.md'), readme = await read('README.md');
  for (const source of [js, notice, readme]) { assert.match(source, /脑瓜/); assert.match(source, /anker1209/); assert.match(source, /livinmoon/); assert.match(source, /非商业|不得用于.*商业/); }
  assert.match(notice, /DmYY/); assert.match(notice, /dompling/); assert.match(notice, /chavyleung/);
  assert.doesNotMatch(js, /console\.|\bimport\b|\brequire\s*\(|\$request|\$persistentStore|\beval\s*\(/);
});
