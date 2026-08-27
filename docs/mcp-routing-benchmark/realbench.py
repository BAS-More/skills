#!/usr/bin/env python3
"""Score gateways on the real 412-tool catalogue.

Usage: realbench.py <label> <url> <tool> <arg> [keywords|text] [extra-json]
"""
import json
import re
import sys
import time

from mcpclient import MCPHTTP, extract_text
from real_catalogue import CATALOGUE, QUERIES

SERVERS = sorted(CATALOGUE, key=len, reverse=True)  # longest first: Microsoft_365 before Miro
STOP = {"the", "a", "an", "of", "to", "for", "in", "on", "we", "us", "our", "their",
        "them", "this", "that", "and", "is", "are", "what", "me", "my", "it", "they",
        "have", "has", "do", "did", "with", "from", "by", "at", "be", "was", "were",
        "over", "one", "same", "while", "so", "up", "out", "about", "into", "can"}


def split_name(name):
    """Split a gateway's tool name into (server_or_None, tool).

    Gateways qualify names three different ways: "Server:tool" (MCPProxy),
    "Server__tool" (Nexus) and "Server_tool" (vMCP's {workload}_ prefix). Strip
    exactly ONE qualifier: several servers here own tools that already begin with
    the server's own name (every ClickUp tool is clickup_*), so stripping a
    separator AND an underscore prefix mangles the tool name.
    """
    for sep in (":", "__", "/"):
        if sep in name:
            left, _, right = name.rpartition(sep)
            return (left or None), right
    for s in SERVERS:
        for cand in (s + "_", s.lower() + "_", s.replace("_", "") + "_"):
            if name.startswith(cand):
                return s, name[len(cand):]
    return None, name


def norm_server(s):
    return re.sub(r"[^a-z0-9]", "", s.lower()) if s else s


def parse_payloads(text):
    """Gateways answer with a JSON doc, or several concatenated/newline-delimited."""
    try:
        return [json.loads(text)]
    except Exception:
        pass
    out = []
    dec = json.JSONDecoder()
    i, n = 0, len(text)
    while i < n:
        while i < n and text[i] in " \t\r\n":
            i += 1
        if i >= n:
            break
        try:
            obj, end = dec.raw_decode(text, i)
        except ValueError:
            break
        out.append(obj)
        i = end
    return out


def names_in(text):
    """Ranked (server, tool) entries, in the order the gateway returned them."""
    found = []
    for data in parse_payloads(text):
        stack = [data]
        while stack:
            cur = stack.pop(0)
            if isinstance(cur, dict):
                for k in ("name", "tool_name", "toolName", "tool"):
                    v = cur.get(k)
                    if isinstance(v, str):
                        found.append(v)
                stack.extend(cur.values())
            elif isinstance(cur, list):
                stack.extend(cur)
    out = []
    for f in found:
        e = split_name(f)
        if e not in out:
            out.append(e)
    return out


def rank_of(ranked, exp_server, exp_tool):
    """1-based rank of the expected tool, or 0.

    The server must match when the gateway reported one: ten tool names in this
    catalogue exist on more than one server (list_projects, search_issues, ...),
    so scoring on the bare tool name would credit the wrong backend.
    """
    for i, (srv, tool) in enumerate(ranked, 1):
        if tool == exp_tool and (srv is None
                                 or norm_server(srv) == norm_server(exp_server)):
            return i
    return 0


def result_status(res):
    """'error' for a JSON-RPC error or isError result, else 'ok'.

    Without this a protocol error is indistinguishable from a genuine no-match
    and silently inflates the empty-result metric.
    """
    if isinstance(res, dict) and res.get("error"):
        return "error"
    if isinstance((res or {}).get("result"), dict) and res["result"].get("isError"):
        return "error"
    return "ok"


def main():
    label, url, tool, arg = sys.argv[1:5]
    mode = sys.argv[5] if len(sys.argv) > 5 else "text"
    extra = json.loads(sys.argv[6]) if len(sys.argv) > 6 else {}

    c = MCPHTTP(url)
    c.init()
    t1 = t3 = t5 = 0
    empty = errors = 0
    lat = []
    rows = []
    for q, server, expected in QUERIES:
        val = ([w.strip(".,") for w in q.lower().split() if w not in STOP and len(w) > 2]
               if mode == "keywords" else q)
        t0 = time.time()
        try:
            res = c.call("tools/call", {"name": tool, "arguments": {arg: val, **extra}})
        except Exception as e:
            errors += 1
            rows.append((q, expected, 0, [f"TRANSPORT-ERROR {e}"]))
            continue
        lat.append(time.time() - t0)
        if result_status(res) == "error":
            errors += 1
            rows.append((q, expected, 0, ["TOOL-ERROR"]))
            continue
        ranked = [e for e in names_in(extract_text(res))
                  if e[1] not in (tool, "search", "execute")]
        if not ranked:
            empty += 1
        pos = rank_of(ranked, server, expected)
        t1 += pos == 1
        t3 += 1 <= pos <= 3
        t5 += 1 <= pos <= 5
        rows.append((q, expected, pos, [t for _, t in ranked[:5]]))

    n = len(QUERIES)
    print(f"\n===== {label} — {sum(len(v) for v in CATALOGUE.values())} tools / "
          f"{len(CATALOGUE)} servers =====")
    print(f"{'query':<48} {'expected':<46} {'rank':<5} top-3 returned")
    print("-" * 150)
    for q, exp, pos, ranked in rows:
        print(f"{q[:46]:<48} {exp[:44]:<46} {(pos or 'MISS'):<5} {ranked[:3]}")
    print("-" * 150)
    med = sorted(lat)[len(lat) // 2] * 1000 if lat else -1
    print(f"{label}: top-1 {t1}/{n} ({100*t1/n:.0f}%)  top-3 {t3}/{n} ({100*t3/n:.0f}%)  "
          f"top-5 {t5}/{n} ({100*t5/n:.0f}%)  empty-results {empty}/{n}  "
          f"errors {errors}/{n}  median {med:.0f}ms")


if __name__ == "__main__":
    main()
