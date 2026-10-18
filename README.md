# 境外 AI、流媒体与应用分流规则

## 五端懒人完整配置

以下文件是可整份导入的精简配置，只预置 AI、PayPal、GitHub 三个应用分流，以及局域网直连、中国 IP 分流（默认直连）和其余流量代理。Clash、Stash、Loon、Egern 默认自动选择节点；Shadowrocket 使用首页所选节点。三个应用都能单独改选策略。其他服务的独立规则仍保留，供你按需手动添加；`Routing.*` 是包含这些服务的可选接入片段，不会自动加载到懒人配置中。

| 客户端 | 完整配置直链 | 导入前的唯一节点步骤 |
|---|---|---|
| Clash / Mihomo | [Lazy.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Clash/Lazy.yaml) | 将 `proxy-providers.Nodes.url` 改为 Clash / Mihomo 格式节点订阅 |
| Stash | [Lazy.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Stash/Lazy.yaml) | 将 `proxy-providers.Nodes.url` 改为 Stash 能读取的 YAML 节点订阅 |
| Loon | [Lazy.lcf](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Loon/Lazy.lcf) | 将 `[Remote Proxy]` 的 `Nodes` 地址改为 Loon 节点订阅 |
| Shadowrocket | [Lazy.conf](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Shadowrocket/Lazy.conf) | 在应用首页导入自己的节点订阅并选中可用节点 |
| Egern | [Lazy.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Egern/Lazy.yaml) | 将 `policy_groups` 内 `Nodes.urls` 改为 Egern 兼容节点订阅 |

四份带 `subscription.example.invalid` 的公开配置是**待填订阅的成品模板**，该地址故意不可用；必须在本机替换后再导入，不能直接把公开直链当成有节点的配置使用。Shadowrocket 配置可直接导入，但仍需自行添加节点。这里没有免费节点，也没有把私人订阅放进公开仓库或交给第三方转换服务。不同客户端所需的订阅输出格式可能不同，不能保证同一条订阅链接在五端通用。

五端均提供 `香港手动`、`台湾手动`、`日本手动`、`新加坡手动`、`美国手动` 五个地区组，按订阅节点名称中的国旗、中文地名或常见英文缩写筛选。AI 和 GitHub 各有分流组，可选择这五个地区组；PayPal 有独立分流组，仅可选择 `美国手动` 或 `REJECT`。Clash / Stash / Loon / Egern 的 `PROXY` 也可选择地区组。地区组把 `REJECT` 放在首位，避免尚未选定该地区节点时默认直连或跨区；使用前请进入组内手动选择具体节点。筛选只看节点名称，不能验证真实出口地区；若某个地区没有匹配节点，请检查订阅节点名称。

Clash / Stash / Loon 的 `PROXY` 默认走 `AUTO`，Egern 的 `PROXY` 默认走 `Nodes` 自动测速，Shadowrocket 的内置 `PROXY` 使用首页所选节点。PayPal 默认选 `美国手动`，AI 和 GitHub 默认选 `PROXY`；Clash / Stash 的 AI 和 GitHub 分流组还可直接选订阅内节点。`国内分流` 组默认选 `DIRECT`，也可手动选 `PROXY` 或五个地区组。五端的 LAN 直连规则均由本仓库远程规则集加载；Clash / Mihomo、Stash、Loon、Egern 的 CN GeoIP 匹配也使用各自格式的远程规则集，Shadowrocket 保留本地 `GEOIP,CN,国内分流`。LAN 仍固定 `DIRECT`，CN 走可选的 `国内分流` 组。PayPal 要正常联网，必须先在 `美国手动` 组中选中实际美国节点。懒人配置的规则顺序为 LAN 直连 → AI → PayPal → GitHub → 中国 IP 分流 → 其余代理。分流会从本仓库的远程规则集定期更新；首次使用必须能读取这些规则链接。

五端配置已对照用户提供的模板检查。Loon 配置明确设置 IP 优先级、DNS、连通性检测、UDP 失效策略及局域网旁路；Shadowrocket 配置加入 DNS 备用、IPv6、私网解析与 TUN 旁路；Clash / Stash 配置加入 DNS 与 Fake IP，并让 `.local` / `.lan` 使用系统 DNS；Clash 的远程规则集更新通过 `PROXY`。Egern 配置加入 DNS、测速地址及局域网旁路。Clash 的系统代理或 TUN 开关仍由所用客户端和操作系统管理，配置不强制启用 TUN。未复制示例模板中的 MITM 证书、重写、脚本、外部订阅转换器或对局域网开放的控制端口。

完整配置由 `python scripts/build_lazy_configs.py` 生成，`python scripts/build_lazy_configs.py --check` 检查是否与清单同步。

## 流媒体与其他应用

AI 维持一份聚合规则，不按平台拆分。规则库另提供 17 份主流服务独立规则，以及一份 `Common` 常见服务合并规则；除了 PayPal 和 GitHub，其余服务均未预置到懒人配置。五种客户端各有独立格式，目录为 `rule/<客户端>/<规则名>/<规则名>.<扩展名>`。Clash、Stash、Egern 使用 `.yaml`，Loon、Shadowrocket 使用 `.list`。服务名与次序如下：

| 类别 | 独立规则名 |
|---|---|
| 流媒体 | YouTube、Netflix、DisneyPlus、Max、PrimeVideo、Spotify、TikTok |
| 社交与通讯 | Telegram、X、Facebook、Instagram、WhatsApp、Discord |
| 开发与通用平台 | GitHub、Google、Microsoft |
| 支付 | PayPal |

PayPal 独立规则包含 `paypal.com`、`paypalobjects.com`、`paypal.me` 及已核实的 `paypal.ca`、`paypal.com.cn`、`paypal.com.hk`、`paypal.com.sg`、`paypal.hk`、`paypal.jp` 地区入口；匹配到这份规则的流量在五端完整配置中默认走 `美国手动`，不回退到其他地区或直连。GitHub 独立规则还覆盖官方博客 `github.blog`、短链接 `gh.io` 和 GitHub Enterprise Cloud 数据驻留域名 `ghe.com`。`Common` 合并 Hulu、Twitch、Reddit、Pinterest、Apple TV+、Paramount+、Peacock、Steam、Zoom、Vimeo、SoundCloud，以及部分 Meta 共用 CDN。共用 CDN 不能可靠地区分 Facebook、Instagram 与 WhatsApp，因此放在 `Common`。

五端可选接入片段分别在 [Clash](config/Clash/Routing.yaml)、[Stash](config/Stash/Routing.yaml)、[Loon](config/Loon/Routing.lcf)、[Shadowrocket](config/Shadowrocket/Routing.conf)、[Egern](config/Egern/Routing.yaml)。这些片段保留完整服务规则，供手动挑选和合并，不会自动加载到懒人配置中。将需要的规则合并到现有配置时，`PROXY` 必须是已经存在的代理策略；片段中的 `国内分流` 默认 `DIRECT`，可改选 `PROXY`。五端片段均包含 LAN 远程直连规则，合并时将它放在应用规则之前、中国 IP 规则之前。PayPal 行使用 `美国手动`，现有配置也必须有这个组并选中美国节点。片段规则顺序是 **LAN 直连 → AI → 独立服务（含 PayPal）→ Common → 中国 IP 分流 → 其余代理**。Clash / Stash 使用 `MATCH,PROXY` 作为最终规则，Loon / Shadowrocket 使用 `FINAL,PROXY`，Egern 使用 `default: policy: PROXY`。已有的宽泛规则及兜底必须检查顺序，不能让它们提前截获这些服务。

清单见 [sources/foreign-services.json](sources/foreign-services.json)，生成命令：

```sh
python scripts/build_service_rules.py
python scripts/build_service_rules.py --check
```

这些是常用服务域名清单，并非完整网络依赖白名单。未将整个云厂商、共享 CDN、ASN、动态 IP 或关键词强制代理；没有节点、DNS 或客户端真机联网验证。流媒体能否解锁还取决于节点地区和服务账号。CN 远程规则只包含 GeoIP 条件，不是中国 IP 地址数据库，也不能代替国内域名规则；Shadowrocket 继续在配置内使用 GeoIP 条件。LAN 远程规则收录截图中的特殊用途网段和原有直连网段；`198.18.0.0/15` 未放进使用 Fake IP 的 Clash / Stash 清单，其他三端保留。各客户端配置中的局域网旁路或 TUN 排除项仍保留。若现有配置已有国内域名直连规则，应放在兜底之前。来源主要为 [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community/tree/master/data) 中相应服务清单、各平台官网及用户提供的五端格式样例，许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本次新增的 PayPal 地区域名见其[香港](https://www.paypal.com/hk/legalhub/paypal/useragreement-full)和[加拿大](https://www.paypal.com/ca/legalhub/paypal/useragreement-full)用户协议；GitHub 域名见其[官方博客说明](https://docs.github.com/en/authentication/troubleshooting-ssh/error-host-key-verification-failed)、[官方短链接实例](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)和 [GHE.com 网络说明](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/network-details-for-ghecom)，并与 [v2fly GitHub 清单](https://github.com/v2fly/domain-list-community/blob/master/data/github)交叉核对。2026-09-26 已核对五端 PayPal 规则及五端 `国内分流` 的组引用、默认策略与规则顺序，并通过 104 份分流生成文件和 5 份完整配置的重复生成检查；未进行真机导入。

## AI 聚合规则

为 Clash / Mihomo、Loon、Stash、Shadowrocket、Egern 分别提供可远程引用的规则集。五份文件来自同一清单，当前覆盖 **27 类服务、149 条域名规则**。更新日期：2026-10-18。

2026-09-30 根据 v2fly 于 2026-09-29 合入的 [Gemini Web 更新](https://github.com/v2fly/domain-list-community/commit/ed196cf96f289275116f9a1cc120870f872bd1f9)和 [NotebookLM 更新](https://github.com/v2fly/domain-list-community/commit/ae6df175a4239b8138cbd9c16c9f09ca92e491f1)，补充 `geminiweb-pa.clients.google.com`、`geminiweb-pa.clients6.google.com`、`labstailwind.pa.googleapis.com`。三项均采用精确域名匹配，不扩展到整个 `clients.google.com`、`clients6.google.com` 或 `googleapis.com`；NotebookLM 上游后缀规则在这里收窄为精确主机。依据为已读取的[固定上游快照](https://github.com/v2fly/domain-list-community/blob/2d71342eea1720da57261b55663c9d55619e9b1c/data/google-deepmind)，未找到 Google 官方对这三个具体主机的公开说明，未声称官方逐项确认或真机验证。此次未发现需要修改 Lazy 配置的可证实问题，五端配置保持不变。

## 下载与分类

| 客户端 | 规则直链 | 格式 |
|---|---|---|
| Clash / Mihomo | [AI.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Clash/AI/AI.yaml) | classical YAML |
| Loon | [AI.list](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Loon/AI/AI.list) | DOMAIN / DOMAIN-SUFFIX 文本 |
| Stash | [AI.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Stash/AI/AI.yaml) | classical YAML |
| Shadowrocket | [AI.list](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Shadowrocket/AI/AI.list) | DOMAIN / DOMAIN-SUFFIX 文本 |
| Egern | [AI.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Egern/AI/AI.yaml) | 原生 domain_set / domain_suffix_set YAML |

这些文件是规则集，不是完整客户端配置，也不包含代理节点或订阅。Clash 与 Stash 的文件内容相同，但按客户端分别存放；Loon 与 Shadowrocket 同理。Egern 使用其原生结构。

## 覆盖的服务

| 服务 | 域名规则数 |
|---|---:|
| OpenAI / ChatGPT / Codex / Sora / Sites / Crixet | 22 |
| Anthropic / Claude | 10 |
| Google Gemini / AI Studio / NotebookLM / Code Assist | 46 |
| GitHub Copilot / GitHub Models | 6 |
| Perplexity | 5 |
| xAI / Grok / Grokipedia | 4 |
| Poe | 2 |
| Cursor | 5 |
| Windsurf / Codeium | 4 |
| JetBrains AI | 3 |
| Hugging Face | 3 |
| Groq | 1 |
| Cerebras | 1 |
| ElevenLabs | 2 |
| Microsoft Copilot | 9 |
| Mistral / Le Chat | 1 |
| Cohere | 2 |
| Midjourney | 1 |
| OpenRouter | 1 |
| Meta AI / Muse / Llama / SAM | 12 |
| Civitai | 1 |
| Suno | 2 |
| Runway | 2 |
| Character.AI | 1 |
| Stability AI | 1 |
| Syntx.AI | 1 |
| Jev / System One | 1 |

Google AI 包含 Gemini、AI Studio、NotebookLM、Jules、Flow、Opal、Antigravity、Stitch 及 Code Assist 的已收录端点。

2026-10-18 根据 v2fly 已合并的 [OpenAI 更新 #4149](https://github.com/v2fly/domain-list-community/pull/4149)及[Jev 更新 #4153](https://github.com/v2fly/domain-list-community/pull/4153)，新增 `openai.org` 和 `typesafe.ai` 两条后缀。对应固定清单为 [OpenAI](https://github.com/v2fly/domain-list-community/blob/5b1678867da0afc35854f481c1749a39048952df/data/openai)和 [Jev / System One](https://github.com/v2fly/domain-list-community/blob/be747934e1bc2756b6fbad31bec98221d87f819f/data/category-ai-!cn)。Cursor 同日新增的 [`cursorvm.com`](https://github.com/v2fly/domain-list-community/pull/4155) 已被现有规则覆盖，无需重复添加。

重新审查此前对测试环境域名的排除后，依据新合并记录及 [Codex 自有主机校验](https://github.com/openai/codex/blob/7b44ac1661433ae3a6f375fde873fa7123c935fe/codex-rs/cli/src/exec_server_command.rs)，现将 `openai.org` 主域及子域纳入 AI。[Agent Identity 官方代码](https://github.com/openai/codex/blob/7b44ac1661433ae3a6f375fde873fa7123c935fe/codex-rs/agent-identity/src/lib.rs)仍将 `auth.api.openai.org` 定义为 staging，它也会随新后缀进入 AI；本次不把它描述为新增生产端点。`chatgpt-staging.com` 仍未收录。域名分流不区分同一域名下的生产或测试用途。OpenAI.org、Jev 官网及其余所尝试官方页面的直接读取被云端出站策略以 403 拒绝，采纳依据为已完整读取的 GitHub 资料与可靠上游合并记录，未声称完成官网实时核实或真机联网验证。

2026-10-11 根据 v2fly 已合并的 [Syntx.AI 分类更新](https://github.com/v2fly/domain-list-community/pull/4119)和[固定提交清单](https://github.com/v2fly/domain-list-community/blob/8e95517c1669d6186159c0c87edbb55e22c40bd9/data/category-ai-!cn)，新增 `syntx.ai` 后缀。主域及多级子域均匹配，`not-syntx.ai` 和 `syntx.ai.example.org` 不匹配。其官网的直接读取被云端出站策略以 403 拒绝，采纳依据为可信上游合并记录，未声称完成官网实时核实或真机联网验证；五端 Lazy 配置保持不变。

2026-10-08 根据用户确认的 Meta AI / Muse 连接日志，补充四个此前在五端均未命中 AI 的精确主机；同时核对 Meta 官方项目中的 Llama、AI at Meta 和 SAM 入口，共新增 9 条规则：

| 功能 / 服务 | 新增规则 | 核对来源 |
|---|---|---|
| Meta AI / Muse 登录与 Graph 依赖 | 精确匹配 `auth.meta.com`、`accountscenter.meta.com`、`meta.graph.meta.com`、`ar.graph.meta.com` | 用户实际连接日志及用途确认；[v2fly Meta 分类](https://github.com/v2fly/domain-list-community/blob/e84921279c9142434b43cb84ec6c17f987e025df/data/meta)和 [blackmatrix7 Facebook 分类](https://github.com/blackmatrix7/ios_rule_script/blob/036c097eb26c6a52c4f04ebcb6633043cb942669/rule/Clash/Facebook/Facebook.yaml)核对 Meta 域名归属；[Meta 官方账号入口代码](https://github.com/facebook/bunnylol.rs/blob/6dd85e0d8bac26d173cb98ded564a3e7e2fbe91f/src/commands/meta.rs)和 [Project Aria 登录资料](https://github.com/facebookresearch/projectaria_tools/blob/cb1fe5f793b98018d17a0358f3a0aed91cc4025f/website/docs-ark/support/projectaria_login.mdx)说明账号中心和 Graph 接口也被其他功能共用 |
| Llama 网站与 API | 后缀匹配 `llama.com` | [Meta 官方模型配置文档](https://github.com/facebookresearch/meta-agents-research-environments/blob/a9fd2edccb4bc7e22fbf45c8482a5fef30a2a5a4/docs/user_guide/llm_configuration.rst)引用 `www.llama.com`；[官方 API 配置](https://github.com/facebookresearch/meta-agents-research-environments/blob/a9fd2edccb4bc7e22fbf45c8482a5fef30a2a5a4/docs/user_guide/benchmarking.rst)使用 `api.llama.com`，并与 v2fly Meta 分类交叉核对 |
| AI at Meta 与 SAM 演示 | 精确匹配 `ai.meta.com`、`aidemos.meta.com`、`www.aidemos.meta.com`、`sam2.metademolab.com` | [SAM 2 官方说明](https://github.com/facebookresearch/sam2/blob/2b90b9f5ceec907a1c18123530e92e794ad901a4/README.md)、[官方演示入口配置](https://github.com/facebookresearch/sam2/blob/2b90b9f5ceec907a1c18123530e92e794ad901a4/demo/frontend/src/demo/DemoConfig.tsx)及 [SAM 3D 官方说明](https://github.com/facebookresearch/sam-3d-objects/blob/f91db411c50efee93d8db7aeb323885650f6f722/README.md) |

四个登录 / Graph 主机的 AI 使用依据是用户本次连接记录，官方资料没有把它们定义为 AI 独占域名。其他 Meta 功能使用相同主机时也会进入 AI 策略，包括账号中心里的 Meta Pay；域名规则无法按 URL 路径区分。此次复核后将这几个已观察到的依赖作为明确例外收录，未扩展到整个 `meta.com`、`graph.meta.com`、`metademolab.com`、Meta 共享 CDN 或其他设备 / Work 接口。官网、Llama / SAM 演示及 Muse 开发文档的实时读取被云端出站策略拒绝；新规则依据上述已完整读取的 GitHub 资料和用户日志，未声称完成真机联网测试。

客户端需刷新远程 AI 规则集，并把 AI 策略选到可用代理节点。用户截图里的 TCP 连接虽显示 `FINAL`，仍走了香港代理；这次修复的是 AI 未命中。若刷新后显示 AI 但选中了 `DIRECT`，应调整 AI 组选择；若已命中 AI 且使用代理仍失败，再检查节点、账号地区和 DNS。截图中 `Block QUIC` 属于现有客户端的 UDP / QUIC 设置，新增域名规则不保证解除该拦截。五端 Lazy 的 AI 调用顺序与策略引用经独立检查，没有发现需要修改配置的问题。

2026-10-04 根据 v2fly 已合并的 [Anthropic 清单更新](https://github.com/v2fly/domain-list-community/pull/4114)和[固定提交文件](https://github.com/v2fly/domain-list-community/blob/2c892a618f4e23c549d28edd0f3f75407521b1aa/data/anthropic)，补充 `claude.dev` 后缀。主域和多级子域均命中 AI，伪后缀不匹配。该域名及 Claude 官方文档的直接访问被云端出站策略拒绝，采纳依据为可信上游合并记录，未声称完成官方网页实时核实或真机联网验证；五端 Lazy 配置保持不变。

2026-10-02 补充 GitHub Models 的精确主机 `models.github.ai`。GitHub 官方的 [AI 评论分类 Action 文档](https://github.com/github/ai-assessment-comment-labeler/blob/a29876208a805048b198ff9e055100b1b23f9db4/README.md)和[模型端点实现](https://github.com/github/rollup-and-away/blob/2e071f495705a644988617534fc434bf0c559b22/src/util/config/models.ts)均使用该主机；默认与组织推理路径都能命中 AI。未扩展到整个 `github.ai` 或共享 Azure 域名，五端 Lazy 配置保持不变。

2026-10-01 复核已收录服务的最新上游及新增功能域名，补充以下后缀：

| 功能 / 服务 | 补充的域名后缀 | 核对来源 |
|---|---|---|
| ChatGPT Sites 发布的网站 | `chatgpt.site` | [v2fly 已合并记录](https://github.com/v2fly/domain-list-community/pull/3842)、[OpenAI 官方仓库的 Sites URL 示例](https://github.com/openai/plugins/blob/5fd93af4cd0c623e020d0cc7e9ce178b4ac1f70f/plugins/data-analytics/src/analytics-app/handoff.test.mjs) |
| Crixet | `crixet.com` | [v2fly 已合并记录及收购说明来源](https://github.com/v2fly/domain-list-community/pull/3221) |
| Grokipedia | `grokipedia.com` | [v2fly xAI 清单变更](https://github.com/v2fly/domain-list-community/commit/b42ed972dc472f0bf81f77228ad806c9a31b700b) |
| Meta Muse | `metaaivm.com`、`muse.ai` | [v2fly 已合并记录](https://github.com/v2fly/domain-list-community/pull/4095) |

`chatgpt.com` 的后缀规则不会匹配独立的 `chatgpt.site` 域名。新增 `chatgpt.site` 后缀后，发布站点的多级子域也会命中 AI 规则，无需逐个加入网站地址；这会将该平台托管的用户网站一并分流到 AI 策略。通用云服务、任意第三方插件和自定义域名仍按现有规则处理，不因为由 AI 创建就自动归入本组。

使用远程规则集的客户端需要手动刷新 AI 规则后才会使用新版本；检查 AI 组当前选中的出口，若选成 `DIRECT`，命中 AI 组后仍会直连。五端 Lazy 的 AI 引用与规则顺序经核对，无需重新导入整份配置。

## 接入方法

把片段合并到现有配置的对应位置。下方 `AI` 是策略组占位名，**必须替换成已经存在、且选好节点的策略组**，或先自行创建同名组。规则集本身不指定出口。

用户提供的模板中，Stash 可使用 `手动切换`，Loon 可使用 `美国手动场景`，Egern 可使用 `PROXY`，Shadowrocket 已有 `AI` 组；以你实际保留的组名为准。

### Clash / Mihomo

添加 provider，并把调用规则放在 Google、Microsoft、GitHub 等大范围规则和最终兜底前：

```yaml
rule-providers:
  ForeignAI:
    type: http
    behavior: classical
    format: yaml
    url: https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Clash/AI/AI.yaml
    path: ./ruleset/ForeignAI.yaml
    interval: 86400

rules:
  - RULE-SET,ForeignAI,AI
```

### Stash

```yaml
rule-providers:
  ForeignAI:
    behavior: classical
    format: yaml
    url: https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Stash/AI/AI.yaml
    path: ./ruleset/ForeignAI.yaml
    interval: 86400

rules:
  - RULE-SET,ForeignAI,AI
```

### Loon

加入已有的 `[Remote Rule]` 段，排在其他可能覆盖 AI 的远程规则前。检查本地 `[Rule]` 中是否已有优先命中的宽泛规则：

```ini
[Remote Rule]
https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Loon/AI/AI.list, policy=AI, tag=国外AI, enabled=true
```

### Shadowrocket

加入已有的 `[Rule]` 段，放在 Google、Microsoft、GitHub 等大范围规则和 `FINAL` 前：

```ini
[Rule]
RULE-SET,https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Shadowrocket/AI/AI.list,AI
```

### Egern

在已有 `rules` 列表中靠前加入，放在宽泛规则和 `default` 前：

```yaml
rules:
  - rule_set:
      name: 国外AI
      match: https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/rule/Egern/AI/AI.yaml
      policy: AI
      update_interval: 86400
      disabled: false
```

不要为粘贴片段而重复创建同名 YAML 顶层键；应合并到已有的 `rules`、`rule-providers` 或配置段中。

## 规则范围

- blackmatrix7 的 OpenAI 清单标为 35 条，其中 14 条所列主机或根域已由本规则匹配；其余包含 16 条共享第三方域名、1 条现已属于其他服务的 `ai.com`，以及关键词、IP、ASN 共 4 条。上游的部分后缀规则比本清单中的精确域名匹配更宽，不能直接按条数比较覆盖范围。
- 只使用精确域名和域名后缀；未加入共享云厂商 ASN、整个 Google/Microsoft/GitHub 域名空间、通用关键字或宽泛 IP 段。
- 未把第三方清单中混入的国内 AI 服务纳入本组；这是一份常用国外 AI 清单，并非全球所有 AI 服务的穷尽列表。
- Google、Microsoft、GitHub 的通用登录，以及通用验证码、支付、客服、遥测和 CDN 仍按现有配置分流。仅靠域名无法把同一主机上的 AI 与非 AI 路径完全分开。
- `host.livekit.cloud`、`turn.livekit.cloud` 来自上游 OpenAI 语音规则；它们是共享 LiveKit 子域，其他应用使用相同子域时也会匹配。
- 未把 ChatGPT 动态 Azure WebPubSub 正则或语音 IP 集转换成宽泛域名/IP 规则；这些连接沿用现有兜底。使用服务专属域名以外的共享依赖时，可能仍需针对实际连接日志补充。
- 分流文件不调整 DNS、MITM、证书、重写、插件、节点和订阅，也不保证某个节点能够登录所有 AI 平台。

## 来源与维护

原始服务清单及每组来源见 [sources/foreign-ai.json](sources/foreign-ai.json)。参考：

- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script/tree/master/rule)：OpenAI、Claude、Gemini、Copilot、Civitai 分类。
- [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community)：按服务补充域名，经过范围筛选；许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
- [OpenAI 网络要求](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps)、[GitHub Copilot 网络域名](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference)、[Cursor 网络配置](https://prod.cursor.com/docs/enterprise/network-configuration)，以及清单中列出的服务官网。
- [Claude Desktop 网络要求](https://code.claude.com/docs/en/desktop#network-access-requirements)：补充 `claude.app`，覆盖官方列出的桌面版主域名和子域名。

格式依据：[Mihomo](https://wiki.metacubex.one/config/rule-providers/content/)、[Stash](https://stash.wiki/en/rules/rule-set)、[Egern](https://egernapp.com/docs/configuration/rules/)、[Loon 官方示例](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Rule/ExampleRule.list)、[用户提供的 Shadowrocket 配置](https://lowertop.github.io/Shadowrocket/lazy_group.conf)。

维护时编辑清单，再运行以下命令；生成脚本只用 Python 3 标准库，不会自动抓取或自动发布上游变更：

```sh
python scripts/build_ai_rules.py
python scripts/build_ai_rules.py --check
```

客户端的定时刷新读取的是本仓库已发布版本。上游域名变化需要先人工核对，再更新清单并提交。

## 验证状态

2026-10-18 云端环境就绪后实际运行通过：三个生成器的 `--check`、69 份 YAML 严格解析、4 份 Loon / Shadowrocket Lazy / Routing INI 段结构检查、90 份服务规则与源清单比对，以及五端 Lazy 的 DNS、订阅占位、旁路、地区组及 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接、策略引用与循环检查。共通过 3,895 个域名断言、300 个地区筛选断言、45 个 Meta / Sites / Syntx / OpenAI.org / Jev 的 AI 优先路径检查、90 个功能 URL 正例和 45 个测试环境 / 自定义域名 / 伪后缀反例；正例包含本轮新纳入的 `auth.api.openai.org` 测试主机。每端现为 43 条精确域名、106 条后缀规则。两条新增后缀的主域、多级子域匹配，伪后缀不匹配；用户报告的 Sites 网站与 Meta 四个主机固定回归通过。

本轮完整读取并核对哈希的资料包括 50 份可信上游清单、15 份官方 GitHub 文件及两份对应合并提交的完整清单，核实了三条相关合并记录。12 次官网 / 官方文档 / Sites 页面直接请求均被出站策略以 403 拒绝。没有客户端可执行程序，未进行原生导入、实际节点 / DNS / QUIC / 登录测试，无法核实手机端规则缓存和当前 AI 策略选择；结构检查不能代替真机验证。五端 Lazy 和其他服务规则保持不变。

2026-10-11 基于最新 master 的隔离云端快照实际运行通过：三个生成器的 `--check`、69 份 YAML 严格解析、4 份 Loon / Shadowrocket Lazy / Routing INI 段结构检查、90 份服务规则与源清单的语义比对，以及五端 Lazy 的 DNS、订阅占位、旁路、地区组、PayPal 限制、CN 默认 DIRECT、规则顺序、远程链接和策略引用 / 循环检查。共通过 3,845 个域名断言、300 个地区筛选断言和 30 个 Meta / Sites / Syntx 的 AI 优先路径检查；另通过 50 个功能 URL 正例和 30 个测试环境 / 自定义域名 / 伪后缀反例。2026-10-11 当时每端为 43 条精确域名、104 条后缀规则。完整读取的 50 份可信上游清单中，只有 AI 分类新增 Syntx.AI，其他已核对清单内容与上一轮一致。

OpenAI 官方 Codex 源码中的生产端点仍由现有 `chatgpt.com`、`openai.com` 后缀覆盖，包括实时调用路径；[Agent Identity 实现](https://github.com/openai/codex/blob/cc7ba33601286a751477832b01de7b6f8de0dd9c/codex-rs/agent-identity/src/lib.rs)明确将 `auth.api.openai.org` 和 `chatgpt-staging.com` 用于测试环境，2026-10-11 当时未将其加入普通服务规则；2026-10-18 的 `openai.org` 后缀更新已覆盖前者。[OpenAI Sites 官方示例](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/data-analytics/src/analytics-app/handoff.test.mjs)及用户报告的网站均命中 AI，截图中的四个 Meta 主机回归通过。OpenAI、Canvas、Claude、GitHub、PayPal、Meta、Sora、Crixet、Syntx 官网资料及用户 Sites 页面共 10 次直接读取均被出站策略以 403 拒绝；未进行客户端原生导入、实际节点 / DNS / QUIC / 登录测试，也无法读取用户手机的规则缓存和当前策略选择。

2026-10-08 云端环境恢复后实际运行通过：三个生成器的 `--check`、69 份配置与规则 YAML 的严格解析（拒绝重复键）、Loon / Shadowrocket 四份 Lazy / Routing 的 INI 段结构检查、90 份服务规则与源清单的独立语义比对、五端 Lazy 的 DNS / 订阅占位 / 旁路设置、地区筛选样例与 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接对应文件、策略引用及循环检查，以及 `git diff --check`。五端 AI 清单均为 146 条，语义一致；共通过 3,820 个域名匹配断言、300 个地区筛选断言，以及 25 个 Meta / Sites 主机在 AI 优先于 CN / 兜底的路径检查。截图里的四个 Meta 主机在原 master 清单均不匹配，在本次生成规则均匹配；精确主机的额外子域和伪后缀不匹配，`llama.com` 主域、API 与多级子域匹配，整个 Meta / Graph / 演示域名空间未被兜入 AI。GitHub Models 的两个推理路径及用户报告的 `robot-dog-pixel-home.yf233.chatgpt.site` 固定回归通过。源清单无重复或冗余覆盖，其他服务规则和五端 Lazy 配置未变。

2026-10-08 的每份清单包含 43 条精确域名规则、103 条域名后缀规则。YAML / INI 解析及语义检查属于结构验证，不能代替客户端原生导入；未进行五个客户端的真机导入、节点联网、DNS、QUIC 或所有服务登录/语音测试。此次完整读取固定提交下的 50 份可信上游清单及上述 Meta 官方 GitHub 资料。运行环境的出站域名策略拒绝了所尝试 Meta 官网、Llama / SAM / Muse 文档与 Sites 页面的直接访问，未将其标为已完成实时联网验证。地区筛选依赖订阅中的节点名称，不能验证真实出口位置。
