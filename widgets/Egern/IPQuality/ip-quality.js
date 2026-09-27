/**
 * Egern 节点检测小组件 v1.0.0
 * 按 POLICY 指定策略探测当前出口；不修改策略、不读取账号 Cookie、不缓存旧结论。
 * Media probe approach adapted from MaYIHEI/paperclip (MIT); see NOTICE.
 * References in upstream: Roddy-D/Loon_plugins and xykt/IPQuality.
 */

const VERSION = '1.0.0';
const ENDPOINTS = {
  ippure: 'https://my.ippure.com/v1/info',
  ipapi: 'https://api.ipapi.is/',
  ipify: 'https://api4.ipify.org?format=json',
};
const MEDIA = ['ChatGPT Web', 'Netflix', 'YouTube', 'TikTok', 'Prime Video', 'Reddit'];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const COLORS = {
  background: { light: '#FFFFFF', dark: '#17212B' },
  text: { light: '#152E40', dark: '#F1F6FA' },
  muted: { light: '#546776', dark: '#B0C0CF' },
  accent: { light: '#096D9C', dark: '#72C7EC' },
  warning: { light: '#986000', dark: '#FFCF7A' },
  error: { light: '#B32835', dark: '#FF9AA5' },
};

export default async function main(ctx) {
  const config = readConfig(ctx.env);
  if (!config.policy.trim()) {
    return renderWidget({ state: 'unconfigured', config, updatedAt: new Date().toISOString() }, ctx.widgetFamily);
  }
  try {
    return renderWidget(await collectReport(ctx, config), ctx.widgetFamily);
  } catch (_) {
    // Never expose request exceptions: they can include credentials or unmasked IPs.
    return renderWidget({ state: 'failed', config, updatedAt: new Date().toISOString() }, ctx.widgetFamily);
  }
}

function readConfig(env = {}) {
  const refresh = Number(env.REFRESH_MINUTES);
  return {
    // Preserve exact names, including emoji and spaces; never silently fall back to DIRECT.
    policy: typeof env.POLICY === 'string' ? env.POLICY : '',
    media: String(env.MEDIA_TEST ?? 'true').toLowerCase() !== 'false',
    mask: String(env.MASK_IP ?? 'false').toLowerCase() === 'true',
    refreshMinutes: Number.isFinite(refresh) && refresh > 0 ? Math.min(1440, Math.max(15, refresh)) : 60,
    apiKey: typeof env.IPAPI_KEY === 'string' ? env.IPAPI_KEY.trim() : '',
  };
}

function createClient(ctx, config) {
  const deadline = Date.now() + 24000;
  let active = 0;
  const queue = [];
  function drain() {
    while (active < 4 && queue.length) {
      const { run, resolve, reject } = queue.shift();
      active++;
      Promise.resolve().then(run).then(resolve, reject).finally(() => { active--; drain(); });
    }
  }
  function request(url, body) {
    return new Promise((resolve, reject) => {
      queue.push({ resolve, reject, run: async () => {
        const remaining = deadline - Date.now();
        if (remaining < 300) throw new Error('检测超时');
        const options = {
          policy: config.policy,
          timeout: Math.min(6000, remaining),
          credentials: 'omit',
          redirect: 'follow',
          headers: { 'User-Agent': UA, Accept: '*/*', 'Cache-Control': 'no-cache' },
        };
        if (body !== undefined) {
          options.body = body;
          options.headers['Content-Type'] = 'application/json';
          // A keyed request must not redirect its body to another origin.
          options.redirect = 'error';
        }
        let response;
        try {
          response = body === undefined ? await ctx.http.get(url, options) : await ctx.http.post(url, options);
        } catch (_) { throw new Error('请求失败/超时'); }
        const status = Number(response.status);
        let text;
        try { text = await response.text(); } catch (_) { throw new Error('响应读取失败'); }
        return { status, body: String(text).slice(0, 2 * 1024 * 1024) };
      } });
      drain();
    });
  }
  return {
    request,
    async json(url, body) {
      const response = await request(url, body);
      if (!ok(response)) throw new Error(`HTTP ${response.status || '?'}`);
      let payload;
      try { payload = JSON.parse(response.body); } catch (_) { throw new Error('响应不是 JSON'); }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.error || payload.success === false) {
        throw new Error('接口未返回有效数据');
      }
      if (!normalizeIP(payload.ip)) throw new Error('未返回有效出口 IP');
      return payload;
    },
  };
}

async function capture(promise) {
  try { return { ok: true, value: await promise }; }
  catch (error) { return { ok: false, error: error.message }; }
}

async function collectReport(ctx, config = readConfig(ctx.env)) {
  if (!config.policy.trim()) throw new Error('未设置策略组');
  const client = createClient(ctx, config);
  const results = await Promise.all([
    capture(client.json(ENDPOINTS.ippure)),
    capture(client.json(ENDPOINTS.ipapi, config.apiKey ? { key: config.apiKey } : undefined)),
    capture(client.json(ENDPOINTS.ipify)),
  ]);
  const sources = ['IPPure', 'ipapi', 'ipify'].map((name, i) => ({ name, ...results[i] }));
  const observations = sources.filter(s => s.ok).map(s => ({ source: s.name, ip: normalizeIP(s.value.ip) }));
  const report = {
    version: VERSION, config, state: 'ready', sources, observations,
    ip: observations[0]?.ip || '', media: [], warnings: [],
    updatedAt: new Date().toISOString(),
  };
  if (!report.ip) return { ...report, state: 'failed' };
  const pure = results[0].ok && normalizeIP(results[0].value.ip) === report.ip ? results[0].value : null;
  const ipapi = results[1].ok && normalizeIP(results[1].value.ip) === report.ip ? results[1].value : null;
  report.profile = profileFor(pure, ipapi);
  report.risk = parseRisk(pure, ipapi, report.ip);
  report.inconsistent = new Set(observations.map(o => o.ip)).size > 1;
  if (report.inconsistent) {
    report.state = 'inconsistent';
    report.risk = { score: null, abuse: null, type: '未知', native: '未知' };
    report.warnings.push('检测到多个出口；风险未合并，媒体未检测');
  } else {
    if (sources.some(s => !s.ok)) report.warnings.push('部分来源失败，未返回的数据标为未知');
    if (config.media) {
      report.media = await collectMedia(client);
      const finalProbe = await capture(client.json(ENDPOINTS.ipify));
      if (finalProbe.ok && normalizeIP(finalProbe.value.ip) !== report.ip) {
        report.state = 'inconsistent';
        report.inconsistent = true;
        report.observations.push({ source: 'ipify 复核', ip: normalizeIP(finalProbe.value.ip) });
        report.risk = { score: null, abuse: null, type: '未知', native: '未知' };
        report.media = report.media.map(m => ({ ...m, state: 'unknown', label: '出口变化', region: '' }));
        report.warnings.push('检测期间出口发生变化，请重试');
      } else if (!finalProbe.ok) {
        report.warnings.push('出口复核失败，媒体结果仅代表策略组页面探测');
      }
    }
  }
  report.updatedAt = new Date().toISOString();
  return report;
}

function profileFor(pure, ipapi) {
  if (pure) return {
    source: 'IPPure',
    country: clean(pure.countryCode) || clean(pure.country), city: clean(pure.city),
    asn: formatASN(pure.asn), organization: clean(pure.asOrganization),
  };
  if (ipapi) {
    const full = ipapi.location && typeof ipapi.location === 'object';
    return {
      source: 'ipapi',
      country: full ? clean(ipapi.location.country_code) || clean(ipapi.location.country) : clean(ipapi.country),
      city: full ? clean(ipapi.location.city) : clean(ipapi.city),
      asn: typeof ipapi.asn === 'object' ? formatASN(ipapi.asn?.asn) : clean(ipapi.asn),
      organization: typeof ipapi.asn === 'object' ? clean(ipapi.asn?.org) : clean(ipapi.company),
    };
  }
  return { source: 'ipify', country: '', city: '', asn: '', organization: '' };
}

function parseRisk(pure, ipapi, ip) {
  // IPPure explicitly does not score IPv6; numeric zero there is not "zero risk".
  const score = ip.includes(':') ? null : finite(pure?.fraudScore, 0, 100);
  const abuseText = typeof ipapi?.company === 'object' ? clean(ipapi.company?.abuser_score) : '';
  const match = abuseText.match(/^([0-9]+(?:\.[0-9]+)?)\s*\(([^)]+)\)$/);
  const ratio = match ? finite(match[1], 0, 1) : null;
  let type = '未知';
  if (pure?.isResidential === true) type = '住宅';
  else if (pure?.isResidential === false) type = '非住宅';
  if (ipapi?.is_datacenter === true) type = '机房';
  else if (ipapi?.is_mobile === true) type = '移动网络';
  const native = pure?.isBroadcast === true ? '广播 IP' : pure?.isBroadcast === false ? '原生 IP' : '未知';
  return { score, abuse: ratio === null ? null : `${Number((ratio * 100).toFixed(2))}%`, type, native };
}

function ok(response) { return response && response.status >= 200 && response.status < 300; }
function challenge(body) { return /just a moment|cf-chl-|challenge-platform|captcha|verify (?:that )?you are human|unusual traffic|access denied|you have been blocked/i.test(body); }
function clean(value) { return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''; }
function finite(value, min, max) {
  if ((typeof value !== 'number' && typeof value !== 'string') || clean(value) === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function formatASN(value) { return /^(?:AS)?\d+$/i.test(clean(value)) ? `AS${clean(value).replace(/^AS/i, '')}` : ''; }
function normalizeIP(value) {
  let text = clean(value);
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(text)) {
    const parts = text.split('.');
    return parts.every(p => Number(p) <= 255 && String(Number(p)) === p) ? text : '';
  }
  if (!text.includes(':') || !/^[0-9a-f:.]+$/i.test(text)) return '';
  // Pure JS: do not require an undocumented URL global in Egern's runtime.
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':');
    const tail = normalizeIP(text.slice(lastColon + 1));
    if (!tail || tail.includes(':')) return '';
    const p = tail.split('.').map(Number);
    text = text.slice(0, lastColon + 1) + ((p[0] << 8) + p[1]).toString(16) + ':' + ((p[2] << 8) + p[3]).toString(16);
  }
  const halves = text.split('::');
  if (halves.length > 2) return '';
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  if ([...left, ...right].some(p => !/^[0-9a-f]{1,4}$/i.test(p))) return '';
  const count = left.length + right.length;
  if (halves.length === 1 ? count !== 8 : count >= 8) return '';
  const parts = [...left, ...Array(8 - count).fill('0'), ...right].map(p => parseInt(p, 16).toString(16));
  let best = -1, length = 1;
  for (let i = 0; i < 8;) {
    if (parts[i] !== '0') { i++; continue; }
    const start = i;
    while (i < 8 && parts[i] === '0') i++;
    if (i - start > length) { best = start; length = i - start; }
  }
  return best < 0 ? parts.join(':') : `${parts.slice(0, best).join(':')}::${parts.slice(best + length).join(':')}`;
}
function displayIP(ip, mask) {
  if (!ip) return '未获取出口';
  if (!mask) return ip;
  return ip.includes(':') ? `${ip.split(':').filter(Boolean).slice(0, 2).join(':')}:*` : `${ip.split('.').slice(0, 2).join('.')}.*.*`;
}
function regionOf(body, patterns) {
  for (const pattern of patterns) {
    const value = body.match(pattern)?.[1];
    if (value) return value.toUpperCase();
  }
  return '';
}
function mediaResult(name, state = 'unknown', label = '未知', region = '') { return { name, state, label, region }; }

function parseMedia(name, responses) {
  const valid = responses.filter(Boolean);
  if (valid.some(r => challenge(r.body))) return mediaResult(name, 'unknown', '反爬/未知');
  if (name === 'ChatGPT Web') {
    const [web, trace] = responses;
    const region = ok(trace) ? regionOf(trace.body, [/^loc=([A-Z]{2})\s*$/im]) : '';
    if (web && /unsupported_country(?:_region_territory)?/i.test(web.body)) return mediaResult(name, 'restricted', '地区受限', region);
    if (ok(web)) {
      try {
        const data = JSON.parse(web.body);
        if (typeof data.cookie_consent_required === 'boolean') return mediaResult(name, 'reachable', '端点可达', region);
      } catch (_) { /* Unknown JSON/HTML is not a successful service check. */ }
    }
    return mediaResult(name, 'unknown', '未知', region);
  }
  if (valid.length !== responses.length || !valid.length) return mediaResult(name, 'unknown', '请求失败');
  if (valid.some(r => !ok(r))) return mediaResult(name, 'unknown', `HTTP ${valid.find(r => !ok(r)).status}`);
  const body = valid.map(r => r.body).join('\n');
  if (name === 'Netflix') {
    const region = regionOf(body, [/"countryCode"\s*:\s*"([A-Z]{2})"/i]);
    if (valid.every(r => /Oh no!|NSEZ-404/i.test(r.body))) return mediaResult(name, 'restricted', '片目受限', region);
    if (valid.every(r => /Netflix/i.test(r.body) && /og:title|"titleId"|"videoId"/i.test(r.body))) return mediaResult(name, 'reachable', '页面可达', region);
  } else if (name === 'YouTube') {
    const region = regionOf(body, [/"contentRegion"\s*:\s*"([A-Z]{2})"/i]);
    if (/Premium is not available in your country/i.test(body)) return mediaResult(name, 'restricted', 'Premium受限', region);
    if (region && /YouTube Premium/i.test(body)) return mediaResult(name, 'reachable', '页面可达', region);
  } else if (name === 'TikTok') {
    const region = regionOf(body, [/"region"\s*:\s*"([A-Z]{2})"/i, /"storeCountry"\s*:\s*"([A-Z]{2})"/i]);
    if (/not available in your (?:country|region)/i.test(body)) return mediaResult(name, 'restricted', '地区受限', region);
    if (region && /tiktok/i.test(body)) return mediaResult(name, 'reachable', '地区可识别', region);
  } else if (name === 'Prime Video') {
    const region = regionOf(body, [/"currentTerritory"\s*:\s*"([A-Z]{2})"/i, /currentTerritory\\?"\s*:\s*\\?"([A-Z]{2})/i]);
    if (/not available in your location/i.test(body)) return mediaResult(name, 'restricted', '地区受限', region);
    if (region) return mediaResult(name, 'reachable', '地区可识别', region);
  } else if (name === 'Reddit' && /reddit/i.test(body)) {
    return mediaResult(name, 'reachable', '页面可达');
  }
  return mediaResult(name);
}

async function collectMedia(client) {
  const targets = [
    ['https://api.openai.com/compliance/cookie_requirements', 'https://chatgpt.com/cdn-cgi/trace'],
    ['https://www.netflix.com/title/81280792', 'https://www.netflix.com/title/70143836'],
    ['https://www.youtube.com/premium'],
    ['https://www.tiktok.com/'],
    ['https://www.primevideo.com/'],
    ['https://www.reddit.com/'],
  ];
  return Promise.all(MEDIA.map(async (name, i) => {
    const results = await Promise.all(targets[i].map(url => capture(client.request(url))));
    return parseMedia(name, results.map(r => r.ok ? r.value : null));
  }));
}

function text(value, size = 12, color = 'text', extra = {}) {
  return { type: 'text', text: String(value), font: { size }, textColor: COLORS[color], maxLines: 1, minScale: 0.7, ...extra };
}
function stack(children, direction = 'column', extra = {}) {
  return { type: 'stack', direction, alignItems: direction === 'row' ? 'center' : 'start', gap: 4, children, ...extra };
}
function row(children, extra = {}) { return stack(children, 'row', extra); }
function footer(report, short = false) {
  return row([
    text(short ? '检测于' : '本次检测', 10, 'muted'),
    { type: 'date', date: report.updatedAt, format: 'time', font: { size: 10 }, textColor: COLORS.muted },
    { type: 'spacer' },
    ...(!short ? [text(`v${VERSION}`, 9, 'muted')] : []),
  ]);
}
function mediaLine(m, compact = false) {
  return row([
    text(m.name === 'ChatGPT Web' && compact ? 'ChatGPT' : m.name, compact ? 10 : 12, 'text', { flex: 1 }),
    text([m.label, m.region].filter(Boolean).join(' '), compact ? 10 : 12,
      m.state === 'reachable' ? 'accent' : m.state === 'restricted' ? 'warning' : 'muted', { flex: 1, textAlign: 'right' }),
  ]);
}
function statusText(report) {
  if (report.state === 'inconsistent') return '出口不一致，请重试';
  if (report.warnings?.length) return report.warnings[report.warnings.length - 1];
  if (!report.config.media) return '媒体检测已关闭';
  return '页面探测不代表实际解锁';
}
function renderWidget(report, family = 'systemMedium') {
  const config = report.config;
  const small = family === 'systemSmall';
  const accessory = String(family).startsWith('accessory');
  const large = family === 'systemLarge' || family === 'systemExtraLarge';
  const widget = {
    type: 'widget', padding: accessory ? 0 : large ? 14 : 12, gap: accessory ? 2 : 4,
    backgroundColor: COLORS.background,
    refreshAfter: new Date(Date.parse(report.updatedAt) + config.refreshMinutes * 60000).toISOString(),
    children: [],
  };
  const problem = report.state === 'unconfigured' ? '请设置检测策略组' : report.state === 'failed' ? '出口检测失败' : '';
  if (problem) {
    widget.children = [text(problem, accessory ? 12 : 15, report.state === 'failed' ? 'error' : 'accent', { maxLines: 2 })];
    if (!accessory) {
      widget.children.push(text(report.state === 'unconfigured' ? '工具 → 模块 → 本模块\n填写“检测策略组”' : '检查 Egern 连接、策略组名称及接口状态', 12, 'muted', { maxLines: 3 }));
      if (config.policy) widget.children.push(text(config.policy, 12));
      widget.children.push({ type: 'spacer' }, footer(report, small));
    }
    return widget;
  }
  const ip = displayIP(report.ip, config.mask);
  const profile = report.profile || {};
  const risk = report.risk || {};
  const score = risk.score === null || risk.score === undefined ? '未知' : `${risk.score}/100`;
  const location = [profile.country, profile.city].filter(Boolean).join(' ') || '地区未知';
  const warning = report.state === 'inconsistent';
  if (accessory) {
    const label = warning ? '出口不一致' : `IPPure ${score}`;
    widget.children = family === 'accessoryInline'
      ? [text(`${config.policy} ${label}`, 12)]
      : [text(family === 'accessoryCircular' ? 'IPPure' : config.policy, 11), text(warning ? '出口变化' : score, 14), ...(family === 'accessoryRectangular' ? [text(ip, 11)] : [])];
    return widget;
  }
  widget.children.push(row([
    { type: 'image', src: 'sf-symbol:network', width: 14, height: 14, color: COLORS.accent },
    text('节点检测', 12, 'accent', { font: { size: 12, weight: 'semibold' } }),
    ...(!small ? [text(config.policy, 12, 'muted', { flex: 1, textAlign: 'right' })] : []),
  ]));
  if (small) {
    widget.children.push(text(config.policy, 12), text(ip, 17, 'text', { font: { size: 17, weight: 'semibold', family: 'Menlo' }, minScale: 0.5 }));
    widget.children.push(text(location, 11, 'muted'), text(warning ? '出口不一致' : `IPPure ${score}`, 14, warning ? 'warning' : 'accent'));
    const summary = warning ? '请重试' : config.media
      ? `页面可达 ${report.media.filter(m => m.state === 'reachable').length}/${report.media.length} · 非解锁结论`
      : `${risk.type || '未知'} · 媒体关闭`;
    widget.children.push(text(report.warnings?.length && !warning ? '部分数据缺失/待复核' : summary, 10, 'muted'), { type: 'spacer' }, footer(report, true));
  } else if (large) {
    widget.children.push(text(ip, 23, 'text', { font: { size: 23, weight: 'semibold', family: 'Menlo' }, minScale: 0.5 }));
    widget.children.push(text(location, 13), text([profile.asn, profile.organization].filter(Boolean).join(' ') || 'ASN / 机构未知', 11, 'muted'));
    widget.children.push(row([text(`IPPure ${score}`, 17, warning ? 'warning' : 'accent', { flex: 1 }), text(`${risk.type} / ${risk.native}`, 11, 'muted', { flex: 1, textAlign: 'right' })]));
    widget.children.push(text(`ipapi 网络滥用比例：${risk.abuse ?? '未知'}　基础来源：${profile.source}`, 10, 'muted'));
    if (report.media.length) {
      widget.children.push(text('媒体与 AI · 页面探测', 12, 'accent'));
      widget.children.push(stack(report.media.map(m => mediaLine(m)), 'column', { gap: 2 }));
    }
    widget.children.push(text(statusText(report), 11, report.warnings.length ? 'warning' : 'muted', { maxLines: 2 }));
    if (warning) widget.children.push(text(report.observations.map(o => `${o.source} ${displayIP(o.ip, config.mask)}`).join('\n'), 10, 'muted', { maxLines: 4 }));
    else widget.children.push(text(report.sources.map(s => `${s.name} ${s.ok ? '已返回' : s.error}`).join(' / '), 10, 'muted', { maxLines: 2 }));
    widget.children.push({ type: 'spacer' }, footer(report));
  } else {
    const base = stack([
      text(ip, 17, 'text', { font: { size: 17, weight: 'semibold', family: 'Menlo' }, minScale: 0.5 }),
      text(location, 11, 'muted'),
      text(profile.asn || 'ASN 未知', 11, 'muted'),
      text(warning ? '出口不一致' : `IPPure ${score}`, 14, warning ? 'warning' : 'accent'),
      text(`${risk.type} / ${risk.native}`, 10, 'muted'),
    ], 'column', { flex: 1, gap: 2 });
    const media = stack(report.media.length ? report.media.map(m => mediaLine(m, true)) : [
      text(warning ? '多个出口，未执行媒体检测' : '媒体检测已关闭', 12, 'muted', { maxLines: 3 }),
    ], 'column', { flex: 1, gap: 2 });
    widget.children.push(row([base, media], { gap: 14, alignItems: 'start' }));
    widget.children.push(text(statusText(report), 10, report.warnings.length ? 'warning' : 'muted'), { type: 'spacer' }, footer(report));
  }
  return widget;
}

export { VERSION, ENDPOINTS, MEDIA, readConfig, collectReport, normalizeIP, parseRisk, parseMedia, profileFor, renderWidget };
