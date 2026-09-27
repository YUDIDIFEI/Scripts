# 中国广电 Egern 小组件

**原作：脑瓜 / anker1209；Egern 适配：YUDIDIFEI。** [原 Scriptable 脚本](https://github.com/anker1209/Scriptable/blob/main/scripts/ChinaBroadnet_2024.js) · [广电登录获取教程来源](https://github.com/wuhuhuuuu/study/tree/main/Scripts/ChinaBroadnet)（目前为 livinmoon/study）· [完整来源与作者声明](NOTICE.md)

仅用于非商业学习研究，修改套用请保留原作署名及来源。该适配不是广电官方组件，也不代表原作者维护 Egern 版。

显示话费余额、剩余流量、剩余语音、剩余比例与更新时间。原生 Egern JS，无需 Scriptable、DmYY 或 BoxJs；登录获取、参数、样式、清除登录都在 Egern 内操作。**v1.0.0：17 项本地测试通过，已检查 96 个合成布局；实际账号查询和 Egern / iPhone 运行仍需实机确认。**

## 安装和获取登录

1. 在 **Egern → 工具 → 模块 → +** 导入[中国广电小组件模块](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/ChinaBroadnet/china-broadnet.yaml)。
2. 再导入[中国广电登录获取模块](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/ChinaBroadnet/china-broadnet-capture.yaml)，仅在需要获取登录时启用。它只声明 `wx.10099.com.cn` 的 HTTPS 解密和原作查询路径的请求脚本；需要 Egern 的 MITM 证书已在手机安装并信任。
3. 开启 Egern 连接，在微信的 **“中国广电营业厅”小程序**完成登录，再刷新账户首页或查询一次余额。只登录而未触发查询可能无法获取。
4. Egern 提示“登录参数已保存在 Egern”后，到 **分析 → 小组件画廊 → 中国广电**运行，核对实际余额。通知仅表示参数已保存，是否有效以本次查询为准。
5. 获取完成后关闭 **“中国广电登录获取”模块**，保留 **“中国广电小组件”模块**。登录失效时再临时开启获取模块，回营业厅重新登录并刷新。
6. iPhone 主屏幕添加 Egern 小组件，编辑小组件并选择“中国广电”。支持小、中尺寸；画廊大尺寸另有适配。

原始链接，便于复制：

```text
https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/ChinaBroadnet/china-broadnet.yaml
https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/ChinaBroadnet/china-broadnet-capture.yaml
```

获取脚本只保存请求头 `access` 和请求 JSON 的 `data`，不会获取微信登录密码、短信验证码或其他网站 Cookie。凭据仅写入 Egern 的脚本存储，查询时只发送至固定的 `https://wx.10099.com.cn/contact-web/api/busi/qryUserInfo`；不在通知、日志、小组件或本仓库显示凭据。MITM 是否能捕获该版本的小程序请求仍取决于手机环境，不绕过证书校验或应用权限。

## 全部在 Egern 设置

编辑 **中国广电小组件**模块，在参数 / Env 中设置：

| 设置 | Env 名称 | 默认及说明 |
| --- | --- | --- |
| 账号备注 | `ACCOUNT_NAME` | 我的广电；中、大尺寸显示 |
| 小尺寸样式 | `STYLE` | 彩色条目；另有图标卡片、双环仪表、余额清单、经典圆环、简洁文字 |
| 刷新分钟数 | `REFRESH_MINUTES` | 60，范围 15–1440；系统可能延迟刷新 |
| 话费颜色 | `FEE_COLOR` | 留空使用蓝色；自定义格式 `#RRGGBB` |
| 流量颜色 | `FLOW_COLOR` | 留空使用绿色 |
| 语音颜色 | `VOICE_COLOR` | 留空使用橙色 |
| 手动 access | `ACCESS` | 自动获取后留空；手动时两项一起填 |
| 手动 data | `BODY` | 填 JSON 的 `data` 字符串，或完整含 data 的 JSON 请求体 |
| 登录操作 | `ACTION` | 正常显示 / 清除登录 |

Egern 的 `default_value` 只是输入提示，脚本自身提供默认值。若测试版未显示参数控件，可在 Env 手动添加表中的英文键名，大小写保持一致。

浅色 / 深色跟随系统；原作六种小尺寸布局按 Egern 原生控件重新适配，并非逐像素复制。中尺寸与原作一样固定为话费、流量、语音三列。更新直接使用 Egern 的远程模块和远程脚本更新操作，不再使用 Scriptable 中的更新菜单。

### 手动填写与存储读取问题

如未能自动获取，或收到保存通知后组件仍提示未登录，可通过 Egern 自己的请求查看功能读取上述**同一次查询**的 `access` 请求头和请求体 `data`，在模块中成对填写 `ACCESS` / `BODY`。不要填整串 Cookie，也不要把值发给他人或提交到 GitHub。手动两项优先于自动获取；只填一项会提示错误，不与旧登录拼接。切回自动获取时把两项同时清空。

官方文档提供脚本持久化存储，但未明确所有版本跨脚本共享的细节。本实现用同一脚本文件和固定存储键连接获取与显示；在 2.21.0 (788) 的具体效果仍需实机验证。手动参数方式不依赖跨脚本读取。

默认管理一个账号，后一次成功获取的完整参数会替换前一组。不会从响应中猜测手机号或自动切换账号。

### 清除登录

先关闭获取模块，将“登录操作”选为 **清除登录**，运行小组件直到显示清除结果。它只删除本组件的存储键，不删除其他脚本数据。手动填写过的 `ACCESS` / `BODY` 需自行清空，再把“登录操作”切回 **正常显示**。

### 如需自行添加可排序的小组件

先在 **工具 → 脚本 → +** 新建独立的“通用”脚本，远程 URL 填[china-broadnet.js](https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master/widgets/Egern/ChinaBroadnet/china-broadnet.js)，超时设为 15 秒。再到小组件画廊点“+”，选择该独立脚本。参数填在这个脚本的 Env，优先使用手动 `ACCESS` / `BODY`，不依赖模块脚本能否被选中或共享存储。实际排序由客户端控制。

## 数据口径与失败处理

- 沿用原作：话费为 `fee / 100` 元，流量为 `flow / 1048576` GB，语音为 `voice` 分钟；圆环分别使用 `flow / flowAll`、`voice / voiceAll`。
- 真实零余额会显示零，缺失、空字符串、无效负额度等显示 `—`。欠费可显示负话费；不把缺失数据补成零。
- 总量缺失、为零或小于剩余额度时，剩余比例未知，不画误导性的百分比；不据此更改运营商返回的有效剩余额度。
- 查询失败、登录失效或无有效数据时显示明确提示，不把旧余额标为刚更新，也不显示伪造的成功数据。
- 默认查询走 Egern `DIRECT`，10 秒请求超时，不携带全局 Cookie，不跟随重定向。余额仅供查看，以营业厅为准；没有充值、订购、退订或其他账户修改功能。

## 本地验证

```sh
cd widgets/Egern/ChinaBroadnet
npm ci --ignore-scripts
npm run check
npm test
npm run preview
```

测试使用合成凭据与响应，不访问真实账户接口；`artifacts/preview.html` 为模拟布局，不是 Egern 原生截图。`node_modules`、预览与研究资料不发布。详细记录见 [IMPLEMENTATION.md](IMPLEMENTATION.md)。

## 原作者声明

原创 UI，修改套用请注明来源；仅用于学习与研究，不得用于商业用途；作者不承担使用后果；涉及版权或侵权问题请联系原作者，验证后处理。上述用户提供的发布声明及原作、重写、DmYY 来源完整保存在 [NOTICE.md](NOTICE.md)。
