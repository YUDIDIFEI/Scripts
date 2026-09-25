# 境外 AI、流媒体与应用分流规则

## 五端懒人完整配置

以下文件是可整份导入的配置，已经包含策略组、AI 聚合分流、七个流媒体独立策略组、其他应用分流、局域网直连、中国 IP 直连和其余流量代理。Clash、Stash、Loon、Egern 默认自动选择节点；Shadowrocket 使用首页所选节点。AI、流媒体及其他应用都能单独改选策略。已有 `Routing.*` 文件仍是供现有配置合并的接入片段。

| 客户端 | 完整配置直链 | 导入前的唯一节点步骤 |
|---|---|---|
| Clash / Mihomo | [Lazy.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Clash/Lazy.yaml) | 将 `proxy-providers.Nodes.url` 改为 Clash / Mihomo 格式节点订阅 |
| Stash | [Lazy.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Stash/Lazy.yaml) | 将 `proxy-providers.Nodes.url` 改为 Stash 能读取的 YAML 节点订阅 |
| Loon | [Lazy.lcf](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Loon/Lazy.lcf) | 将 `[Remote Proxy]` 的 `Nodes` 地址改为 Loon 节点订阅 |
| Shadowrocket | [Lazy.conf](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Shadowrocket/Lazy.conf) | 在应用首页导入自己的节点订阅并选中可用节点 |
| Egern | [Lazy.yaml](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/config/Egern/Lazy.yaml) | 将 `policy_groups` 内 `Nodes.urls` 改为 Egern 兼容节点订阅 |

四份带 `subscription.example.invalid` 的公开配置是**待填订阅的成品模板**，该地址故意不可用；必须在本机替换后再导入，不能直接把公开直链当成有节点的配置使用。Shadowrocket 配置可直接导入，但仍需自行添加节点。这里没有免费节点，也没有把私人订阅放进公开仓库或交给第三方转换服务。不同客户端所需的订阅输出格式可能不同，不能保证同一条订阅链接在五端通用。

五端均提供 `香港手动`、`台湾手动`、`日本手动`、`新加坡手动`、`美国手动` 五个地区组，按订阅节点名称中的国旗、中文地名或常见英文缩写筛选。AI、其他 16 个主流服务和 `Common` 各有分流组，可选择这五个地区组；PayPal 有独立分流组，仅可选择 `美国手动` 或 `REJECT`。Clash / Stash / Loon / Egern 的 `PROXY` 也可选择地区组。地区组把 `REJECT` 放在首位，避免尚未选定该地区节点时默认直连或跨区；使用前请进入组内手动选择具体节点。筛选只看节点名称，不能验证真实出口地区；若某个地区没有匹配节点，请检查订阅节点名称。

Clash / Stash / Loon 的 `PROXY` 默认走 `AUTO`，Egern 的 `PROXY` 默认走 `Nodes` 自动测速，Shadowrocket 的内置 `PROXY` 使用首页所选节点。19 个分流组中，PayPal 默认选 `美国手动`，其余 18 个默认选 `PROXY`；Clash / Stash 的非 PayPal 分流组还可直接选订阅内节点。PayPal 要正常联网，必须先在 `美国手动` 组中选中实际美国节点。规则顺序为私网直连 → AI → 主流服务（含 PayPal）→ Common → `GEOIP,CN,DIRECT` → 其余代理。分流会从本仓库的远程规则集定期更新；首次使用必须能读取这些规则链接。流媒体地区解锁由节点出口和账号决定，自动测速不保证解锁。

五端配置已对照用户提供的模板检查。Loon 配置明确设置 IP 优先级、DNS、连通性检测、UDP 失效策略及局域网旁路；Shadowrocket 配置加入 DNS 备用、IPv6、私网解析与 TUN 旁路；Clash / Stash 配置加入 DNS 与 Fake IP，并让 `.local` / `.lan` 使用系统 DNS；Clash 的远程规则集更新通过 `PROXY`。Egern 配置加入 DNS、测速地址及局域网旁路。Clash 的系统代理或 TUN 开关仍由所用客户端和操作系统管理，配置不强制启用 TUN。未复制示例模板中的 MITM 证书、重写、脚本、外部订阅转换器或对局域网开放的控制端口。

完整配置由 `python scripts/build_lazy_configs.py` 生成，`python scripts/build_lazy_configs.py --check` 检查是否与清单同步。

## 流媒体与其他应用

AI 维持一份聚合规则，不按平台拆分。提供 17 份主流服务独立规则，以及一份 `Common` 常见服务合并规则；五种客户端各有独立格式，目录为 `rule/<客户端>/<规则名>/<规则名>.<扩展名>`。Clash、Stash、Egern 使用 `.yaml`，Loon、Shadowrocket 使用 `.list`。服务名与次序如下：

| 类别 | 独立规则名 |
|---|---|
| 流媒体 | YouTube、Netflix、DisneyPlus、Max、PrimeVideo、Spotify、TikTok |
| 社交与通讯 | Telegram、X、Facebook、Instagram、WhatsApp、Discord |
| 开发与通用平台 | GitHub、Google、Microsoft |
| 支付 | PayPal |

PayPal 独立规则包含 `paypal.com`、`paypalobjects.com`、`paypal.me` 及已核实的 `paypal.com.cn`、`paypal.com.hk`、`paypal.com.sg`、`paypal.jp` 地区入口；匹配到这份规则的流量在五端完整配置中默认走 `美国手动`，不回退到其他地区或直连。`Common` 合并 Hulu、Twitch、Reddit、Pinterest、Apple TV+、Paramount+、Peacock、Steam、Zoom、Vimeo、SoundCloud，以及部分 Meta 共用 CDN。共用 CDN 不能可靠地区分 Facebook、Instagram 与 WhatsApp，因此放在 `Common`。

五端接入片段分别在 [Clash](config/Clash/Routing.yaml)、[Stash](config/Stash/Routing.yaml)、[Loon](config/Loon/Routing.lcf)、[Shadowrocket](config/Shadowrocket/Routing.conf)、[Egern](config/Egern/Routing.yaml)。将片段合并到现有配置，`PROXY` 必须是已经存在的代理策略；PayPal 行使用 `美国手动`，现有配置也必须有这个组并选中美国节点。规则顺序是 **AI → 独立服务（含 PayPal）→ Common → 中国 IP 直连 → 其余代理**。Clash / Stash 使用 `MATCH,PROXY` 作为最终规则，Loon / Shadowrocket 使用 `FINAL,PROXY`，Egern 使用 `default: policy: PROXY`。已有的宽泛规则及兜底必须检查顺序，不能让它们提前截获这些服务。

清单见 [sources/foreign-services.json](sources/foreign-services.json)，生成命令：

```sh
python scripts/build_service_rules.py
python scripts/build_service_rules.py --check
```

这些是常用服务域名清单，并非完整网络依赖白名单。未将整个云厂商、共享 CDN、ASN、动态 IP 或关键词强制代理；没有节点、DNS 或客户端真机联网验证。流媒体能否解锁还取决于节点地区和服务账号。`GEOIP,CN,DIRECT` 只按目的 IP 判断，不能代替国内域名规则；若现有配置已有国内域名直连规则，应放在兜底之前。来源主要为 [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community/tree/master/data) 中相应服务清单、各平台官网及用户提供的五端格式样例，许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。2026-09-25 已核对新增的五端 PayPal 规则、完整配置与接入片段，并通过全部 95 份生成文件（90 份服务规则、5 份接入片段）的重复生成检查；未进行真机导入。

## AI 聚合规则

为 Clash / Mihomo、Loon、Stash、Shadowrocket、Egern 分别提供可远程引用的规则集。五份文件来自同一清单，当前覆盖 **25 类服务、127 条域名规则**。更新日期：2026-09-24。

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
| OpenAI / ChatGPT / Codex / Sora | 19 |
| Anthropic / Claude | 9 |
| Google Gemini / AI Studio / NotebookLM / Code Assist | 43 |
| GitHub Copilot | 5 |
| Perplexity | 5 |
| xAI / Grok | 3 |
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
| Meta AI | 1 |
| Civitai | 1 |
| Suno | 2 |
| Runway | 2 |
| Character.AI | 1 |
| Stability AI | 1 |

Google AI 包含 Gemini、AI Studio、NotebookLM、Jules、Flow、Opal、Antigravity、Stitch 及 Code Assist 的已收录端点。

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

2026-09-24 已通过：3 份 YAML 严格解析、2 份文本格式检查、五端 127 条规则语义一致性、无重复/冗余覆盖、可重复生成、接入片段及路径检查。每端执行 56 个应匹配案例和 33 个不应匹配案例，共 445 个匹配断言通过。

每份包含 31 条精确域名规则、96 条域名后缀规则。未进行五个客户端的真机导入、节点联网或所有服务登录/语音测试。
