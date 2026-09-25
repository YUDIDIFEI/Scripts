#!/usr/bin/env python3
"""Build complete five-client routing profiles from the published rule lists."""

import argparse
from pathlib import Path

from build_service_rules import BASE, load, ordered_groups

ROOT = Path(__file__).resolve().parents[1]
STREAMING = ("YouTube", "Netflix", "DisneyPlus", "Max", "PrimeVideo", "Spotify", "TikTok")
DEDICATED = ("AI",) + STREAMING
PRIVATE_IPS = (
    ("IP-CIDR", "10.0.0.0/8"),
    ("IP-CIDR", "100.64.0.0/10"),
    ("IP-CIDR", "127.0.0.0/8"),
    ("IP-CIDR", "169.254.0.0/16"),
    ("IP-CIDR", "172.16.0.0/12"),
    ("IP-CIDR", "192.168.0.0/16"),
    ("IP-CIDR6", "fc00::/7"),
    ("IP-CIDR6", "fe80::/10"),
)
SUBSCRIPTION = "https://subscription.example.invalid/REPLACE_WITH_YOUR_SUBSCRIPTION"
TEST_URL = "https://www.gstatic.com/generate_204"


def names():
    return ["AI"] + [group["id"] for group in ordered_groups(load())]


def target(client, name):
    ext = "list" if client in ("Loon", "Shadowrocket") else "yaml"
    return f"{BASE}/rule/{client}/{name}/{name}.{ext}"


def yaml_profile(client):
    stash = client == "Stash"
    lines = [
        "# 完整分流配置。导入前只需将下面的订阅占位链接换成你自己的节点订阅。",
        "# 订阅必须输出与本客户端兼容的节点格式；不要把私人订阅提交到公开仓库。",
        "mode: rule",
        "log-level: warning",
        "ipv6: false",
    ]
    if not stash:
        lines += [
            "mixed-port: 7890",
            "allow-lan: false",
            "external-controller: 127.0.0.1:9090",
            "unified-delay: true",
            "tcp-concurrent: true",
            "profile:",
            "  store-selected: true",
            "  store-fake-ip: true",
        ]
    else:
        lines += ["mixed-port: 7890", "allow-lan: false"]
    lines += [
        "", "dns:",
        "  enable: true",
        "  ipv6: false",
        "  enhanced-mode: fake-ip",
        "  fake-ip-range: 198.18.0.1/16",
        "  fake-ip-filter:",
        "    - '*.lan'",
        "    - '*.local'",
        "  default-nameserver:",
        "    - 223.5.5.5",
        "    - 119.29.29.29",
        "  nameserver-policy:",
        "    '+.local': system",
        "    '+.lan': system",
        "  nameserver:",
        "    - https://doh.pub/dns-query",
        "    - https://dns.alidns.com/dns-query",
    ]
    if not stash:
        lines += [
            "  proxy-server-nameserver:",
            "    - 223.5.5.5",
            "    - 119.29.29.29",
        ]
    lines += ["", "proxy-providers:", "  Nodes:"]
    if not stash:
        lines += ["    type: http"]
    lines += [
        f"    url: {SUBSCRIPTION}",
        "    path: ./providers/Nodes.yaml",
        "    interval: 86400",
    ]
    if not stash:
        lines += [
            "    health-check:",
            "      enable: true",
            f"      url: {TEST_URL}",
            "      interval: 600",
        ]
    lines += [
        "", "proxy-groups:",
        "  - name: AUTO",
        "    type: url-test",
        "    proxies: [REJECT]",
        "    use: [Nodes]",
        f"    url: {TEST_URL}",
        "    interval: 600",
        "  - name: PROXY",
        "    type: select",
        "    proxies: [AUTO, REJECT]",
    ]
    for group in DEDICATED:
        lines += [
            f"  - name: {group}",
            "    type: select",
            "    proxies: [PROXY, DIRECT]",
            "    use: [Nodes]",
        ]
    lines += ["", "rule-providers:"]
    for name in names():
        lines += [f"  {name}:"]
        if not stash:
            lines += ["    type: http", "    proxy: PROXY"]
        lines += [
            "    behavior: classical",
            "    format: yaml",
            f"    url: {target(client, name)}",
            f"    path: ./ruleset/{name}.yaml",
            "    interval: 86400",
        ]
    lines += ["", "rules:", "  - DOMAIN-SUFFIX,local,DIRECT"]
    for kind, value in PRIVATE_IPS:
        lines.append(f"  - {kind},{value},DIRECT,no-resolve")
    for name in names():
        policy = name if name in DEDICATED else "PROXY"
        lines.append(f"  - RULE-SET,{name},{policy}")
    lines += ["  - GEOIP,CN,DIRECT", "  - MATCH,PROXY"]
    return "\n".join(lines) + "\n"


def loon_profile():
    lines = [
        "# 完整分流配置。导入前将 Nodes 订阅占位链接换成你的 Loon 节点订阅。",
        "# 无需远程解析器、脚本、证书或 MITM。",
        "[General]",
        "ip-mode = ipv4-preferred",
        "dns-server = system",
        f"proxy-test-url = {TEST_URL}",
        "internet-test-url = http://connectivitycheck.platform.hicloud.com/generate_204",
        "test-timeout = 5",
        "interface-mode = auto",
        "udp-fallback-mode = REJECT",
        "allow-wifi-access = false",
        "skip-proxy = 10.0.0.0/8,100.64.0.0/10,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8,localhost,*.local",
        "bypass-tun = 10.0.0.0/8,100.64.0.0/10,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8,169.254.0.0/16,localhost,*.local",
        "", "[Proxy]", "", "[Remote Proxy]",
        f"Nodes = {SUBSCRIPTION},enabled=true",
        "", "[Proxy Group]",
        f"AUTO = url-test,Nodes,url={TEST_URL},interval=600,tolerance=100",
        "PROXY = select,AUTO,Nodes,REJECT",
    ]
    for group in DEDICATED:
        lines.append(f"{group} = select,PROXY,DIRECT")
    lines += ["", "[Rule]", "DOMAIN-SUFFIX,local,DIRECT"]
    for kind, value in PRIVATE_IPS:
        lines.append(f"{kind},{value},DIRECT,no-resolve")
    lines += ["GEOIP,CN,DIRECT", "FINAL,PROXY", "", "[Remote Rule]"]
    for name in names():
        policy = name if name in DEDICATED else "PROXY"
        lines.append(f"{target('Loon', name)},policy={policy},tag={name},enabled=true")
    return "\n".join(lines) + "\n"


def shadowrocket_profile():
    lines = [
        "# 完整分流配置。先在 Shadowrocket 首页加入节点订阅并选一个可用节点。",
        "# PROXY 指首页当前节点；无脚本、重写、MITM 或证书要求。",
        "[General]",
        "dns-server = https://doh.pub/dns-query,https://dns.alidns.com/dns-query,223.5.5.5,119.29.29.29",
        "fallback-dns-server = system",
        "ipv6 = true",
        "prefer-ipv6 = false",
        "private-ip-answer = true",
        "hijack-dns = 8.8.8.8:53,8.8.4.4:53",
        "udp-policy-not-supported-behaviour = REJECT",
        "skip-proxy = 10.0.0.0/8,100.64.0.0/10,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8,localhost,*.local",
        "tun-excluded-routes = 10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.168.0.0/16",
        "", "[Proxy]", "", "[Proxy Group]",
    ]
    for group in DEDICATED:
        lines.append(f"{group} = select,PROXY,DIRECT")
    lines += ["", "[Rule]", "DOMAIN-SUFFIX,local,DIRECT"]
    for kind, value in PRIVATE_IPS:
        # Shadowrocket's IP-CIDR rule accepts both IPv4 and IPv6 addresses.
        lines.append(f"IP-CIDR,{value},DIRECT,no-resolve")
    for name in names():
        policy = name if name in DEDICATED else "PROXY"
        lines.append(f"RULE-SET,{target('Shadowrocket', name)},{policy}")
    lines += ["GEOIP,CN,DIRECT", "FINAL,PROXY"]
    return "\n".join(lines) + "\n"


def egern_profile():
    lines = [
        "# 完整分流配置。导入前将订阅占位链接换成 Egern 兼容的节点订阅。",
        "# 不含脚本、模块、MITM、证书或 Wi-Fi 对外代理。",
        "allow_external_connections: false",
        "bypass_tunnel_proxy:",
        "  - '*.local'",
        "  - '*.lan'",
        "  - 10.0.0.0/8",
        "  - 100.64.0.0/10",
        "  - 127.0.0.0/8",
        "  - 169.254.0.0/16",
        "  - 172.16.0.0/12",
        "  - 192.168.0.0/16",
        "real_ip_domains:",
        "  - '*.local'",
        "  - '*.lan'",
        f"proxy_latency_test_url: {TEST_URL}",
        "direct_latency_test_url: https://www.qq.com",
        "dns:",
        "  bootstrap:",
        "    - system",
        "  upstreams:",
        "    default:",
        "      - https://doh.pub/dns-query",
        "      - https://dns.alidns.com/dns-query",
        "  forward:",
        "    - domain_suffix:",
        "        match: local",
        "        value: bootstrap",
        "    - domain_suffix:",
        "        match: lan",
        "        value: bootstrap",
        "    - domain_wildcard:",
        "        match: '*'",
        "        value: default",
        "policy_groups:",
        "  - external:",
        "      name: Nodes",
        "      type: auto_test",
        "      urls:",
        f"        - {SUBSCRIPTION}",
        "      update_interval: 86400",
        "      interval: 600",
        "  - select:",
        "      name: PROXY",
        "      policies: [Nodes, REJECT]",
    ]
    for group in DEDICATED:
        lines += [
            "  - select:",
            f"      name: {group}",
            "      policies: [PROXY, DIRECT]",
        ]
    lines += ["rules:", "  - domain_suffix:", "      match: local", "      policy: DIRECT"]
    for kind, value in PRIVATE_IPS:
        rule = "ip_cidr6" if kind == "IP-CIDR6" else "ip_cidr"
        lines += [f"  - {rule}:", f"      match: {value}", "      policy: DIRECT", "      no_resolve: true"]
    for name in names():
        policy = name if name in DEDICATED else "PROXY"
        lines += [
            "  - rule_set:",
            f"      name: {name}",
            f"      match: {target('Egern', name)}",
            f"      policy: {policy}",
            "      update_interval: 86400",
        ]
    lines += ["  - geoip:", "      match: CN", "      policy: DIRECT",
              "  - default:", "      policy: PROXY"]
    return "\n".join(lines) + "\n"


def output_files():
    return {
        "config/Clash/Lazy.yaml": yaml_profile("Clash"),
        "config/Stash/Lazy.yaml": yaml_profile("Stash"),
        "config/Loon/Lazy.lcf": loon_profile(),
        "config/Shadowrocket/Lazy.conf": shadowrocket_profile(),
        "config/Egern/Lazy.yaml": egern_profile(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for rel, content in output_files().items():
        path = ROOT / rel
        encoded = content.encode("utf-8")
        if args.check:
            if not path.is_file() or path.read_bytes() != encoded:
                raise SystemExit(f"Outdated or missing: {rel}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(encoded)
    print("CHECK OK" if args.check else "BUILD OK", "5 complete profiles")


if __name__ == "__main__":
    main()
