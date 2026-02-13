#!/bin/bash
# 배포 스크립트 - 검수 후 푸시

set -e

cd "$(dirname "$0")/.."

echo "🚀 배포 시작"
echo ""

# 1. Git 상태 확인
if [[ -z $(git status -s) ]]; then
  echo "⚠️ 변경사항 없음"
  exit 0
fi

# 2. 커밋
echo "📝 커밋 중..."
git add .
COMMIT_MSG="${1:-Update}"
git commit -m "$COMMIT_MSG"

# 3. 푸시
echo "📤 푸시 중..."
git push origin main

# 4. 배포 대기 (GitHub Pages)
echo ""
echo "⏳ GitHub Pages 배포 대기 (30초)..."
sleep 30

# 5. UI 검수
echo ""
echo "🔍 UI 검수 시작..."
if node scripts/ui-check.js; then
  echo ""
  echo "✅ 배포 완료!"
else
  echo ""
  echo "⚠️ UI 이슈 발견! 스크린샷 확인 필요"
  echo "📁 screenshots/ 폴더 확인"
  exit 1
fi
