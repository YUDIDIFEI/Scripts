import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDocument } from 'yaml';
import { VERSION, readConfig } from '../ip-quality.js';

test('module YAML parses, links a real generic script and exposes the implemented settings', () => {
  const doc = parseDocument(readFileSync(new URL('../ip-quality.yaml', import.meta.url), 'utf8'), { uniqueKeys: true });
  assert.deepEqual(doc.errors, []);
  const module = doc.toJS();
  assert.equal(module.scriptings.length, 1); assert.equal(module.widgets.length, 1);
  const generic = module.scriptings[0].generic;
  assert.equal(module.widgets[0].script_name, generic.name);
  assert.equal(generic.timeout, 30); assert.equal(generic.update_interval, 86400);
  assert.equal(generic.script_url, 'https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/IPQuality/ip-quality.js');
  assert.match(module.description, new RegExp(VERSION.replaceAll('.', '\\.')));
  assert.deepEqual(Object.keys(module.env_schema).sort(), ['IPAPI_KEY', 'MASK_IP', 'MEDIA_TEST', 'POLICY', 'REFRESH_MINUTES']);
  assert.equal(readConfig().policy, '');
  for (const setting of ['MEDIA_TEST', 'MASK_IP']) assert.deepEqual(module.env_schema[setting].options, ['true', 'false']);
  for (const field of ['rules', 'mitm', 'url_rewrites', 'map_locals']) assert.ok(!Object.hasOwn(module, field));
  assert.ok(!Object.hasOwn(module.env_schema.IPAPI_KEY, 'default_value'));
});
