# 国外 AI 分流规则

为 Clash / Mihomo、Loon、Stash、Shadowrocket、Egern 分别提供可远程引用的规则集。五份文件来自同一清单，当前覆盖 **25 类服务、126 条域名规则**。更新日期：2026-09-24。

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
| Anthropic / Claude | 8 |
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

格式依据：[Mihomo](https://wiki.metacubex.one/config/rule-providers/content/)、[Stash](https://stash.wiki/en/rules/rule-set)、[Egern](https://egernapp.com/docs/configuration/rules/)、[Loon 官方示例](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Rule/ExampleRule.list)、[用户提供的 Shadowrocket 配置](https://lowertop.github.io/Shadowrocket/lazy_group.conf)。

维护时编辑清单，再运行以下命令；生成脚本只用 Python 3 标准库，不会自动抓取或自动发布上游变更：

```sh
python scripts/build_ai_rules.py
python scripts/build_ai_rules.py --check
```

客户端的定时刷新读取的是本仓库已发布版本。上游域名变化需要先人工核对，再更新清单并提交。

## 验证状态

2026-09-24 已通过：3 份 YAML 严格解析、2 份文本格式检查、五端 126 条规则语义一致性、无重复/冗余覆盖、可重复生成、接入片段及路径检查。每端执行 42 个应匹配案例和 33 个不应匹配案例，共 375 个匹配断言通过。

每份包含 31 条精确域名规则、95 条域名后缀规则。未进行五个客户端的真机导入、节点联网或所有服务登录/语音测试。
