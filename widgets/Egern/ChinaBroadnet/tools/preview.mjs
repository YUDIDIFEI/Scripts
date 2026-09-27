import { mkdir, writeFile } from 'node:fs/promises';
import { VERSION, STYLES, parsePayload, readConfig, renderWidget } from '../china-broadnet.js';
import { payload } from '../test/fixtures.mjs';

const now = new Date().toISOString();
const cases = {
  正常: parsePayload(payload),
  零余额: parsePayload({ status: '000000', data: { userData: { fee: 0, flow: 0, flowAll: 100, voice: 0, voiceAll: 100 } } }),
  部分缺失: parsePayload({ status: '000000', data: { userData: { fee: -1200, flow: null, voice: 320, voiceAll: 0 } } }),
  待获取登录: { state: 'unconfigured', message: '启用登录获取模块，在广电营业厅小程序登录并刷新；也可在 Egern 手动填写 ACCESS 和 BODY。' },
  查询失败: { state: 'failed', message: '登录已失效或接口异常，请在营业厅重新登录并获取参数。' },
  登录清除: { state: 'cleared', message: '本组件本地登录已清除。手动填写过的 ACCESS / BODY 请自行清空，再将“登录操作”改回正常显示。' },
};
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const color = (value, dark) => typeof value === 'object' ? value[dark ? 'dark' : 'light'] : value;
function element(node, dark) {
  const css = ['box-sizing:border-box', 'min-width:0'];
  if (node.flex) css.push(`flex:${node.flex} 1 0`);
  if (node.width) css.push(`width:${node.width}px`);
  if (node.height) css.push(`height:${node.height}px`, `min-height:${node.height}px`);
  if (node.padding) css.push(`padding:${(Array.isArray(node.padding) ? node.padding : [node.padding]).map(n => `${n}px`).join(' ')}`);
  if (node.borderRadius) css.push(`border-radius:${node.borderRadius}px`);
  if (node.backgroundColor) css.push(`background:${color(node.backgroundColor, dark)}`);
  if (node.textColor) css.push(`color:${color(node.textColor, dark)}`);
  if (node.font) css.push(`font-size:${node.font.size}px`, `font-weight:${({ semibold: 600, medium: 500, bold: 700 })[node.font.weight] || 400}`);
  if (node.type === 'widget' || node.type === 'stack') {
    const horizontal = node.direction === 'row';
    css.push('display:flex', `flex-direction:${horizontal ? 'row' : 'column'}`, `gap:${node.gap || 0}px`, `align-items:${horizontal ? 'center' : 'stretch'}`);
    if (node.type === 'widget') css.push('width:100%', 'height:100%');
    return `<div style="${esc(css.join(';'))}">${(node.children || []).map(n => element(n, dark)).join('')}</div>`;
  }
  if (node.type === 'spacer') return '<div style="flex:1 1 0;min-height:0;min-width:0"></div>';
  if (node.type === 'image') {
    if (node.src.startsWith('data:image/')) return `<img alt="剩余比例" src="${esc(node.src)}" style="${esc(css.join(';'))};flex-shrink:0;align-self:center">`;
    const symbol = node.src.includes('phone') ? '☎' : node.src.includes('yensign') ? '¥' : '◎';
    return `<span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:${node.width}px;height:${node.height}px;color:${color(node.color, dark)};font-size:${node.width}px;line-height:1">${symbol}</span>`;
  }
  css.push('line-height:1.15', 'overflow:hidden');
  if (node.textAlign) css.push(`text-align:${node.textAlign}`);
  if (node.maxLines > 1) css.push('white-space:pre-line', 'display:-webkit-box', '-webkit-box-orient:vertical', `-webkit-line-clamp:${node.maxLines}`);
  else css.push('white-space:nowrap', 'text-overflow:ellipsis');
  return `<div ${node.minScale ? `data-scale="${node.minScale}"` : ''} style="${esc(css.join(';'))}">${esc(node.type === 'date' ? '16:08' : node.text)}</div>`;
}
let cards = '';
const sizes = { systemSmall: [158, 158], systemMedium: [338, 158], systemLarge: [338, 338] };
for (const dark of [false, true]) for (const [label, data] of Object.entries(cases)) {
  for (const [family, [width, height]] of Object.entries(sizes)) for (const style of family === 'systemSmall' ? STYLES : [STYLES[0]]) {
    const report = { ...structuredClone(data), config: readConfig({ STYLE: style, ACCOUNT_NAME: '我的广电' }), updatedAt: now };
    cards += `<section data-scenario="${label}" data-theme="${dark ? 'dark' : 'light'}"><h2>${family === 'systemSmall' ? style : family === 'systemMedium' ? '中尺寸' : '大尺寸 / 画廊'}</h2><div class="surface" data-case="${label}-${family}-${style}-${dark}" style="width:${width}px;height:${height}px">${element(renderWidget(report, family), dark)}</div></section>`;
  }
}
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>中国广电 Egern 模拟预览</title><style>body{margin:24px;background:#E7EBF0;color:#243449;font-family:Arial,'Microsoft YaHei',sans-serif}h1{font-size:22px;margin:0 0 8px}p{font-size:12px;color:#687687}label{font-size:12px;margin-right:20px}select{padding:6px;margin:8px;background:white;border:1px solid #A7B1C0;border-radius:6px;color:#243449}select:focus-visible{outline:2px solid #2F74A4;outline-offset:2px}main{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}section[hidden]{display:none}h2{font-size:11px;font-weight:400}.surface{border-radius:20px;overflow:hidden}section{padding-bottom:10px}</style><h1>中国广电 · Egern v${VERSION}</h1><p>脑瓜原作，YUDIDIFEI 适配。所有余额为合成示例；本页近似模拟原生布局，不是手机实机截图。</p><nav><label>场景<select id="scenario">${Object.keys(cases).map(x => `<option>${x}</option>`).join('')}<option value="all">全部</option></select></label><label>外观<select id="theme"><option value="dark">深色</option><option value="light">浅色</option><option value="all">全部</option></select></label></nav><main>${cards}</main><script>
function update(){const scenario=document.querySelector('#scenario').value,theme=document.querySelector('#theme').value;for(const section of document.querySelectorAll('section'))section.hidden=(scenario!=='all'&&section.dataset.scenario!==scenario)||(theme!=='all'&&section.dataset.theme!==theme);for(const node of document.querySelectorAll('section:not([hidden]) [data-scale]')){const base=Number(node.dataset.baseSize||parseFloat(getComputedStyle(node).fontSize));node.dataset.baseSize=base;node.style.fontSize=base+'px';if(getComputedStyle(node).whiteSpace==='nowrap'&&node.clientWidth&&node.scrollWidth>node.clientWidth)node.style.fontSize=base*Math.max(Number(node.dataset.scale),node.clientWidth/node.scrollWidth)+'px';}}
document.querySelectorAll('select').forEach(node=>node.addEventListener('change',update));document.fonts.ready.then(update);update();
</script></html>`;
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/preview.html', import.meta.url), html, 'utf8');
console.log('Created artifacts/preview.html with synthetic balances only (96 cases).');
