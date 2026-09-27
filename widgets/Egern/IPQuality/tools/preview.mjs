import { writeFile, mkdir } from 'node:fs/promises';
import { VERSION, ENDPOINTS, collectReport, renderWidget, readConfig } from '../ip-quality.js';
import { mockContext, pure, SECOND_IP } from '../test/fixtures.mjs';

const ready = await collectReport(mockContext({ env: { POLICY: '🇭🇰 香港策略组' } }));
const partial = await collectReport(mockContext({ env: { POLICY: '美国手动', MASK_IP: 'true' }, overrides: {
  [ENDPOINTS.ippure]: { ...pure, countryCode: 'US', city: 'Example City', fraudScore: 86, isResidential: false },
  [ENDPOINTS.ipapi]: new Error('synthetic timeout'),
  [ENDPOINTS.ipify]: { httpStatus: 400, rawBody: 'synthetic bad request' },
  'https://www.tiktok.com/': 'Verify that you are human',
} }));
const changed = await collectReport(mockContext({ env: { MASK_IP: 'true' }, finalIP: SECOND_IP }));
const mediaOff = await collectReport(mockContext({ env: { POLICY: '美国手动', MEDIA_TEST: 'false' } }));
const long = structuredClone(ready);
long.config.policy = '🇭🇰 很长的策略组名称 / 手动选择 / 测试';
long.ip = '2001:db8:1234:5678:9abc:def0:1234:5678';
long.risk.score = null;
const now = new Date().toISOString();
const reports = {
  部分来源失败: partial,
  正常夹具: ready,
  多出口夹具: changed,
  长名称与IPv6: long,
  关闭媒体: mediaOff,
  未配置: { state: 'unconfigured', config: readConfig(), updatedAt: now },
  网络失败: { state: 'failed', config: readConfig({ POLICY: '🇭🇰 香港策略组' }), updatedAt: now },
};
const sizes = { systemSmall: [158, 158], systemMedium: [338, 158], systemLarge: [338, 338] };
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function color(value, dark) { return typeof value === 'object' ? value[dark ? 'dark' : 'light'] : value; }
function element(node, dark) {
  const style = ['box-sizing:border-box', 'min-width:0'];
  if (node.flex) style.push(`flex:${node.flex} 1 0`);
  if (node.width) style.push(`width:${node.width}px`);
  if (node.height) style.push(`height:${node.height}px`, `min-height:${node.height}px`);
  if (node.padding) style.push(`padding:${(Array.isArray(node.padding) ? node.padding : [node.padding]).map(v => `${v}px`).join(' ')}`);
  if (node.borderRadius) style.push(`border-radius:${node.borderRadius}px`);
  if (node.backgroundColor) style.push(`background:${color(node.backgroundColor, dark)}`);
  if (node.textColor) style.push(`color:${color(node.textColor, dark)}`);
  if (node.font) {
    style.push(`font-size:${node.font.size}px`, `font-weight:${({ semibold: 600, medium: 500, bold: 700 })[node.font.weight] || 400}`);
    if (node.font.family) style.push('font-family:Consolas,monospace');
  }
  if (node.type === 'widget' || node.type === 'stack') {
    const horizontal = node.direction === 'row';
    style.push('display:flex', `flex-direction:${horizontal ? 'row' : 'column'}`, `gap:${node.gap || 0}px`);
    style.push(`align-items:${horizontal ? node.alignItems === 'start' ? 'flex-start' : 'center' : 'stretch'}`);
    if (node.type === 'widget') style.push('width:100%', 'height:100%');
    return `<div style="${esc(style.join(';'))}">${(node.children || []).map(n => element(n, dark)).join('')}</div>`;
  }
  if (node.type === 'spacer') return `<div style="${node.length ? `flex:0 0 ${node.length}px` : 'flex:1 1 0'};min-height:0;min-width:0"></div>`;
  if (node.type === 'image') return `<span aria-label="${esc(node.src)}" style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:${node.width}px;height:${node.height}px;color:${color(node.color, dark)};font-size:${node.width}px;line-height:1">${node.src === 'sf-symbol:circle.fill' ? '●' : '◎'}</span>`;
  style.push('line-height:1.15', 'overflow:hidden');
  if (node.textAlign) style.push(`text-align:${node.textAlign}`);
  if (node.maxLines > 1) style.push('white-space:pre-line', 'display:-webkit-box', '-webkit-box-orient:vertical', `-webkit-line-clamp:${node.maxLines}`);
  else style.push('white-space:nowrap', 'text-overflow:ellipsis');
  return `<div ${node.minScale ? `data-scale="${node.minScale}"` : ''} style="${esc(style.join(';'))}">${esc(node.type === 'date' ? '14:54' : node.text)}</div>`;
}
let cards = '';
for (const dark of [false, true]) for (const [label, report] of Object.entries(reports)) {
  for (const [family, [width, height]] of Object.entries(sizes)) {
    cards += `<section data-scenario="${esc(label)}" data-theme="${dark ? 'dark' : 'light'}"><h2>${esc(label)} / ${family} / ${dark ? '深色' : '浅色'}</h2><div class="surface" data-case="${esc(label)}-${family}-${dark}" style="width:${width}px;height:${height}px">${element(renderWidget(report, family), dark)}</div></section>`;
  }
}
const options = Object.keys(reports).map(label => `<option>${esc(label)}</option>`).join('');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Egern 小组件布局预览（模拟数据）</title><style>body{margin:24px;background:#E7E9ED;font-family:Arial,"Microsoft YaHei",sans-serif;color:#202630}h1{font-size:21px;margin:0 0 10px}p{font-size:12px;max-width:900px;color:#687283}main{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}section h2{font-size:11px;font-weight:400}.surface{border-radius:22px;overflow:hidden;box-shadow:0 3px 10px #152E4010}section{padding-bottom:16px}section[hidden]{display:none}label{font-size:12px;margin-right:20px}select{padding:6px;margin:8px;background:white;color:#202630;border:1px solid #ACB3BD;border-radius:6px}select:focus-visible{outline:2px solid #276F9A;outline-offset:2px}</style><h1>Egern 节点检测 v${VERSION}</h1><p>全部为合成数据，IP 为文档示例地址。本页近似呈现布局、缩放和图标，不是 Egern 原生截图。</p><nav><label>场景<select id="scenario">${options}<option value="all">全部</option></select></label><label>外观<select id="theme"><option value="dark">深色</option><option value="light">浅色</option><option value="all">全部</option></select></label></nav><main>${cards}</main><script>
function update() {
  const scenario = document.querySelector('#scenario').value;
  const theme = document.querySelector('#theme').value;
  for (const section of document.querySelectorAll('section')) section.hidden = (scenario !== 'all' && section.dataset.scenario !== scenario) || (theme !== 'all' && section.dataset.theme !== theme);
  for (const node of document.querySelectorAll('section:not([hidden]) [data-scale]')) {
    const base = Number(node.dataset.baseSize || parseFloat(getComputedStyle(node).fontSize));
    node.dataset.baseSize = base; node.style.fontSize = base + 'px';
    if (getComputedStyle(node).whiteSpace === 'nowrap' && node.clientWidth && node.scrollWidth > node.clientWidth) node.style.fontSize = base * Math.max(Number(node.dataset.scale), node.clientWidth / node.scrollWidth) + 'px';
  }
}
document.querySelectorAll('select').forEach(node => node.addEventListener('change', update));
document.fonts.ready.then(update); update();
</script></html>`;
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/preview.html', import.meta.url), html, 'utf8');
console.log('Created artifacts/preview.html using synthetic fixtures only.');
