# 第三方来源与许可

本项目的服务域名清单经过人工筛选、补充和格式转换。AI 每组具体来源记录在 sources/foreign-ai.json；流媒体及应用来源记录在 sources/foreign-services.json 的 source 字段，主要对应 v2fly/domain-list-community 的 data/<source> 文件。Common 融合多个服务清单及相应平台官网。文件中的服务域名并不代表与服务商存在关联。

## v2fly/domain-list-community

来源：https://github.com/v2fly/domain-list-community

使用了相关 AI、流媒体及应用的域名条目，原许可保留如下：

MIT License

Copyright (c) 2018-2019 V2Ray

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 其他参考

- blackmatrix7/ios_rule_script：参考 AI 分类及服务端点；仓库说明见 https://github.com/blackmatrix7/ios_rule_script 。
- OpenAI、GitHub、Cursor 等服务的公开网络文档以及各服务官网：用于核对公开端点。
- 用户提供的五份客户端配置仅用于参考结构与接入方式，本项目没有复制其完整配置、脚本、证书或订阅。
