# 中国广电 Egern 适配记录

## Research（2026-09-27）

- 原作：脑瓜 / anker1209，`ChinaBroadnet_2024.js` v1.2.2；核对提交 `469a34dd4d46bc8ce0a9efbba8efe9081494611a`。原脚本通过 `POST https://wx.10099.com.cn/contact-web/api/busi/qryUserInfo`，以 `access` 请求头和 JSON `{data: ...}` 查询 `data.userData`。
- 原作换算：`fee / 100` 元、`flow / 1048576` GB、`voice` 分钟；剩余占比分别是 `flow / flowAll`、`voice / voiceAll`。这属于原脚本接口约定，不是运营商公开 API 合同，真实账号仍需实机核对。
- 登录获取参考：wuhuhuuuu/study，现跳转至 livinmoon/study；核对 `ChinaBroadnet.cookie.js` 提交 `ae52122a84208e9e8e0f0e18539a51c72e3e4e4c`。只需要 access 和 data，不依赖原 BoxJs 键名或 DmYY。用户提供的旧 BoxJs 订阅路径当前返回 404，不影响本次原生实现。
- Egern 官方文档确认：native `export default async function(ctx)`、`http_request` / `generic`、`body_required`、`ctx.request.text()`、`ctx.storage.get/set/delete`、`ctx.http.post`、Widget DSL、模块 `env_schema`。请求体只能读取一次，获取脚本读完后必须返回原始 body，保持上游请求内容。
- 官方存储文档没有说明所有版本的跨脚本命名空间行为。本实现以同一 JS URL 和同一存储键读写，另提供完整手动参数入口；捕获脚本与小组件在 2.21.0 (788) 上共享存储仍需实机确认。
- 原作脚本头要求修改套用注明来源。用户提供的发布声明另要求仅学习研究、非商业使用。保留两类来源及这份声明，不将上游重新标注为 MIT，也不复制 DmYY / Env 运行库。

## Plan / Task Definition

1. 新写无运行时依赖的原生 JS，统一登录获取和小组件入口；只向原作的固定 HTTPS 查询地址发送凭据。
2. 显示模块不含 MITM；获取模块仅声明 `wx.10099.com.cn`，仅处理原查询路径的 POST。读取后原样传递请求体，凭据成对保存在 Egern 本地；通知不包含凭据。
3. 在 Egern 设置账号备注、六种小尺寸样式、三项配色、刷新间隔、手动 ACCESS/BODY 和清除本组件本地登录。中尺寸沿用三项余额分区，另适配画廊大尺寸。
4. 使用合成凭据和响应验证获取→保存→查询→渲染、异常、未知/零值、原样透传、来源声明和模块引用；预览浅色与深色。完成后通过 Git 发布至已授权的 YUDIDIFEI/Scripts。

## Design

- 色彩：背景 `#FFFFFF / #171A21`，正文 `#243449 / #F0F4FA`，次文字 `#687687 / #A7B1C0`；话费蓝 `#2F74A4 / #86B5DF`、流量绿 `#158558 / #6AD3A2`、语音橙 `#BE624C / #F6A68E`。用户可覆盖三项强调色。
- 字体：系统字体，余额数字加粗；单位与时间降一级。指标左对齐，圆环居中。日期使用原生 date。
- 结构：小尺寸 `[中国广电] → [话费 / 流量 / 语音] → [时间 / 脑瓜原作]`；中尺寸 `[标题 / 备注] → [话费 | 流量 | 语音] → [时间 / 原作署名]`；大尺寸话费置顶，下方流量/语音并排。
- 样式适配原作的六类小尺寸布局；数值始终同时标注单位，不用颜色代替含义。圆环表示剩余比例；总量缺失时不画虚假的满环或零环。控件与卡片明确高度，避免上个组件出现的大段弹性留白。
- 设计复核：三种语义色和额度圆环来自运营商用量场景及原作视觉方向。没有独立网页、外部图片或无关装饰，不照搬 Scriptable 的设置页面。

## 验证与限制

- `npm run check` 通过；`npm test` 17 项通过，涵盖获取→保存→查询→渲染、请求原样透传、限定域名与路径、成对凭据、手动覆盖、单键清除、单位、零值/未知、错误与来源声明，以及 6 种样式 × 7 个 Widget Family 的 DSL 检查。
- `npm run preview` 生成 96 个合成布局（6 种状态 × 8 个布局 × 深浅色）。内置浏览器检查未发现元素越界、文字裁切或图片加载失败；另查看正常深浅色和部分缺失的截图。
- 校验依赖复用现有小组件使用的 `yaml`，仅用于开发验证；运行脚本无依赖。首次离线安装因缓存缺失未成功，随后从 npm 官方仓库安装，禁用安装脚本，缓存写入忽略目录。
- 没有用户登录凭据，没有执行真实账户请求或上传个人响应。本地模拟不能证明接口现状、Egern 跨脚本存储、MITM 获取、原生渲染和系统刷新已通过实机验收。

## 官方资料

- https://egernapp.com/zh-CN/docs/javascript-api/
- https://egernapp.com/zh-CN/docs/configuration/scriptings/
- https://egernapp.com/zh-CN/docs/configuration/modules/
- https://egernapp.com/zh-CN/docs/configuration/widgets/

## v1.0.1 登录获取排障（2026-09-27）

- 用户确认 MITM 已开启且证书已信任，但无保存通知；截图显示访问 `app.10099.com.cn:443`，以及一个 h5 域名。v1.0.0 的模块和脚本均只接受 wx，确定漏掉 app 请求。截图仅显示 TLS 连接，不包含当前小程序的具体 HTTP 路径，不能据此声称账户查询已实机验证。
- 原查询脚本 `livinmoon/study/Scripts/ChinaBroadnet/ChinaBroadnet.js` 使用获取时保存的 URL、access 和 data。`NOTICE.md` 补充的公开运营商模块含 app 域名的同一 `qryUserInfo` 路径。这提供兼容修复的源码依据，不等同于运营商公开接口合同。
- 获取模块和脚本限定为 wx / app 两个 HTTPS 域名及原查询路径，兼容显式 443 端口。保存时将规范化后的地址与 access/data 成组写入；查询跟随该地址，不拿 app 登录跨域请求 wx。兼容旧版无 endpoint 的 wx 存储；拒绝不在白名单中的存储地址。
- 手动登录新增 `API_HOST` 两项选择，自动获取时忽略该项。两个模块使用同一个带 `?v=1.0.1` 的 JS URL，帮助更新时避开旧脚本缓存；保留全部原作者署名。
- 新增 4 项回归测试，在旧实现上均失败；修复后语法检查通过，完整小组件测试共 **21 项通过**。覆盖 app 获取及查询、跨入口成组替换、旧登录兼容、手动入口及非法域名拒绝；原有界面、单位、失败提示与来源声明检查继续通过。
- 本次未更改布局，未重做 96 个模拟布局的视觉验收；未访问用户账号、未调整用户手机配置。Egern 2.21.0 (788) 的真实获取、跨脚本读取和当前接口仍待手机确认。若更新后无通知，应查看实际 HTTP 路径或脚本错误，再决定后续修复。
