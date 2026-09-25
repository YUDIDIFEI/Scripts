#!/usr/bin/env python3
"""Build service and LAN/CN lists plus five routing include examples."""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master"
CLIENTS = ("Clash", "Stash", "Loon", "Shadowrocket", "Egern")
PAYPAL_POLICY = "美国手动"
CN_POLICY = "国内分流"
LAN_IPV4 = (
    "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16",
    "172.16.0.0/12", "192.0.0.0/24", "192.168.0.0/16", "198.18.0.0/15",
)
LAN_IPV6 = ("::1/128", "fc00::/7", "fe80::/10")
DOMAIN = re.compile(r"(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


def load():
    data = json.loads((ROOT / "sources/foreign-services.json").read_text(encoding="utf-8"))
    ids = set()
    rules = set()
    for group in data["groups"]:
        name = group["id"]
        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", name) or name in ids:
            raise ValueError(f"Invalid or duplicate group: {name}")
        ids.add(name)
        if group["tier"] not in ("individual", "combined") or not group["source"]:
            raise ValueError(f"Invalid group metadata: {name}")
        for field in ("domains", "suffixes"):
            if len(group[field]) != len(set(group[field])):
                raise ValueError(f"Duplicate in {name}/{field}")
            group[field].sort()
            for domain in group[field]:
                if not DOMAIN.fullmatch(domain):
                    raise ValueError(f"Invalid domain: {name}/{domain}")
                key = (field, domain)
                if key in rules:
                    raise ValueError(f"Duplicate between groups: {key}")
                rules.add(key)
        for domain in group["domains"]:
            if any(domain == suffix or domain.endswith("." + suffix) for suffix in group["suffixes"]):
                raise ValueError(f"Redundant exact domain: {name}/{domain}")
    if [g["id"] for g in data["groups"] if g["tier"] == "combined"] != ["Common"]:
        raise ValueError("Expected one Common combined group")
    return data


def ordered_groups(data):
    # Wide domains need to follow their service-specific subdomains.
    groups = [g for g in data["groups"] if g["id"] not in ("Google", "Microsoft", "Common")]
    groups += [next(g for g in data["groups"] if g["id"] == name) for name in ("Google", "Microsoft", "Common")]
    return groups


def rules_for(group):
    return [f"DOMAIN,{d}" for d in group["domains"]] + [f"DOMAIN-SUFFIX,{d}" for d in group["suffixes"]]


def policy_for(name):
    return PAYPAL_POLICY if name == "PayPal" else "PROXY"


def output_files(data):
    files = {}
    for client in CLIENTS:
        # The Clash/Stash profiles use 198.18.0.1/16 for Fake IP answers.
        ipv4 = [network for network in LAN_IPV4
                if network != "198.18.0.0/15" or client not in ("Clash", "Stash")]
        if client == "Egern":
            files["rule/Egern/LAN/LAN.yaml"] = (
                "# LAN and special-purpose addresses; assign DIRECT in the calling profile.\n"
                "no_resolve: true\n"
                "domain_suffix_set:\n  - local\n"
                "ip_cidr_set:\n" + "\n".join(f"  - {network}" for network in ipv4) + "\n"
                "ip_cidr6_set:\n" + "\n".join(f'  - "{network}"' for network in LAN_IPV6) + "\n"
            )
            files["rule/Egern/CN/CN.yaml"] = "# China GeoIP; assign 国内分流 in the calling profile.\ngeoip_set:\n  - CN\n"
            continue
        ipv6_kind = "IP-CIDR" if client == "Shadowrocket" else "IP-CIDR6"
        lan_rules = (["DOMAIN-SUFFIX,local"]
                     + [f"IP-CIDR,{network},no-resolve" for network in ipv4]
                     + [f"{ipv6_kind},{network},no-resolve" for network in LAN_IPV6])
        header = f"# {client} LAN and special-purpose addresses; assign DIRECT in the calling profile.\n"
        if client == "Loon":
            header += "# Includes the existing local bypasses and the screenshot's LAN ranges.\n"
        if client in ("Clash", "Stash"):
            files[f"rule/{client}/LAN/LAN.yaml"] = header + "payload:\n" + "\n".join(f"  - {rule}" for rule in lan_rules) + "\n"
            files[f"rule/{client}/CN/CN.yaml"] = f"# {client} China GeoIP; assign 国内分流 in the calling profile.\npayload:\n  - GEOIP,CN\n"
        else:
            files[f"rule/{client}/LAN/LAN.list"] = header + "\n".join(lan_rules) + "\n"
            if client == "Loon":
                files["rule/Loon/CN/CN.list"] = "# Loon China GeoIP; assign the 国内分流 policy in the calling profile.\nGEOIP,CN\n"
    for group in data["groups"]:
        name = group["id"]
        rule_lines = rules_for(group)
        header = (
            f"# {group['name']} - overseas routing rules\n"
            f"# Updated: {data['updated']} | Rules: {len(rule_lines)}\n"
            "# Generated from sources/foreign-services.json; edit the source manifest.\n"
            "# Source and scope: README.md | License: THIRD_PARTY_NOTICES.md\n"
        )
        yaml = header + "payload:\n" + "\n".join("  - " + line for line in rule_lines) + "\n"
        plain = header + "\n".join(rule_lines) + "\n"
        egern = header
        for field, section in (("domains", "domain_set"), ("suffixes", "domain_suffix_set")):
            if group[field]:
                egern += section + ":\n"
                egern += "\n".join("  - " + d for d in group[field]) + "\n"
        for client in ("Clash", "Stash"):
            files[f"rule/{client}/{name}/{name}.yaml"] = yaml
        for client in ("Loon", "Shadowrocket"):
            files[f"rule/{client}/{name}/{name}.list"] = plain
        files[f"rule/Egern/{name}/{name}.yaml"] = egern

    order = ordered_groups(data)
    for client in CLIENTS:
        ext = "list" if client in ("Loon", "Shadowrocket") else "yaml"
        url = lambda name: f"{BASE}/rule/{client}/{name}/{name}.{ext}"
        ai_url = f"{BASE}/rule/{client}/AI/AI.{ext}"
        if client in ("Clash", "Stash"):
            providers = ["# Merge these entries into existing proxy-groups, rule-providers and rules sections.",
                         "# Replace PROXY with an existing proxy policy group if needed.",
                         "# PayPal requires an existing 美国手动 policy group with a US node.",
                         "proxy-groups:",
                         f"  - name: {CN_POLICY}",
                         "    type: select",
                         "    proxies: [DIRECT, PROXY]",
                         "", "rule-providers:"]
            for name, target in [("LAN", url("LAN")), ("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order] + [("CN", url("CN"))]:
                providers.append(f"  {name}:")
                if client == "Clash":
                    providers.append("    type: http")
                providers.extend(["    behavior: classical", "    format: yaml",
                                  f"    url: {target}", f"    path: ./ruleset/{name}.yaml",
                                  "    interval: 86400"])
            providers += ["", "rules:", "  - RULE-SET,LAN,DIRECT"]
            providers += [f"  - RULE-SET,{g},{policy_for(g)}" for g in ["AI"] + [x["id"] for x in order]]
            providers += [f"  - RULE-SET,CN,{CN_POLICY}", "  - MATCH,PROXY"]
            files[f"config/{client}/Routing.yaml"] = "\n".join(providers) + "\n"
        elif client == "Loon":
            lines = ["# Merge into existing sections; PROXY must name an existing policy.",
                     "# PayPal requires an existing 美国手动 policy group with a US node.",
                     "[Proxy Group]", f"{CN_POLICY} = select,DIRECT,PROXY", "",
                     "[Remote Rule]",
                     f"{url('LAN')}, policy=DIRECT, tag=LAN, enabled=true"]
            lines += [f"{u}, policy={policy_for(name)}, tag={name}, enabled=true" for name, u in
                      [("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order]]
            lines += [f"{url('CN')}, policy={CN_POLICY}, tag=CN, enabled=true",
                      "", "[Rule]", "FINAL,PROXY"]
            files["config/Loon/Routing.lcf"] = "\n".join(lines) + "\n"
        elif client == "Shadowrocket":
            lines = ["# Merge into the existing [Rule] section; PROXY must name an existing policy.",
                     "# PayPal requires an existing 美国手动 policy group with a US node.",
                     "[Proxy Group]", f"{CN_POLICY} = select,DIRECT,PROXY,policy-select-name=DIRECT", "",
                     "[Rule]", f"RULE-SET,{url('LAN')},DIRECT"]
            lines += [f"RULE-SET,{u},{policy_for(name)}" for name, u in
                      [("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order]]
            lines += [f"GEOIP,CN,{CN_POLICY}", "FINAL,PROXY"]
            files["config/Shadowrocket/Routing.conf"] = "\n".join(lines) + "\n"
        else:
            lines = ["# Merge these items into your existing policy_groups and rules lists.",
                     "# PROXY and 美国手动 must name existing Egern policies; select a US node for PayPal.",
                     "policy_groups:", "  - select:", f"      name: {CN_POLICY}",
                     "      policies: [DIRECT, PROXY]", "rules:"]
            entries = [("LAN", url("LAN"), "DIRECT"), ("AI", ai_url, "PROXY")]
            entries += [(g["id"], url(g["id"]), policy_for(g["id"])) for g in order]
            entries.append(("CN", url("CN"), CN_POLICY))
            for name, target, policy in entries:
                lines += ["  - rule_set:", f"      name: {name}", f"      match: {target}",
                          f"      policy: {policy}", "      update_interval: 86400", "      disabled: false"]
            lines += ["  - default:", "      policy: PROXY"]
            files["config/Egern/Routing.yaml"] = "\n".join(lines) + "\n"
    return files


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = load()
    files = output_files(data)
    for rel, content in files.items():
        path = ROOT / rel
        encoded = content.encode("utf-8")
        if args.check:
            if not path.is_file() or path.read_bytes() != encoded:
                raise SystemExit(f"Outdated or missing: {rel}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(encoded)
    print(f"{'CHECK' if args.check else 'BUILD'} OK: {len(data['groups'])} groups, {len(files)} files")


if __name__ == "__main__":
    main()
