/**
 * 中国广电 Egern 小组件 v1.0.0
 * 原作：脑瓜 / anker1209，ChinaBroadnet_2024 v1.2.2。
 * https://github.com/anker1209/Scriptable/blob/main/scripts/ChinaBroadnet_2024.js
 * 登录获取参考：wuhuhuuuu/study（现 livinmoon/study）。
 * https://github.com/livinmoon/study/tree/main/Scripts/ChinaBroadnet
 * Egern 适配：YUDIDIFEI。原创 UI 修改套用须注明来源；仅非商业学习研究。
 * 完整声明见同目录 NOTICE.md。无 BoxJs、DmYY 或外部运行库。
 */

const VERSION = '1.0.0';
const ENDPOINT = 'https://wx.10099.com.cn/contact-web/api/busi/qryUserInfo';
const STORAGE_KEY = 'YUDIDIFEI.ChinaBroadnet.session.v1';
const STYLES = ['彩色条目', '图标卡片', '双环仪表', '余额清单', '经典圆环', '简洁文字'];
const COLORS = {
  background: { light: '#FFFFFF', dark: '#171A21' },
  text: { light: '#243449', dark: '#F0F4FA' },
  muted: { light: '#687687', dark: '#A7B1C0' },
  fee: { light: '#2F74A4', dark: '#86B5DF' },
  flow: { light: '#158558', dark: '#6AD3A2' },
  voice: { light: '#BE624C', dark: '#F6A68E' },
};

export default async function main(ctx) {
  if (ctx.request) return ctx.response ? undefined : captureSession(ctx);
  const config = readConfig(ctx.env);
  const report = await loadReport(ctx, config);
  return renderWidget(report, ctx.widgetFamily || 'systemMedium');
}

function readConfig(env = {}) {
  const minutes = Number(env.REFRESH_MINUTES);
  const hex = (value, fallback) => /^#[\da-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim() : fallback;
  return {
    name: String(env.ACCOUNT_NAME || '我的广电').trim().slice(0, 60) || '我的广电',
    style: STYLES.includes(env.STYLE) ? env.STYLE : STYLES[0],
    refreshMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.min(1440, Math.max(15, minutes)) : 60,
    clear: env.ACTION === '清除登录',
    colors: { ...COLORS, fee: hex(env.FEE_COLOR, COLORS.fee), flow: hex(env.FLOW_COLOR, COLORS.flow), voice: hex(env.VOICE_COLOR, COLORS.voice) },
  };
}

function validAccess(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 16384 && !/[\x00-\x20\x7f]/.test(value);
}
function validData(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 65536;
}
function parseBodySetting(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim();
  if (input.startsWith('{')) {
    try { const data = JSON.parse(input).data; return validData(data) ? data : null; } catch { return null; }
  }
  return validData(input) ? input : null;
}
function readSaved(storage) {
  const raw = storage?.get(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    return validAccess(session?.access) && validData(session?.data) ? session : null;
  } catch { return null; }
}
function resolveSession(ctx) {
  const access = String(ctx.env?.ACCESS || '').trim();
  const rawBody = String(ctx.env?.BODY || '').trim();
  if (access || rawBody) {
    const data = parseBodySetting(rawBody);
    if (!validAccess(access) || !validData(data)) return { error: '请同时填写有效的 ACCESS 和 BODY，或同时清空后使用已获取的登录。' };
    return { session: { access, data } };
  }
  try { return { session: readSaved(ctx.storage) }; }
  catch { return { error: '无法读取 Egern 本地登录，请检查脚本存储或手动填写 ACCESS 和 BODY。' }; }
}

function notify(ctx, body) {
  try { ctx.notify?.({ title: '中国广电', body, sound: false }); } catch { /* Notification failure must not alter the request. */ }
}
async function captureSession(ctx) {
  const request = ctx.request;
  // Restrict to the known endpoint without relying on an undocumented URL global.
  if (request.method?.toUpperCase() !== 'POST' || typeof request.url !== 'string' || /[\s#]/.test(request.url) || !(request.url === ENDPOINT || request.url.startsWith(`${ENDPOINT}?`))) return;
  let raw;
  try { raw = await request.text(); }
  catch { notify(ctx, '未能读取请求体，原有登录未替换。请确认获取脚本已开启请求体读取。'); return; }
  // text() consumes the body. Always restore the exact string, including on failures.
  const passthrough = { body: raw };
  try {
    const headers = request.headers;
    const access = typeof headers?.get === 'function' ? headers.get('access') : Object.entries(headers || {}).find(([name]) => name.toLowerCase() === 'access')?.[1];
    const data = JSON.parse(raw).data;
    if (!validAccess(access) || !validData(data)) {
      notify(ctx, '请求缺少有效的 access 或 data，原有登录未替换。请登录营业厅后刷新。');
      return passthrough;
    }
    const previous = readSaved(ctx.storage);
    if (previous?.access !== access || previous?.data !== data) {
      ctx.storage.set(STORAGE_KEY, JSON.stringify({ access, data, capturedAt: new Date().toISOString() }));
      notify(ctx, '登录参数已保存在 Egern。请运行小组件确认，然后关闭“中国广电登录获取”模块。');
    }
  } catch {
    notify(ctx, '登录参数未保存，原有登录未替换。请检查请求格式和 Egern 脚本存储。');
  }
  return passthrough;
}

function number(value, negative = false) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && Math.abs(parsed) <= Number.MAX_SAFE_INTEGER && (negative || parsed >= 0) ? parsed : null;
}
function fraction(remaining, total) {
  return remaining !== null && total !== null && total > 0 && remaining <= total ? remaining / total : null;
}
function parsePayload(payload) {
  if (payload?.status !== '000000') return { state: 'failed', message: '登录已失效或接口异常，请在营业厅重新登录并获取参数。' };
  const raw = payload.data?.userData;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { state: 'failed', message: '接口未返回账户数据，请稍后重试。' };
  const fee = number(raw.fee, true), flow = number(raw.flow), flowAll = number(raw.flowAll), voice = number(raw.voice), voiceAll = number(raw.voiceAll);
  const metrics = {
    fee: { title: '话费余额', value: fee === null ? null : fee / 100, unit: '元', icon: 'yensign.circle.fill' },
    flow: { title: '剩余流量', value: flow === null ? null : flow / 1048576, unit: 'GB', fraction: fraction(flow, flowAll), icon: 'antenna.radiowaves.left.and.right' },
    voice: { title: '剩余语音', value: voice, unit: '分钟', fraction: fraction(voice, voiceAll), icon: 'phone.fill' },
  };
  if (Object.values(metrics).every(m => m.value === null)) return { state: 'failed', message: '接口没有有效余额数据，请检查登录或稍后重试。' };
  return { state: 'ready', metrics, incomplete: Object.values(metrics).some(m => m.value === null) };
}
async function loadReport(ctx, config = readConfig(ctx.env)) {
  const result = data => ({ ...data, config, updatedAt: new Date().toISOString() });
  if (config.clear) {
    try {
      ctx.storage.delete(STORAGE_KEY);
      return result({ state: 'cleared', message: '本组件本地登录已清除。手动填写过的 ACCESS / BODY 请自行清空，再将“登录操作”改回正常显示。' });
    } catch { return result({ state: 'failed', message: '清除失败，请检查 Egern 脚本存储。' }); }
  }
  const auth = resolveSession(ctx);
  if (auth.error) return result({ state: 'unconfigured', message: auth.error });
  if (!auth.session) return result({ state: 'unconfigured', message: '启用登录获取模块，在广电营业厅小程序登录并刷新；也可在 Egern 手动填写 ACCESS 和 BODY。' });
  try {
    const response = await ctx.http.post(ENDPOINT, {
      headers: { access: auth.session.access, 'content-type': 'application/json' },
      body: JSON.stringify({ data: auth.session.data }),
      timeout: 10000, policy: 'DIRECT', credentials: 'omit', redirect: 'error',
    });
    if (response.status === 401 || response.status === 403) return result({ state: 'failed', message: '登录失效或访问受限，请在营业厅重新登录并获取参数。' });
    if (response.status !== 200) return result({ state: 'failed', message: `查询失败（HTTP ${Number.isInteger(response.status) ? response.status : '异常'}），请稍后重试。` });
    let payload;
    try { payload = await response.json(); } catch { return result({ state: 'failed', message: '接口返回格式异常，请稍后重试。' }); }
    return result(parsePayload(payload));
  } catch {
    return result({ state: 'failed', message: '网络请求失败或超时，请检查 Egern 连接后重试。' });
  }
}

function text(value, size = 11, color = COLORS.text, extra = {}) {
  return { type: 'text', text: String(value), font: { size }, textColor: color, maxLines: 1, minScale: 0.7, ...extra };
}
function stack(children, extra = {}) { return { type: 'stack', direction: 'column', alignItems: 'start', gap: 3, children, ...extra }; }
function row(children, extra = {}) { return stack(children, { direction: 'row', alignItems: 'center', ...extra }); }
const spacer = () => ({ type: 'spacer' });
function icon(name, color, size = 12) { return { type: 'image', src: `sf-symbol:${name}`, width: size, height: size, color }; }
function tint(color) {
  if (typeof color === 'string') return { light: `${color}12`, dark: `${color}20` };
  return { light: `${color.light}12`, dark: `${color.dark}18` };
}
function valueText(metric) {
  if (metric.value === null) return '—';
  if (metric.unit === '元' || metric.unit === 'GB') return metric.value.toFixed(2);
  return String(Math.round(metric.value * 100) / 100);
}
function ring(metric, color, size) {
  const stroke = typeof color === 'string' ? color : color.light;
  const pct = metric.fraction === null ? null : Math.max(0, Math.min(100, metric.fraction * 100));
  const progress = pct === null ? '' : `<circle cx='30' cy='30' r='24' fill='none' stroke='${stroke}' stroke-width='5' pathLength='100' stroke-dasharray='${pct.toFixed(3)} 100' transform='rotate(-90 30 30)'/>`;
  const label = pct === null ? '—' : `${Math.round(pct)}%`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'><circle cx='30' cy='30' r='24' fill='none' stroke='${stroke}' stroke-opacity='.15' stroke-width='5'/>${progress}<text x='30' y='34' text-anchor='middle' font-family='Arial,sans-serif' font-size='12' font-weight='600' fill='${stroke}'>${label}</text></svg>`;
  return { type: 'image', src: `data:image/svg+xml,${encodeURIComponent(svg)}`, width: size, height: size };
}
function metricValue(metric, color, size) {
  return row([text(valueText(metric), size, color, { font: { size, weight: 'semibold' }, minScale: 0.5 }), text(metric.unit, 9, color)], { height: size + 3, gap: 3 });
}
function footer(report, small) {
  return row([
    { type: 'date', date: report.updatedAt, format: 'time', font: { size: 8 }, textColor: COLORS.muted },
    ...(small ? [] : [text(report.state === 'ready' ? report.incomplete ? '部分缺失' : '更新' : '尝试', 8, COLORS.muted)]), spacer(),
    text(small ? '脑瓜原作' : `脑瓜原作 · Egern v${VERSION}`, 8, COLORS.muted),
  ], { height: 11, gap: 3 });
}
function smallLine(metric, color, style) {
  const content = style === '图标卡片'
    ? [stack([icon(metric.icon, color, 16)], { width: 23, height: 24, padding: [4, 3], backgroundColor: tint(color), borderRadius: 7 }), stack([text(metric.title, 8, COLORS.muted), metricValue(metric, color, 14)], { flex: 1, gap: 0 })]
    : [stack([text(metric.title, 8, color), metricValue(metric, color, 14)], { flex: 1, gap: 0 }), icon(metric.icon, color, 15)];
  return row(content, { height: 30, padding: [2, 6], gap: 5, backgroundColor: style === '彩色条目' ? tint(color) : undefined, borderRadius: 8 });
}
function smallQuotas(metrics, colors, size = 43) {
  return row(['flow', 'voice'].map(key => stack([
    ring(metrics[key], colors[key], size),
    text(`${valueText(metrics[key])} ${metrics[key].unit}`, 10, colors[key], { font: { size: 10, weight: 'semibold' }, minScale: 0.5 }),
    text(metrics[key].title, 8, COLORS.muted),
  ], { flex: 1, height: size + 26, alignItems: 'center', gap: 2 })), { height: size + 26, gap: 6 });
}
function renderSmall(report) {
  const { metrics: m, config: { style, colors } } = report;
  if (style === '彩色条目' || style === '图标卡片') return [stack(['fee', 'flow', 'voice'].map(k => smallLine(m[k], colors[k], style)), { height: 98, gap: 4 })];
  if (style === '双环仪表' || style === '经典圆环') {
    const fee = style === '双环仪表'
      ? metricValue(m.fee, colors.fee, 20)
      : row([spacer(), metricValue(m.fee, colors.fee, 22), spacer()], { height: 25 });
    return [stack([fee, smallQuotas(m, colors, style === '双环仪表' ? 43 : 40)], { height: 100, gap: 5 })];
  }
  const line = key => row([text(m[key].title, 9, colors[key]), spacer(), text(`${valueText(m[key])} ${m[key].unit}`, 11, COLORS.text, { minScale: 0.5 })], { height: 23 });
  const quota = stack([line('flow'), line('voice')], { height: 52, gap: 3, padding: style === '余额清单' ? [2, 5] : 0, backgroundColor: style === '余额清单' ? tint(colors.fee) : undefined, borderRadius: 8 });
  return [stack([text(m.fee.title, 9, COLORS.muted), metricValue(m.fee, colors.fee, 22), quota], { height: 100, gap: 4 })];
}
function metricCard(key, report, large = false) {
  const metric = report.metrics[key], color = report.config.colors[key];
  return stack([
    key === 'fee' ? row([spacer(), icon(metric.icon, color, 31), spacer()], { height: 42 }) : row([spacer(), ring(metric, color, large ? 62 : 42), spacer()], { height: large ? 62 : 42 }),
    row([spacer(), metricValue(metric, color, large ? 22 : 17), spacer()], { height: large ? 25 : 20 }),
    text(metric.title, large ? 11 : 9, COLORS.muted, { textAlign: 'center' }),
    ...(large ? [text(metric.fraction === null ? '剩余比例未知' : `剩余 ${Math.round(metric.fraction * 100)}%`, 10, color, { textAlign: 'center' })] : []),
  ], { flex: 1, height: large ? 135 : 92, gap: 3, padding: [6, 4], backgroundColor: tint(color), borderRadius: 12, alignItems: 'center' });
}
function renderWidget(report, family = 'systemMedium') {
  const { config } = report;
  const small = family === 'systemSmall';
  const large = family === 'systemLarge' || family === 'systemExtraLarge';
  const accessory = String(family).startsWith('accessory');
  const widget = { type: 'widget', padding: accessory ? 0 : large ? 14 : 10, gap: small ? 3 : 4, backgroundColor: COLORS.background, refreshAfter: new Date(Date.parse(report.updatedAt) + config.refreshMinutes * 60000).toISOString(), children: [] };
  if (accessory) {
    const content = report.state === 'ready' ? `${valueText(report.metrics.fee)}元 ${valueText(report.metrics.flow)}GB` : report.state === 'unconfigured' ? '广电：请获取登录' : '广电：请打开检查';
    widget.children = [text(content, 12, COLORS.text, { maxLines: family === 'accessoryInline' ? 1 : 3 })];
    return widget;
  }
  widget.children.push(row([icon('antenna.radiowaves.left.and.right', config.colors.fee, 12), text('中国广电', 11, COLORS.text, { font: { size: 11, weight: 'semibold' } }), ...(!small ? [spacer(), text(config.name, 9, COLORS.muted, { flex: 1, textAlign: 'right' })] : [])], { height: 16, gap: 4 }));
  if (report.state !== 'ready') {
    const title = report.state === 'unconfigured' ? '请先获取登录' : report.state === 'cleared' ? '登录已清除' : '账户查询失败';
    widget.children.push(text(title, 15, config.colors.fee, { maxLines: 2 }), text(report.message, 10, COLORS.muted, { maxLines: small ? 5 : 4 }), spacer(), footer(report, small));
    return widget;
  }
  if (small) widget.children.push(...renderSmall(report));
  else if (large) {
    widget.children.push(stack([text(report.metrics.fee.title, 11, COLORS.muted), metricValue(report.metrics.fee, config.colors.fee, 34)], { height: 71, gap: 4, padding: [8, 10], backgroundColor: tint(config.colors.fee), borderRadius: 12 }));
    widget.children.push(row(['flow', 'voice'].map(k => metricCard(k, report, true)), { height: 135, gap: 10 }));
    widget.children.push(text('圆环表示流量、语音的剩余比例', 10, COLORS.muted));
  } else widget.children.push(row(['fee', 'flow', 'voice'].map(k => metricCard(k, report)), { height: 92, gap: 8 }));
  if (report.incomplete && large) widget.children.push(text('部分数据未返回，以 — 显示', 8, COLORS.muted));
  widget.children.push(spacer(), footer(report, small));
  return widget;
}

export { VERSION, ENDPOINT, STORAGE_KEY, STYLES, readConfig, captureSession, parsePayload, loadReport, renderWidget };
