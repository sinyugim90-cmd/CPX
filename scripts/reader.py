# -*- coding: utf-8 -*-
"""가이드 전문 HTML → 학습모드 JSON

구조
  parts[]        PART 하나 = 아코디언 최상위
    tag/title/dek
    secs[]       h2 하나 = 펼침 단위 (표지·부록은 sec 하나로 묶음)
      title/sub
      blocks[]   순서대로 렌더할 조각들
        {k:"p",   html}            문단
        {k:"ask", q, html}         h3 질문 + 그 아래 답 (탭하면 열림)
        {k:"quote", who, lines[]}  환자 vignette
        {k:"tbl", html}            표
        {k:"fig", svg, cap}        다이어그램
        {k:"list", kind, html}     plain / deduct / flow 목록
        {k:"si",  code, grade, why, say, rows}     대본 항목
        {k:"card",nm, en, dl[]}    특이검사 카드
        {k:"recall", lb, qs[]}     인출 질문
        {k:"dl",  rows[]}          표지 정의목록
"""
import json, re, os, sys
from bs4 import BeautifulSoup

SITE = "/home/claude/site"
GUIDES = {
    "j": "CPX25_JointPain_Guide",
    "n": "CPX26-1_NeckPain_Guide",
    "b": "CPX26-2_LowBackPain_Guide",
    "s": "CPX27_SkinRash_Guide",
}


def inner(el):
    return "".join(str(c) for c in el.contents).strip()


def parse_blocks(nodes):
    out = []
    for el in nodes:
        if getattr(el, "name", None) is None:
            continue
        cls = el.get("class") or []
        n = el.name

        if n == "p" and "sub" not in cls and "dek" not in cls and "note" not in cls:
            out.append({"k": "p", "html": inner(el)})
        elif n == "p" and "sub" in cls:
            out.append({"k": "p", "html": '<span class="rsub">' + inner(el) + "</span>"})
        elif n == "blockquote":
            who = el.find(class_="who")
            lines = [inner(p) for p in el.find_all("p")]
            out.append({"k": "quote", "who": who.get_text() if who else "환자", "lines": lines})
        elif n == "table":
            out.append({"k": "tbl", "html": str(el)})
        elif n == "figure":
            svg = el.find("svg")
            cap = el.find("figcaption")
            out.append({"k": "fig", "svg": str(svg) if svg else "",
                        "cap": cap.get_text() if cap else ""})
        elif n == "ul" and "plain" in cls:
            out.append({"k": "list", "kind": "plain", "html": inner(el)})
        elif n == "ul" and "deduct" in cls:
            out.append({"k": "list", "kind": "deduct", "html": inner(el)})
        elif n == "ol" and "flow" in cls:
            out.append({"k": "list", "kind": "flow", "html": inner(el)})
        elif n == "div" and "si" in cls:
            code = el.find(class_="code")
            grade = el.find(class_="g")
            say = el.find(class_="say")
            why = el.find(class_="why")
            rows = []
            for tr in el.select("tbody tr"):
                tds = tr.find_all("td")
                if len(tds) == 3:
                    rows.append([inner(tds[0]), inner(tds[1]), inner(tds[2])])
            out.append({"k": "si", "code": code.get_text() if code else "",
                        "grade": grade.get_text() if grade else "",
                        "say": inner(say) if say else "",
                        "why": inner(why) if why else "", "rows": rows})
        elif n == "div" and "card" in cls:
            nm = el.find(class_="nm")
            en = nm.find(class_="en") if nm else None
            title = nm.get_text().replace(en.get_text(), "").strip() if (nm and en) else (nm.get_text() if nm else "")
            dl = []
            if el.dl:
                dts = el.dl.find_all("dt")
                dds = el.dl.find_all("dd")
                for dt, dd in zip(dts, dds):
                    dl.append([dt.get_text(), inner(dd)])
            fg = el.find("figure")
            out.append({"k": "card", "nm": title,
                        "en": en.get_text() if en else "", "dl": dl,
                        "svg": str(fg.find("svg")) if (fg and fg.find("svg")) else ""})
        elif n == "div" and "recall" in cls:
            lb = el.find(class_="lb")
            out.append({"k": "recall", "lb": lb.get_text() if lb else "스스로 답해보기",
                        "qs": [inner(p) for p in el.find_all("p")]})
        elif n == "div" and "note" in cls:
            out.append({"k": "p", "html": '<span class="rnote">' + inner(el) + "</span>"})
        elif n == "dl":
            rows = []
            dts, dds = el.find_all("dt"), el.find_all("dd")
            for dt, dd in zip(dts, dds):
                rows.append([dt.get_text(), inner(dd)])
            out.append({"k": "dl", "rows": rows})
    return out


def parse_guide(path):
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "lxml")
    parts = []
    for sec in soup.find_all("section"):
        op = sec.find(class_="opener")
        if sec.get("class") and "cover" in sec.get("class"):
            h1 = sec.find("h1")
            en = sec.find(class_="en")
            dl = sec.find("dl")
            note = sec.find(class_="note")
            rows = []
            if dl:
                for dt, dd in zip(dl.find_all("dt"), dl.find_all("dd")):
                    rows.append([dt.get_text(), inner(dd)])
            blocks = [{"k": "dl", "rows": rows}]
            if note:
                blocks.append({"k": "p", "html": inner(note)})
            parts.append({"tag": "표지", "title": h1.get_text() if h1 else "",
                          "dek": en.get_text() if en else "",
                          "secs": [{"title": "1분 컷 요약", "sub": "", "blocks": blocks}]})
            continue
        if not op:
            continue
        tag = op.find(class_="tag")
        h1 = op.find("h1")
        dek = op.find(class_="dek")

        # opener 다음부터 h2 단위로 자르기
        secs, cur = [], {"title": "", "sub": "", "nodes": []}
        for el in op.find_next_siblings():
            if el.name == "h2":
                if cur["nodes"] or cur["title"]:
                    secs.append(cur)
                cur = {"title": el.get_text(), "sub": "", "nodes": []}
            elif el.name == "p" and (el.get("class") or []) == ["sub"] and not cur["nodes"]:
                cur["sub"] = el.get_text()
            elif el.name == "h3":
                cur["nodes"].append(("ask", el))
            else:
                cur["nodes"].append(("el", el))
        if cur["nodes"] or cur["title"]:
            secs.append(cur)

        outsecs = []
        for s in secs:
            blocks, i = [], 0
            nodes = s["nodes"]
            while i < len(nodes):
                kind, el = nodes[i]
                if kind == "ask":
                    body, j = [], i + 1
                    while j < len(nodes) and nodes[j][0] != "ask":
                        body.append(nodes[j][1]); j += 1
                    blocks.append({"k": "ask", "q": el.get_text(),
                                   "blocks": parse_blocks(body)})
                    i = j
                else:
                    body = []
                    while i < len(nodes) and nodes[i][0] == "el":
                        body.append(nodes[i][1]); i += 1
                    blocks.extend(parse_blocks(body))
            outsecs.append({"title": s["title"] or "들어가며",
                            "sub": s["sub"], "blocks": blocks})

        parts.append({"tag": tag.get_text() if tag else "",
                      "title": h1.get_text() if h1 else "",
                      "dek": dek.get_text() if dek else "",
                      "secs": [s for s in outsecs if s["blocks"]]})
    return parts


if __name__ == "__main__":
    tot_p = tot_s = tot_a = 0
    for cid, g in GUIDES.items():
        src = f"{SITE}/guides/{g}.html"
        parts = parse_guide(src)
        json.dump({"parts": parts}, open(f"{SITE}/data/{cid}.read.json", "w", encoding="utf-8"),
                  ensure_ascii=False, separators=(",", ":"))
        ns = sum(len(p["secs"]) for p in parts)
        na = sum(1 for p in parts for s in p["secs"] for b in s["blocks"] if b["k"] == "ask")
        tot_p += len(parts); tot_s += ns; tot_a += na
        kb = os.path.getsize(f"{SITE}/data/{cid}.read.json") // 1024
        print(f"  {g:34s} PART {len(parts):2d} · 절 {ns:3d} · 질문 {na:3d} · {kb}KB")
    print(f"합계 · PART {tot_p} · 절 {tot_s} · 클릭 질문 {tot_a}")
