# Egern 节点 IP 质量小组件

检测自己指定策略组的当次出口，显示 IP、地区、ASN、IP 类型、IPPure 风险分，以及媒体 / AI 页面探测结果。策略组名称在 Egern 模块设置中修改。

**状态：v1.0.0，待 Egern / iPhone 实机验收。** 本地测试不验证真实策略路由和 iOS 刷新时机；本项目不包含节点、订阅、个人策略组配置或密钥。

## 安装

模块原始链接：

```text
https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/IPQuality/ip-quality.yaml
```

[打开模块 YAML](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/IPQuality/ip-quality.yaml) · [查看脚本](https://github.com/YUDIDIFEI/Scripts/blob/master/widgets/Egern/IPQuality/ip-quality.js)

1. Egern → **工具 → 模块 → +**，添加本仓库的 `ip-quality.yaml` 原始链接。
2. 编辑模块，在 **检测策略组** 中填写 Egern 中已有策略组的完整名称，包含表情与空格。此项没有默认代理；留空时小组件显示配置提示，不发送检测请求。
3. Egern → **分析 → 左上角小组件画廊**，找到“节点 IP 质量”。
4. iOS 主屏幕添加 Egern 小组件，长按 → **编辑小组件** → 选择“节点 IP 质量”。中、大尺寸信息更完整。

以后更换检测目标，只需修改模块的“检测策略组”。在组内切换节点后，下次检测重新请求数据，不复用该组之前的分数。

若 Egern 版本未显示自动生成的参数控件，可在模块 **Env** 手动添加 `POLICY`，值为完整策略组名称。运行需要支持官方文档中的 native generic 脚本 / Widget DSL / `ctx.http` API 的版本。

### 本地文件安装（可选）

1. Egern → 工具 → 脚本 → +，名称填 `ip-quality`，类型选 `generic`，文件位置选本地，文件名填 `ip-quality.js`。
2. 在“编辑文件”中粘贴本仓库 `ip-quality.js` 的内容并保存，脚本超时设为 30 秒；在脚本 Env 中添加 `POLICY`，值为要检测的完整策略组名称。
3. 分析 → 左上角小组件画廊 → +，名称填“节点 IP 质量”，脚本选 `ip-quality`。其他参数也可放在该脚本的 Env 中。
4. 运行画廊内的小组件核对结果，再添加到主屏幕。

## 参数

| 设置 | Env 名称 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 检测策略组 | `POLICY` | 空，必须填写 | 保留完整名称；每个请求均显式传入 `policy` |
| 媒体与 AI 检测 | `MEDIA_TEST` | `true` | 关闭后只查询出口与质量来源 |
| 隐藏完整 IP | `MASK_IP` | `false` | 所有小组件尺寸及多出口提示都使用遮盖后的 IP |
| 刷新分钟数 | `REFRESH_MINUTES` | `60` | 限制在 15–1440；这是刷新请求，不保证定时执行 |
| ipapi Key | `IPAPI_KEY` | 空 | 可选，仅向 ipapi.is 通过 HTTPS POST 发送；不要上传自己的值 |

`env_schema.default_value` 仅是 Egern 的输入提示，真实默认行为由脚本处理。策略组必填项不会把占位提示当作默认策略。

## 包含的检测

- **出口与基础信息**：IPPure、ipapi.is、IPv4 ipify 交叉核对；优先以 IPPure 返回的出口为主，失败时依次降级至 ipapi、ipify。基础地理位置和 ASN 按一整份来源显示。
- **风险与类型**：IPPure 的 0–100 原始风险分（越高风险越高）、住宅 / 非住宅、原生 / 广播标记。ipapi 有完整数据时补充机房 / 移动网络及公司网络滥用比例。各来源数值含义不同，不计算虚构的综合“纯净度”。
- **媒体 / AI**：ChatGPT Web、Netflix 标题页、YouTube Premium、TikTok 地区、Prime Video 地区、Reddit 首页。结果分为页面 / 端点可达、明确受限、未知。403、验证码、反爬、超时和格式变化保留为未知。
- **显示**：小、中、大、iPad 超大与锁屏小组件；深浅色自适应；检测时间与异常提示。

ipapi.is 的匿名接口当前只返回基础信息；完整风险字段需要个人 API Key。未返回的字段是“未知”，不是 false 或零。IPPure 官方说明 IPv6 不评分，即使收到零也不解释为零风险。

## 结果边界

1. **目标是策略组的当次出口。** 脚本没有切换组或全局策略的代码。官方公开 API 没有提供读取 / 锁定当前组成员的能力，所以显示策略组名与出口 IP，不冒充已获得真实节点名称。
2. **建议使用手动选择组。** 自动选优、故障转移和负载均衡可能在请求间换节点；不同网站还可能走不同出口。初次探针 IP 不一致时不合并风险，且不执行媒体检测；媒体检测结束再复核一次 IPv4 IP，变化时清除本轮风险 / 媒体结论。IPv4 与 IPv6 的差异也会保守地显示“多个出口”。复核一致仍不能证明所有网站经过同一节点。
3. **页面可达不代表解锁。** 未登录、未播放影片、未购买、未调用账号功能。检测站点改版、反爬或限流可能导致未知。
4. **评分是第三方数据。** 源站失败、限流或无字段时不会显示虚构分数，也不会退回直连重试。匿名配额按出口共享；默认一小时刷新。不要频繁刷新以规避限制。
5. **没有后台数据采集服务。** 检测直接访问列出的第三方站点，它们会看见请求出口 IP。脚本不持久化检测结果、不发送通知、不上传配置、不读取登录 Cookie、不抓取第三方演示密钥，不要求 MITM。
6. **iOS 刷新由系统调度。** `refreshAfter` 只是刷新请求。更换策略组后应在 Egern 小组件画廊重新运行确认，再查看桌面刷新结果。

这是从原 Loon 插件用途改写的轻量小组件，并非全量网页报告移植。首版不包含 BGP 路径、MTR、外部探针任务、测速、稳定性多轮测试及依赖嵌入式客户端令牌的 Disney+ 检测。

## 本地验证

需要 Node.js 22+。先进入 `widgets/Egern/IPQuality/` 目录。Egern 运行脚本没有依赖；本地验证仅使用 `yaml` 开发依赖检查模块配置：

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run preview
```

可选的 `node tools/smoke.mjs --live` 会在本机网络只读请求三个公开 IP 接口，并把去除真实 IP 的状态保存到 `artifacts/`。它不实现 Egern 路由，不能用于证明某个策略组有效。

`artifacts/preview.html` 是用虚构文档地址与固定夹具生成的布局预览，不是真实节点报告，也不是 Egern 原生渲染截图。`research/` 与 `artifacts/` 不发布。

验证说明见 [IMPLEMENTATION.md](IMPLEMENTATION.md)。实机应检查：正确组 / 错误组 / 空组、切换节点后的出口、断网、各种尺寸、模块参数保存、主屏幕刷新。特别是错误组名在 Egern 中是否严格拒绝，需要实机确认；本地只验证每个请求携带了准确的策略参数。

## 来源

- [Egern 小组件](https://egernapp.com/zh-CN/docs/configuration/widgets/)、[模块 / env_schema](https://egernapp.com/zh-CN/docs/configuration/modules/)、[JavaScript API](https://egernapp.com/zh-CN/docs/javascript-api/)、[策略组](https://egernapp.com/zh-CN/docs/configuration/policy_groups/)
- [原 Loon 插件](https://github.com/MaYIHEI/paperclip/tree/main/loon/ipquality-web-test)；核对的核心版本为提交 `eaa04fe0a9f37ccfafdd11930d28fd5ff3f04718`
- [IPPure API](https://ippure.com/MyIP-Info-API)、[IPPure 评分说明](https://ippure.com/faq)
- [ipapi.is API 文档](https://ipapi.is/developers.html)、[ipify](https://www.ipify.org/)

参考与许可见 [NOTICE](NOTICE) 和 [LICENSE](LICENSE)。
