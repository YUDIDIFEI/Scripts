# Egern 节点检测小组件实施记录

## Research（2026-09-27）

- Egern 官方小组件使用 generic 脚本返回 Widget DSL；模块可声明 widgets 和 env_schema。
- `ctx.http.get/post` 的 `policy` 指定请求策略，`ctx.env` 接收模块参数。公开 API 未提供枚举或锁定当前组成员的方法。
- 上游入口：MaYIHEI/paperclip 的 loon/ipquality-web-test/ipquality-web-test.lpx；核心脚本固定在提交 eaa04fe0a9f37ccfafdd11930d28fd5ff3f04718。
- IPPure 官方公开 API 提供当前出口、ASN、位置、住宅/广播标记与风险分；IPv6 不提供有效风险评分。
- ipapi.is 2026-09 文档：匿名响应为扁平基础字段，完整响应需 Key；不得把缺失风险字段转换为 false/0。

## Plan

1. 编写无运行时依赖的 Egern 原生 JS 与 YAML 模块，保留来源说明。
2. 使用明确指定的策略请求 IPPure、ipapi.is、ipify；按实际出口匹配数据。
3. 移植轻量媒体页面探测，保留成功、明确受限、未知的区别。
4. 完成针对性测试、DSL 结构检查、模块配置检查；最后上传用户指定 GitHub 仓库并核对原始链接。

## Task Definition

- 检测用户配置策略组当次请求使用的出口，不遍历组内所有节点、不切换全局策略。
- 配置项：检测策略组（必填）、媒体检测、隐藏 IP、刷新间隔、可选 ipapi Key。
- 首版：出口 IP/地区/ASN、IP 类型、IPPure 风险分、ipapi 网络滥用比例（有字段时）、ChatGPT Web/Netflix/YouTube Premium/TikTok/Prime Video/Reddit 页面探测。
- 不迁移网页报告、MTR、第三方探针任务、测速及依赖内嵌客户端令牌的 Disney+ 探测。
- 不缓存旧检测结论；配置为空时不发请求；同名策略组换节点不会沿用上轮评分。
- 不同探针 IP 不一致时显示多出口，停止合并风险与媒体结论。检测前后复核只作为一致性线索，不能证明组成员未切换。
- 页面可达不等于登录后可播放/购买/使用账号。403、反爬、异常 HTML、超时不判为解锁。
- Windows 本地模拟不能代替 Egern/iOS 实机对策略路由、刷新及布局的验证。

## Layout

- 使用 Egern 原生文本、SF Symbol 与横纵 stack，无网页运行时或外部图片。
- 浅色白底 #FFFFFF、深色 #17212B；主文字 #152E40/#F1F6FA；次文字 #546776/#B0C0CF；强调 #096D9C/#72C7EC；警示 #986000/#FFCF7A。
- 系统字体承载中文，IP 使用等宽字体以方便核对；策略组与 IP 优先显示。小尺寸精简摘要，中尺寸分为出口与媒体两列，大尺寸显示详细来源与警示。
- 失败/多出口优先于分数展示，不用装饰性仪表盘制造综合评分。

## Sources

- https://egernapp.com/zh-CN/docs/configuration/widgets/
- https://egernapp.com/zh-CN/docs/configuration/modules/
- https://egernapp.com/zh-CN/docs/javascript-api/
- https://egernapp.com/zh-CN/docs/configuration/policy_groups/
- https://ippure.com/MyIP-Info-API
- https://ippure.com/faq
- https://ipapi.is/developers.html
- https://www.ipify.org/

## Implementation

- 已完成 native Egern 脚本、模块设置、使用说明、来源许可及可复现测试。
- `npm run check`：通过。
- `npm test`：26 项通过；包括真实 YAML 解析与配置引用、策略参数、并发上限、总时限、空配置、换节点、多出口、失败/限流、字段缺失、IPv6、隐藏 IP、六个媒体解析器及全部七种 Widget Family 的 DSL 结构。
- `node tools/preview.mjs`：成功生成模拟布局。在内置浏览器核对小/中/大三种尺寸、深浅色、正常/多出口/未配置/失败共 24 种场景；近似布局未发现纵向溢出。不是 Egern 原生渲染验收。
- `node tools/smoke.mjs --live`：2026-09-27T04:34:18Z 在本机网络请求三个公开出口接口。IPPure 与 ipify 成功且出口一致，IPPure 评分字段可解析；ipapi 在 6 秒上限内未完成。部分来源失败被保留为未知，不影响有效来源显示。输出去除了真实 IP，且未发布网络返回内容。
- 本地未执行真实媒体站点批量探测、未使用个人 ipapi Key、未执行 iPhone / Egern 策略路由、参数 UI、系统刷新、原生布局测试。
- 发布目标为用户指定的 `YUDIDIFEI/Scripts`，分支 `master`，目录 `widgets/Egern/IPQuality/`。模块采用该目录下脚本的绝对 Raw URL；仓库首页提供模块与说明入口。发布验收需核对远程 YAML / JS 内容与本地文件一致。

## 自建入口调整（2026-09-27）

- 用户反馈 Egern 2.21.0 (788) 测试版中的模块小组件无法拖动。公开小组件配置只有名称、脚本引用和环境变量等字段，没有排序控制接口，不能通过添加未文档化字段声称修复客户端拖动。
- 新增 `ip-quality-manual.yaml`，保留同一检测脚本与参数设置，不声明 `widgets`，脚本名称为 `ip-quality-manual`。用户在画廊手动创建普通小组件；文档同时提供独立远程脚本方式，以应对脚本选择器不展示模块脚本的情况。
- 原模块入口保持可用；确认新入口正常后再停用旧模块。没有改动策略组、路由或检测逻辑。
- 官方 `env_schema.options` 支持固定列表选择器，公开 API 未找到读取当前配置策略组列表的方法。本次自建入口仍使用已有 `POLICY` 参数；固定下拉菜单需要已确认的组名，不能声称会自动同步手机策略组。
- `node --test test/module.test.mjs`：2 项通过，核对原模块、自建入口的 YAML、脚本引用和参数一致性，以及自建入口未创建模块小组件、未添加策略或路由。
- 待实机验证：自建条目的拖动与顺序保存、能否选择模块脚本、模块参数传入，以及独立脚本入口。自建入口是安装方式调整，不是对 788 客户端排序逻辑的修复。
