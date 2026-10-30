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

2026-10-19 根据 v2fly 已合并的 [Prime Video 更新 #4041](https://github.com/v2fly/domain-list-community/pull/4041)及[固定提交清单](https://github.com/v2fly/domain-list-community/blob/84394e467557d986c67341c90e36ca7e698d3860/data/primevideo)，为五端 `PrimeVideo` 独立规则补充精确主机 `amazon.pv-cdn.net`，每端该清单现为 6 条规则。上游合并的是 `pv-cdn.net` 后缀，原始 PR 标题明确指向该 Amazon 主机；本仓库按现有证据收窄为精确匹配。其额外子域和其他 `pv-cdn.net` 主机沿用原有分流。Prime Video 官方帮助页的直接访问被出站策略以 403 拒绝，未声称完成官方归属逐项核实、播放或解锁测试。五端可选 `Routing` 片段已有 `PrimeVideo` 引用，手动启用该片段后走 `PROXY`；Lazy 仍只预置 AI、PayPal、GitHub，不自动加载 Prime Video。其他服务的更新日期及 AI 清单保持不变。

2026-10-28 根据 v2fly 已合并的 [CDN 更新 #4192](https://github.com/v2fly/domain-list-community/pull/4192)、[固定 Spotify 清单](https://github.com/v2fly/domain-list-community/blob/b769e3017845f8e672dccb51c37c731d84f94d62/data/spotify)和其关联的[音频漏匹配报告 #522](https://github.com/Loyalsoldier/v2ray-rules-dat/issues/522)，为五端 Spotify 独立规则新增精确主机 `audio-ake.spotify.com.edgesuite.net`，每端 Spotify 现为 13 条规则。原有精确规则 `spotify.com.edgesuite.net` 不会匹配该主机。上游将该父域改为后缀，本仓库按具体报告收窄为补充精确主机；父域原有匹配及其他额外子域的行为保持不变，未扩展整个 `edgesuite.net`。Netflix 同次上游类型调整未带来已核实的新增具体主机，本轮保留原有精确匹配。现有可选 Routing 仍将 Spotify 送到 `PROXY`；Lazy 不自动加载 Spotify，AI 不收录此音频主机。直接请求被出站策略以 403 拒绝，未进行音频播放、账号或节点验证。其他服务的规则和更新日期保持不变。

2026-10-23 根据 v2fly 已合并的 [Steam 更新 #4174](https://github.com/v2fly/domain-list-community/pull/4174)及[固定提交清单](https://github.com/v2fly/domain-list-community/blob/f406839acb33fdf077abf3aa7d6561fce7eed58f/data/steam)，为五端 `Common` 增加 `steamos.cloud` 后缀，每端 Common 现为 38 条规则。Valve 官方 [Proton SDK 文档](https://github.com/ValveSoftware/Proton/blob/bc896217ffcd67f892f952b010f898fe7bd0f0a1/docker/README.md)使用 `gitlab.steamos.cloud` 和 `registry.gitlab.steamos.cloud`，[调试文档](https://github.com/ValveSoftware/Proton/blob/bc896217ffcd67f892f952b010f898fe7bd0f0a1/docs/DEBUGGING-WINDOWS.md)使用 `proton-archive.steamos.cloud`，与上游分类交叉核对。主域及多级子域进入 Common，伪后缀不匹配；现有可选 Routing 的 Common 引用将其送到 `PROXY`，Lazy 不自动加载 Common，AI 规则不收录该域名。SteamOS 官网直接请求被出站策略以 403 拒绝，未进行下载、登录或真机网络验证。其他服务及其更新日期保持不变。

2026-10-21 根据 v2fly 已合并的 [Twitch 更新 #3532](https://github.com/v2fly/domain-list-community/pull/3532)及[固定提交清单](https://github.com/v2fly/domain-list-community/blob/e8a386f3327444cdd2c3318b94a0abd3804e62f4/data/twitch)，为五端 `Common` 增加精确主机 `d3stzm2eumvgb4.cloudfront.net`。只匹配上游明确归入 Twitch 的这个分发主机，不扩展到 `cloudfront.net`、其他分发主机或其额外子域，也不把它加入 AI 或 Lazy。现有可选 Routing 片段的 `Common` 引用会将它送到 `PROXY`；只有手动启用该片段或对应规则时才生效。归属依据为上游合并分类，未进行 Twitch 播放或该 CDN 真机验证。

PayPal 独立规则包含 `paypal.com`、`paypalobjects.com`、`paypal.me` 及已核实的 `paypal.ca`、`paypal.com.cn`、`paypal.com.hk`、`paypal.com.sg`、`paypal.hk`、`paypal.jp` 地区入口；匹配到这份规则的流量在五端完整配置中默认走 `美国手动`，不回退到其他地区或直连。GitHub 独立规则还覆盖官方博客 `github.blog`、短链接 `gh.io` 和 GitHub Enterprise Cloud 数据驻留域名 `ghe.com`。`Common` 合并 Hulu、Twitch、Reddit、Pinterest、Apple TV+、Paramount+、Peacock、Steam、Zoom、Vimeo、SoundCloud，以及部分 Meta 共用 CDN。共用 CDN 不能可靠地区分 Facebook、Instagram 与 WhatsApp，因此放在 `Common`。

五端可选接入片段分别在 [Clash](config/Clash/Routing.yaml)、[Stash](config/Stash/Routing.yaml)、[Loon](config/Loon/Routing.lcf)、[Shadowrocket](config/Shadowrocket/Routing.conf)、[Egern](config/Egern/Routing.yaml)。这些片段保留完整服务规则，供手动挑选和合并，不会自动加载到懒人配置中。将需要的规则合并到现有配置时，`PROXY` 必须是已经存在的代理策略；片段中的 `国内分流` 默认 `DIRECT`，可改选 `PROXY`。五端片段均包含 LAN 远程直连规则，合并时将它放在应用规则之前、中国 IP 规则之前。PayPal 行使用 `美国手动`，现有配置也必须有这个组并选中美国节点。片段规则顺序是 **LAN 直连 → AI → 独立服务（含 PayPal）→ Common → 中国 IP 分流 → 其余代理**。Clash / Stash 使用 `MATCH,PROXY` 作为最终规则，Loon / Shadowrocket 使用 `FINAL,PROXY`，Egern 使用 `default: policy: PROXY`。已有的宽泛规则及兜底必须检查顺序，不能让它们提前截获这些服务。

清单见 [sources/foreign-services.json](sources/foreign-services.json)，生成命令：

```sh
python scripts/build_service_rules.py
python scripts/build_service_rules.py --check
```

这些是常用服务域名清单，并非完整网络依赖白名单。未将整个云厂商、共享 CDN、ASN、动态 IP 或关键词强制代理；没有节点、DNS 或客户端真机联网验证。流媒体能否解锁还取决于节点地区和服务账号。CN 远程规则只包含 GeoIP 条件，不是中国 IP 地址数据库，也不能代替国内域名规则；Shadowrocket 继续在配置内使用 GeoIP 条件。LAN 远程规则收录截图中的特殊用途网段和原有直连网段；`198.18.0.0/15` 未放进使用 Fake IP 的 Clash / Stash 清单，其他三端保留。各客户端配置中的局域网旁路或 TUN 排除项仍保留。若现有配置已有国内域名直连规则，应放在兜底之前。来源主要为 [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community/tree/master/data) 中相应服务清单、各平台官网及用户提供的五端格式样例，许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。本次新增的 PayPal 地区域名见其[香港](https://www.paypal.com/hk/legalhub/paypal/useragreement-full)和[加拿大](https://www.paypal.com/ca/legalhub/paypal/useragreement-full)用户协议；GitHub 域名见其[官方博客说明](https://docs.github.com/en/authentication/troubleshooting-ssh/error-host-key-verification-failed)、[官方短链接实例](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)和 [GHE.com 网络说明](https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/network-details-for-ghecom)，并与 [v2fly GitHub 清单](https://github.com/v2fly/domain-list-community/blob/master/data/github)交叉核对。2026-09-26 已核对五端 PayPal 规则及五端 `国内分流` 的组引用、默认策略与规则顺序，并通过 104 份分流生成文件和 5 份完整配置的重复生成检查；未进行真机导入。

## AI 聚合规则

为 Clash / Mihomo、Loon、Stash、Shadowrocket、Egern 分别提供可远程引用的规则集。五份文件来自同一清单，当前覆盖 **33 类服务、168 条域名规则**。更新日期：2026-10-28。

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
| Anthropic / Claude | 19 |
| Google Gemini / Workspace / AI Studio / NotebookLM / Code Assist | 49 |
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
| Meta AI / Muse / Llama / SAM | 13 |
| Civitai | 1 |
| Suno | 2 |
| Runway | 2 |
| Character.AI | 1 |
| Stability AI | 1 |
| Syntx.AI | 1 |
| Jev / System One | 1 |
| Magnific | 1 |
| Artificial Analysis | 1 |
| Cline | 1 |
| CommandCode | 1 |
| Context7 | 1 |
| Nous Research | 1 |

Google AI 包含 Gemini、Workspace 侧栏、AI Studio、NotebookLM、Jules、Flow、Opal、Antigravity、Stitch 及 Code Assist 的已收录端点。

2026-10-28 根据以下已合并上游记录，补充九条 AI 规则：

| 功能 / 服务 | 新增规则 | 核对来源 |
|---|---|---|
| Gemini in Workspace（Gmail / Docs / Drive 侧栏） | 精确主机 `appsgenaiserver-pa.clients.google.com`、`appsgenaiserver-pa.clients6.google.com`、`appsgenaiserver-pa.googleapis.com` | [v2fly #4190](https://github.com/v2fly/domain-list-community/pull/4190)及[固定清单](https://github.com/v2fly/domain-list-community/blob/fa3cb96fbc210b8d6466251a1d71b4a6e63a9c85/data/google-deepmind) |
| Meta AI 内容 | 后缀 `metaaiusercontent.com` | [v2fly #4195](https://github.com/v2fly/domain-list-community/pull/4195)及[固定清单](https://github.com/v2fly/domain-list-community/blob/420c0e7b880c107aa984b3b061997a815c1a0d62/data/meta) |
| Artificial Analysis、Cline、CommandCode、Context7、Nous Research | 后缀 `artificialanalysis.ai`、`cline.bot`、`commandcode.ai`、`context7.com`、`nousresearch.com` | [v2fly #4194](https://github.com/v2fly/domain-list-community/pull/4194)及[固定清单](https://github.com/v2fly/domain-list-community/blob/3d8792f3d7caab5a11f3b411aaf173af438becd2/data/category-ai-!cn) |

[Cline 官方说明](https://github.com/cline/cline/blob/f817e59f698f01487920c00ede2dbecad5c0fa50/README.md)另有 `docs.cline.bot` 入口，[Context7 官方说明](https://github.com/upstash/context7/blob/5c368c93ef923e457ac64957d80a1b6b12a9788f/README.md)使用 `context7.com` 和 `mcp.context7.com`。其余新增项按可信上游合并分类采纳。三个 Google 后端只做精确匹配，不扩展 `clients.google.com`、`clients6.google.com`、`googleapis.com` 或其额外子域；同一主机上的其他路径也会进入 AI，域名分流不能按 `/v1/genai/` 路径细分。六条新增后缀覆盖主域和多级子域，伪后缀不匹配。官网与 API 的直接请求被出站策略拒绝，上游评论中的响应属于上游报告，未作为本轮亲测结果；未进行真机联网验证。五端 Lazy 的应用预设与顺序保持不变。

2026-10-21 根据 v2fly 已合并的 [Anthropic 更新 #4116](https://github.com/v2fly/domain-list-community/pull/4116)及[固定提交清单](https://github.com/v2fly/domain-list-community/blob/bdf45acfdeaec2644257bb8947e0a0294276d5ef/data/anthropic)，补充 `ant.dev`、`anthropic.team`、`antspace.dev`、`chatbotclaude.com`、`claude.new`、`claude.site`、`claudeacademy.com`、`claudepages.dev`、`claudestudio.com` 九条后缀；`claude.app` 已覆盖，不重复添加。服务归属依据为可信上游合并记录，未据名称推定 Sites、Pages、Studio 等具体产品功能，也未确认各域名已作为生产入口上线。根据 [Magnific 更新 #4059](https://github.com/v2fly/domain-list-community/pull/4059)及[固定提交清单](https://github.com/v2fly/domain-list-community/blob/435cb8725922d3d3c0e1684ff6224b59952a400d/data/category-ai-!cn)，新增 `magnific.com` 后缀。十条后缀的主域和多级子域进入 AI，伪后缀不匹配；未加入上游新增的 OpenAI 广告追踪项。Claude 文档及所尝试新域名官网的直接请求被出站策略以 403 拒绝，未声称官方网页实时核实或真机验证。五端 Lazy 配置保持不变。

2026-10-18 根据 v2fly 已合并的 [OpenAI 更新 #4149](https://github.com/v2fly/domain-list-community/pull/4149)及[Jev 更新 #4153](https://github.com/v2fly/domain-list-community/pull/4153)，新增 `openai.org` 和 `typesafe.ai` 两条后缀。对应固定清单为 [OpenAI](https://github.com/v2fly/domain-list-community/blob/5b1678867da0afc35854f481c1749a39048952df/data/openai)和 [Jev / System One](https://github.com/v2fly/domain-list-community/blob/be747934e1bc2756b6fbad31bec98221d87f819f/data/category-ai-!cn)。Cursor 同日新增的 [`cursorvm.com`](https://github.com/v2fly/domain-list-community/pull/4155) 已被现有规则覆盖，无需重复添加。

重新审查此前对测试环境域名的排除后，依据新合并记录及 [Codex 自有主机校验](https://github.com/openai/codex/blob/7b44ac1661433ae3a6f375fde873fa7123c935fe/codex-rs/cli/src/exec_server_command.rs)，现将 `openai.org` 主域及子域纳入 AI。[Agent Identity 官方代码](https://github.com/openai/codex/blob/7b44ac1661433ae3a6f375fde873fa7123c935fe/codex-rs/agent-identity/src/lib.rs)仍将 `auth.api.openai.org` 定义为 staging，它也会随新后缀进入 AI；本次不把它描述为新增生产端点。`chatgpt-staging.com` 仍未收录。域名分流不区分同一域名下的生产或测试用途。OpenAI.org、Jev 官网及其余所尝试官方页面的直接读取被云端出站策略以 403 拒绝，采纳依据为已完整读取的 GitHub 资料与可靠上游合并记录，未声称完成官网实时核实或真机联网验证。

2026-10-11 根据 v2fly 已合并的 [Syntx.AI 分类更新](https://github.com/v2fly/domain-list-community/pull/4119)和[固定提交清单](https://github.com/v2fly/domain-list-community/blob/8e95517c1669d6186159c0c87edbb55e22c40bd9/data/category-ai-!cn)，新增 `syntx.ai` 后缀。主域及多级子域均匹配，`not-syntx.ai` 和 `syntx.ai.example.org` 不匹配。其官网的直接读取被云端出站策略以 403 拒绝，采纳依据为可信上游合并记录，未声称完成官网实时核实或真机联网验证；五端 Lazy 配置保持不变。

2026-10-08 根据用户确认的 Meta AI / Muse 连接日志，补充四个此前在五端均未命中 AI 的精确主机；同时核对 Meta 官方项目中的 Llama、AI at Meta 和 SAM 入口，共新增 9 条规则：

| 功能 / 服务 | 新增规则 | 核对来源 |
|---|---|---|
| Meta AI / Muse 登录与 Graph 依赖 | 精确匹配 `auth.meta.com`、`accountscenter.meta.com`、`meta.graph.meta.com`、`ar.graph.meta.com` | 用户实际连接日志及用途确认；[v2fly Meta 分类](https://github.com/v2fly/domain-list-community/blob/e84921279c9142434b43cb84ec6c17f987e025df/data/meta)和 [blackmatrix7 Facebook 分类](https://github.com/blackmatrix7/ios_rule_script/blob/036c097eb26c6a52c4f04ebcb6633043cb942669/rule/Clash/Facebook/Facebook.yaml)核对 Meta 域名归属；[Meta 官方账号入口代码](https://github.com/meta/bunnylol.rs/blob/6dd85e0d8bac26d173cb98ded564a3e7e2fbe91f/src/commands/meta.rs)和 [Project Aria 登录资料](https://github.com/facebookresearch/projectaria_tools/blob/cb1fe5f793b98018d17a0358f3a0aed91cc4025f/website/docs-ark/support/projectaria_login.mdx)说明账号中心和 Graph 接口也被其他功能共用 |
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

2026-10-28 在固定 master 的隔离云端快照实际运行通过：三个生成器 `--check`、69 份 YAML 严格解析、4 份 INI 段结构检查、90 份服务规则与源清单比对，以及五端 Lazy 的 DNS、订阅占位、旁路、五个地区手动组与 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接、策略引用及循环检查。AI 每端为 46 条精确主机、122 条后缀，共 168 条；通过 4,370 个域名断言、300 个地区筛选断言、110 个 AI 优先路径检查、90 个功能 URL 正例和 45 个反例，包含用户 Meta / Sites 固定回归。新增 AI 另通过 150 个后缀边界和 75 个 Workspace 精确主机断言；Spotify 通过 35 个精确主机 / 额外子域 / 伪后缀断言及五端可选路由、AI 隔离和 Lazy 范围检查。此前 Claude、Magnific、Twitch、SteamOS 和 Prime Video 范围检查继续通过，`git diff --check` 通过。

本轮完整读取并核对哈希的资料包括 50 份上游清单、4 份合并提交清单及 34 份官方 GitHub 文件，核实 4 条相关合并记录。官方 Codex 执行服务已拆分到新模块，本轮沿新位置核对，未发现需新增的生产服务域名。遥测标注变化未自动新增规则，也未将共享 CDN 父域类型变化直接照搬为宽泛后缀。28 次官网 / 官方文档 / Sites / API / 新增主机直接请求均被出站策略以 403 拒绝；没有客户端可执行程序，未进行原生导入、真实节点 / DNS / QUIC / 登录 / 播放或下载测试，也无法读取手机端规则缓存和当前 AI 组选择。五端 Lazy / Routing 配置、生成器及其他服务保持不变。

2026-10-23 基于固定 master 的隔离云端快照实际运行通过：三个生成器 `--check`、69 份 YAML 严格解析、4 份 INI 段结构检查、90 份服务规则与源清单比对，以及五端 Lazy 的 DNS、订阅占位、旁路、五个地区手动组与 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接、策略引用及循环检查。AI 保持 28 类、159 条规则，4,145 个域名断言、300 个地区筛选断言、65 个 AI 优先路径检查、90 个功能 URL 正例和 45 个反例通过，包含用户 Meta / Sites 固定回归。既有 Claude / Magnific、Twitch 和 Prime Video 精确范围检查继续通过；SteamOS 新后缀另通过 40 个主域 / 官方服务子域 / 多级子域 / 伪后缀断言，以及五端 Common 可选路由、AI 隔离和 Lazy 范围检查，`git diff --check` 通过。

本轮完整读取并核对哈希的资料包括 50 份上游清单、一份合并提交清单、15 份原有官方 GitHub 文件及 5 份 Valve 官方文件。上游只有 Steam 新增后缀；两份 Codex 源码有更新，未发现新增服务主机。18 次官网 / 官方文档 / Sites 直接请求均被出站策略以 403 拒绝；没有客户端可执行程序，未进行原生导入、真实节点 / DNS / QUIC / 登录 / 播放或下载测试，也无法读取手机端规则缓存或当前 AI 组选择。此次没有发现需要改动五端 Lazy 的可证实问题，AI、Lazy / Routing 配置和生成器保持不变。

2026-10-21 基于固定 master 的隔离云端快照实际运行通过：三个生成器 `--check`、69 份 YAML 严格解析、4 份 INI 段结构检查、90 份服务规则与源清单比对，以及五端 Lazy 的 DNS、订阅占位、旁路、五个地区手动组与 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接、策略引用及循环检查。AI 每端现为 43 条精确主机、116 条后缀，共 159 条；通过 4,145 个域名断言、300 个地区筛选断言、65 个 AI 优先路径检查、90 个功能 URL 正例和 45 个反例，包含用户 Meta / Sites 固定回归。十条新增后缀另通过 250 个主域 / 多级子域 / 伪后缀断言；Twitch CDN 通过 35 个精确主机 / 额外子域 / 伪后缀断言及五端可选 Common 路由、AI 隔离和 Lazy 范围检查。Prime Video 原有精确范围的 35 个断言与可选路由检查继续通过，`git diff --check` 通过。

本轮完整读取并核对哈希的 50 份上游清单中，Anthropic、AI 分类、OpenAI 追踪项和 Twitch 有变化；15 份官方 GitHub 文件中三份 Codex 源码有更新，没有发现新增服务主机。除 Claude / Magnific AI 规则和 Common 的精确 Twitch 主机外，其他服务、生成器及五端 Lazy / Routing 配置未改动。16 次官网 / 官方文档 / Sites 直接请求均被出站策略以 403 拒绝；没有客户端可执行程序，未进行原生导入、真实节点 / DNS / QUIC / 登录 / 播放测试，也无法读取手机端规则缓存或当前 AI 组选择。

2026-10-19 在固定 master 的独立云端工作区实际运行通过：三个生成器 `--check`、69 份 YAML 严格解析、4 份 INI 段结构检查、90 份服务规则与源清单比对，以及五端 Lazy 的 DNS、订阅占位、旁路、五个地区组、PayPal 限制、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接和策略引用 / 循环检查。AI 维持 27 类、149 条规则，3,895 个域名断言、300 个地区筛选断言、45 个 AI 优先路径检查、90 个功能 URL 正例及 45 个反例均通过，包含 Meta 四个主机和用户 Sites 网站回归。Prime Video 另通过 35 个精确主机 / 额外子域 / 伪后缀断言、5 份可选 Routing 的 PROXY 引用与顺序检查，以及 AI 和 Lazy 范围检查；只有 `amazon.pv-cdn.net` 新增匹配，父域和额外子域未扩大。

本轮完整读取并核对哈希的 50 份上游清单中，只有 Prime Video 新增项；15 份已核对的官方 GitHub 文件内容与上一轮一致。13 次官网 / 官方文档 / Sites 直接请求均被出站策略以 403 拒绝，其中包括 Prime Video 帮助页。未进行客户端原生导入、真实节点 / DNS / QUIC / 登录或播放解锁测试，也无法核实用户手机的规则缓存和当前 AI 策略选择。

2026-10-18 云端环境就绪后实际运行通过：三个生成器的 `--check`、69 份 YAML 严格解析、4 份 Loon / Shadowrocket Lazy / Routing INI 段结构检查、90 份服务规则与源清单比对，以及五端 Lazy 的 DNS、订阅占位、旁路、地区组及 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接、策略引用与循环检查。共通过 3,895 个域名断言、300 个地区筛选断言、45 个 Meta / Sites / Syntx / OpenAI.org / Jev 的 AI 优先路径检查、90 个功能 URL 正例和 45 个测试环境 / 自定义域名 / 伪后缀反例；正例包含本轮新纳入的 `auth.api.openai.org` 测试主机。每端现为 43 条精确域名、106 条后缀规则。两条新增后缀的主域、多级子域匹配，伪后缀不匹配；用户报告的 Sites 网站与 Meta 四个主机固定回归通过。

本轮完整读取并核对哈希的资料包括 50 份可信上游清单、15 份官方 GitHub 文件及两份对应合并提交的完整清单，核实了三条相关合并记录。12 次官网 / 官方文档 / Sites 页面直接请求均被出站策略以 403 拒绝。没有客户端可执行程序，未进行原生导入、实际节点 / DNS / QUIC / 登录测试，无法核实手机端规则缓存和当前 AI 策略选择；结构检查不能代替真机验证。五端 Lazy 和其他服务规则保持不变。

2026-10-11 基于最新 master 的隔离云端快照实际运行通过：三个生成器的 `--check`、69 份 YAML 严格解析、4 份 Loon / Shadowrocket Lazy / Routing INI 段结构检查、90 份服务规则与源清单的语义比对，以及五端 Lazy 的 DNS、订阅占位、旁路、地区组、PayPal 限制、CN 默认 DIRECT、规则顺序、远程链接和策略引用 / 循环检查。共通过 3,845 个域名断言、300 个地区筛选断言和 30 个 Meta / Sites / Syntx 的 AI 优先路径检查；另通过 50 个功能 URL 正例和 30 个测试环境 / 自定义域名 / 伪后缀反例。2026-10-11 当时每端为 43 条精确域名、104 条后缀规则。完整读取的 50 份可信上游清单中，只有 AI 分类新增 Syntx.AI，其他已核对清单内容与上一轮一致。

OpenAI 官方 Codex 源码中的生产端点仍由现有 `chatgpt.com`、`openai.com` 后缀覆盖，包括实时调用路径；[Agent Identity 实现](https://github.com/openai/codex/blob/cc7ba33601286a751477832b01de7b6f8de0dd9c/codex-rs/agent-identity/src/lib.rs)明确将 `auth.api.openai.org` 和 `chatgpt-staging.com` 用于测试环境，2026-10-11 当时未将其加入普通服务规则；2026-10-18 的 `openai.org` 后缀更新已覆盖前者。[OpenAI Sites 官方示例](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/data-analytics/src/analytics-app/handoff.test.mjs)及用户报告的网站均命中 AI，截图中的四个 Meta 主机回归通过。OpenAI、Canvas、Claude、GitHub、PayPal、Meta、Sora、Crixet、Syntx 官网资料及用户 Sites 页面共 10 次直接读取均被出站策略以 403 拒绝；未进行客户端原生导入、实际节点 / DNS / QUIC / 登录测试，也无法读取用户手机的规则缓存和当前策略选择。

2026-10-08 云端环境恢复后实际运行通过：三个生成器的 `--check`、69 份配置与规则 YAML 的严格解析（拒绝重复键）、Loon / Shadowrocket 四份 Lazy / Routing 的 INI 段结构检查、90 份服务规则与源清单的独立语义比对、五端 Lazy 的 DNS / 订阅占位 / 旁路设置、地区筛选样例与 REJECT 默认、PayPal 仅美国手动或 REJECT、CN 默认 DIRECT、LAN → AI → PayPal → GitHub → CN → PROXY 顺序、远程链接对应文件、策略引用及循环检查，以及 `git diff --check`。五端 AI 清单均为 146 条，语义一致；共通过 3,820 个域名匹配断言、300 个地区筛选断言，以及 25 个 Meta / Sites 主机在 AI 优先于 CN / 兜底的路径检查。截图里的四个 Meta 主机在原 master 清单均不匹配，在本次生成规则均匹配；精确主机的额外子域和伪后缀不匹配，`llama.com` 主域、API 与多级子域匹配，整个 Meta / Graph / 演示域名空间未被兜入 AI。GitHub Models 的两个推理路径及用户报告的 `robot-dog-pixel-home.yf233.chatgpt.site` 固定回归通过。源清单无重复或冗余覆盖，其他服务规则和五端 Lazy 配置未变。

2026-10-08 的每份清单包含 43 条精确域名规则、103 条域名后缀规则。YAML / INI 解析及语义检查属于结构验证，不能代替客户端原生导入；未进行五个客户端的真机导入、节点联网、DNS、QUIC 或所有服务登录/语音测试。此次完整读取固定提交下的 50 份可信上游清单及上述 Meta 官方 GitHub 资料。运行环境的出站域名策略拒绝了所尝试 Meta 官网、Llama / SAM / Muse 文档与 Sites 页面的直接访问，未将其标为已完成实时联网验证。地区筛选依赖订阅中的节点名称，不能验证真实出口位置。
