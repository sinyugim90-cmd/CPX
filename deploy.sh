#!/usr/bin/env bash
# CPX Study 배포 — 바뀐 파일을 GitHub에 올립니다.
#   처음 한 번만:  git clone https://github.com/<아이디>/CPX.git
#   그 다음부터:  새 파일을 이 폴더에 덮어쓰고  ./deploy.sh
set -e
cd "$(dirname "$0")"

if [ ! -d .git ]; then
  echo "❌ 여기는 git 저장소가 아니에요."
  echo "   먼저 저장소를 내려받고, 그 폴더 안에 파일을 덮어쓰세요:"
  echo "   git clone https://github.com/<아이디>/CPX.git"
  exit 1
fi

# 서비스워커 캐시 버전 자동 증가 (설치된 기기에 새 내용이 반영되도록)
if [ -f sw.js ]; then
  cur=$(grep -o "cpx-v[0-9]*" sw.js | head -1 | tr -d 'cpx-v')
  next=$((cur + 1))
  sed -i '' "s/cpx-v${cur}/cpx-v${next}/" sw.js 2>/dev/null || sed -i "s/cpx-v${cur}/cpx-v${next}/" sw.js
  echo "· 캐시 버전 cpx-v${cur} → cpx-v${next}"
fi

git add -A
if git diff --cached --quiet; then
  echo "· 바뀐 게 없어요."
  exit 0
fi

n=$(git diff --cached --name-only | wc -l | tr -d ' ')
git commit -q -m "update $(date '+%Y-%m-%d %H:%M')"
git push -q
echo "✅ ${n}개 파일 올렸어요. 1~2분 뒤 사이트에 반영됩니다."
