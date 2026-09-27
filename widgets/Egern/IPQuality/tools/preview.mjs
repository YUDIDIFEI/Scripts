import { writeFile, mkdir } from 'node:fs/promises';
import { collectReport, renderWidget, readConfig } from '../ip-quality.js';
import { mockContext, SECOND_IP } from '../test/fixtures.mjs';

const ready = await collectReport(mockContext({ env: { POLICY: '🇭🇰 香港策略组' } }));
const changed = await collectReport(mockContext({ env: { MASK_IP: 'true' }, finalIP: SECOND_IP }));
const now = new Date().toISOString();
const reports = {
  正常夹具: ready,
  多出口夹具: changed,
  未配置: { state: 'unconfigured', config: readConfig(), updatedAt: now },
  网络失败: { state: 'failed', config: readConfig({ POLICY: '🇭🇰 香港策略组' }), updatedAt: now },
};
const sizes = { systemSmall: [158, 158], systemMedium: [338, 158], systemLarge: [338, 354] };
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function color(value, dark) { return typeof value === 'object' ? value[dark ? 'dark' : 'light'] : value; }
function element(node, dark) {
  const style = ['box-sizing:border-box', 'min-width:0'];
  if (node.flex) style.push(`flex:${node.flex} 1 0`);
  if (node.padding) style.push(`padding:${node.padding}px`);
  if (node.backgroundColor) style.push(`background:${color(node.backgroundColor, dark)}`);
  if (node.textColor) style.push(`color:${color(node.textColor, dark)}`);
  if (node.font) {
    style.push(`font-size:${node.font.size}px`, `font-weight:${node.font.weight === 'semibold' ? 600 : 400}`);
    if (node.font.family) style.push('font-family:Consolas,monospace');
  }
  if (node.type === 'widget' || node.type === 'stack') {
    const horizontal = node.direction === 'row';
    style.push('display:flex', `flex-direction:${horizontal ? 'row' : 'column'}`, `gap:${node.gap || 0}px`);
    style.push(`align-items:${horizontal ? node.alignItems === 'start' ? 'flex-start' : 'center' : 'stretch'}`);
    if (node.type === 'widget') style.push('width:100%', 'height:100%');
    return `<div style="${esc(style.join(';'))}">${(node.children || []).map(n => element(n, dark)).join('')}</div>`;
  }
  if (node.type === 'spacer') return '<div style="flex:1 1 0;min-height:0;min-width:0"></div>';
  if (node.type === 'image') return `<span aria-label="network" style="color:${color(node.color, dark)};font-size:14px;line-height:1">◎</span>`;
  style.push('line-height:1.15', 'overflow:hidden');
  if (node.textAlign) style.push(`text-align:${node.textAlign}`);
  if (node.maxLines > 1) style.push('white-space:pre-line', 'display:-webkit-box', '-webkit-box-orient:vertical', `-webkit-line-clamp:${node.maxLines}`);
  else style.push('white-space:nowrap', 'text-overflow:ellipsis');
  return `<div style="${esc(style.join(';'))}">${esc(node.type === 'date' ? '14:30' : node.text)}</div>`;
}
let cards = '';
for (const dark of [false, true]) for (const [label, report] of Object.entries(reports)) {
  for (const [family, [width, height]] of Object.entries(sizes)) {
    cards += `<section><h2>${esc(label)} / ${family} / ${dark ? '深色' : '浅色'}</h2><div class="surface" data-case="${esc(label)}-${family}-${dark}" style="width:${width}px;height:${height}px">${element(renderWidget(report, family), dark)}</div></section>`;
  }
}
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Egern 小组件布局预览（模拟数据）</title><style>body{margin:24px;background:#DFE8F0;font-family:Arial,"Microsoft YaHei",sans-serif;color:#152E40}h1{font-size:22px}p{max-width:900px}main{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}section h2{font-size:11px;font-weight:400}.surface{border-radius:22px;overflow:hidden;box-shadow:0 3px 10px #152E4020}section{padding-bottom:16px}</style><h1>Egern 小组件布局预览</h1><p>全部为合成夹具数据；文档示例 IP 不代表真实检测。此页面近似展示 DSL 布局，不能替代 iPhone 原生渲染验收。</p><main>${cards}</main></html>`;
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/preview.html', import.meta.url), html, 'utf8');
console.log('Created artifacts/preview.html using synthetic fixtures only.');
