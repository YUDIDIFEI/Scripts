#!/usr/bin/env python3
"""Build separate overseas service lists and five routing include examples."""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://raw.githubusercontent.com/YUDIDIFEI/Scripts/master"
CLIENTS = ("Clash", "Stash", "Loon", "Shadowrocket", "Egern")
PAYPAL_POLICY = "美国手动"
CN_POLICY = "国内分流"
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
            for name, target in [("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order]:
                providers.append(f"  {name}:")
                if client == "Clash":
                    providers.append("    type: http")
                providers.extend(["    behavior: classical", "    format: yaml",
                                  f"    url: {target}", f"    path: ./ruleset/{name}.yaml",
                                  "    interval: 86400"])
            providers += ["", "rules:"]
            providers += [f"  - RULE-SET,{g},{policy_for(g)}" for g in ["AI"] + [x["id"] for x in order]]
            providers += [f"  - GEOIP,CN,{CN_POLICY}", "  - MATCH,PROXY"]
            files[f"config/{client}/Routing.yaml"] = "\n".join(providers) + "\n"
        elif client == "Loon":
            lines = ["# Merge into existing sections; PROXY must name an existing policy.",
                     "# PayPal requires an existing 美国手动 policy group with a US node.",
                     "[Proxy Group]", f"{CN_POLICY} = select,DIRECT,PROXY", "",
                     "[Remote Rule]"]
            lines += [f"{u}, policy={policy_for(name)}, tag={name}, enabled=true" for name, u in
                      [("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order]]
            lines += ["", "[Rule]", f"GEOIP,CN,{CN_POLICY}", "FINAL,PROXY"]
            files["config/Loon/Routing.lcf"] = "\n".join(lines) + "\n"
        elif client == "Shadowrocket":
            lines = ["# Merge into the existing [Rule] section; PROXY must name an existing policy.",
                     "# PayPal requires an existing 美国手动 policy group with a US node.",
                     "[Proxy Group]", f"{CN_POLICY} = select,DIRECT,PROXY,policy-select-name=DIRECT", "",
                     "[Rule]"]
            lines += [f"RULE-SET,{u},{policy_for(name)}" for name, u in
                      [("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order]]
            lines += [f"GEOIP,CN,{CN_POLICY}", "FINAL,PROXY"]
            files["config/Shadowrocket/Routing.conf"] = "\n".join(lines) + "\n"
        else:
            lines = ["# Merge these items into your existing policy_groups and rules lists.",
                     "# PROXY and 美国手动 must name existing Egern policies; select a US node for PayPal.",
                     "policy_groups:", "  - select:", f"      name: {CN_POLICY}",
                     "      policies: [DIRECT, PROXY]", "rules:"]
            for name, target in [("AI", ai_url)] + [(g["id"], url(g["id"])) for g in order]:
                lines += ["  - rule_set:", f"      name: {name}", f"      match: {target}",
                          f"      policy: {policy_for(name)}", "      update_interval: 86400", "      disabled: false"]
            lines += ["  - geoip:", "      match: CN", f"      policy: {CN_POLICY}",
                      "  - default:", "      policy: PROXY"]
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
