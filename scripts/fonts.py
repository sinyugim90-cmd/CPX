# -*- coding: utf-8 -*-
"""사이트에 실제로 등장하는 글자만 뽑아 폰트를 서브셋 → woff2
   목적: 오프라인 PWA에서도 조판이 동일하게 보이도록"""
import os, re, glob, json, subprocess

SITE = "/home/claude/site"
FDIR = f"{SITE}/assets/fonts"
os.makedirs(FDIR, exist_ok=True)

# ── 1. 사용 문자 수집 ────────────────────────────────
chars = set()
targets = (glob.glob(f"{SITE}/*.html") + glob.glob(f"{SITE}/assets/*.js")
           + glob.glob(f"{SITE}/assets/*.css") + glob.glob(f"{SITE}/data/*.json")
           + glob.glob(f"{SITE}/guides/*.html"))
for f in targets:
    chars |= set(open(f, encoding="utf-8").read())

# 기본 라틴 · 숫자 · 문장부호 · 자주 쓰는 기호는 무조건 포함
chars |= set(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    " .,:;!?'\"()[]{}/\\|-_+=<>@#$%^&*~`\n\t"
    "·—–‹›“”‘’…→←↑↓×÷±°㎎㎍㎖㎗ℓ㎝㎜㎞㎏％"
    "ⓐⒷ①②③④⑤⑥⑦⑧⑨⑩◆■□●○★☆✓"
)
# 한글 완성형 상용 2350자 대신, 등장한 한글 + 여유분(자모)
chars |= set(chr(c) for c in range(0x3131, 0x3164))   # 호환 자모
chars = {c for c in chars if c.isprintable() or c in " \n\t"}
text = "".join(sorted(chars))
print("수집 문자:", len(chars), "자 (한글", sum(1 for c in chars if 0xAC00 <= ord(c) <= 0xD7A3), "자)")

uni = ",".join(f"U+{ord(c):04X}" for c in sorted(chars))
unifile = "/tmp/unicodes.txt"
open(unifile, "w").write(uni)

# ── 2. 서브셋 ────────────────────────────────────────
JOBS = [
    ("Pretendard", 300, os.path.expanduser("~/.fonts/Pretendard-Light.otf"), None),
    ("Pretendard", 400, os.path.expanduser("~/.fonts/Pretendard-Regular.otf"), None),
    ("Pretendard", 500, os.path.expanduser("~/.fonts/Pretendard-Medium.otf"), None),
    ("Pretendard", 700, os.path.expanduser("~/.fonts/Pretendard-Bold.otf"), None),
    ("Pretendard", 800, os.path.expanduser("~/.fonts/Pretendard-SemiBold.otf"), None),
    ("NotoSerifKR", 500, "/usr/share/fonts/opentype/noto/NotoSerifCJK-Medium.ttc", "Noto Serif CJK KR"),
    ("NotoSerifKR", 700, "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc", "Noto Serif CJK KR"),
]

def ttc_index(path, family):
    from fontTools.ttLib import TTCollection
    coll = TTCollection(path, lazy=True)
    for i, f in enumerate(coll.fonts):
        for rec in f["name"].names:
            if rec.nameID == 1:
                try:
                    if rec.toUnicode() == family:
                        return i
                except Exception:
                    pass
    return 0

made = []
for name, weight, src, family in JOBS:
    if not os.path.exists(src):
        print("  건너뜀 (없음):", src); continue
    out = f"{FDIR}/{name}-{weight}.woff2"
    cmd = ["pyftsubset", src, f"--unicodes-file={unifile}",
           "--flavor=woff2", f"--output-file={out}",
           "--layout-features=kern,liga,calt", "--no-hinting",
           "--desubroutinize", "--drop-tables+=DSIG"]
    if family:
        cmd.append(f"--font-number={ttc_index(src, family)}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print("  실패:", name, weight, r.stderr[-200:]); continue
    kb = os.path.getsize(out) // 1024
    made.append((name, weight, kb))
    print(f"  {name}-{weight}.woff2  {kb} KB")

print("총 폰트 용량:", sum(k for _, _, k in made), "KB")

# ── 3. @font-face 를 style.css 맨 앞에 주입 ───────────
faces = []
for name, weight, _ in made:
    fam = "Pretendard" if name == "Pretendard" else "Noto Serif KR"
    faces.append(f"""@font-face{{font-family:'{fam}';font-style:normal;font-weight:{weight};
  font-display:swap;src:url('fonts/{name}-{weight}.woff2') format('woff2')}}""")
block = "/* 자체 호스팅 폰트 — 오프라인에서도 동일하게 보이도록 */\n" + "\n".join(faces) + "\n\n"

css_path = f"{SITE}/assets/style.css"
css = open(css_path, encoding="utf-8").read()
css = re.sub(r"^/\* 자체 호스팅 폰트.*?\n\n", "", css, flags=re.S)
open(css_path, "w", encoding="utf-8").write(block + css)
print("style.css에 @font-face", len(faces), "개 주입")

# ── 4. HTML에서 CDN 링크 제거 ────────────────────────
for f in glob.glob(f"{SITE}/*.html"):
    s = open(f, encoding="utf-8").read()
    s = re.sub(r'\s*<link rel="stylesheet" href="https://cdn\.jsdelivr[^>]*>', "", s)
    s = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.[^>]*>', "", s)
    s = re.sub(r'\s*<link href="https://fonts\.googleapis[^>]*>', "", s)
    open(f, "w", encoding="utf-8").write(s)
print("CDN 링크 제거 완료")
