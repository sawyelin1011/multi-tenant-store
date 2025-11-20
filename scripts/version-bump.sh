#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-}
if [[ -z "${VERSION}" ]]; then
  echo "Usage: scripts/version-bump.sh <new-version>"
  exit 1
fi

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
FILES=(
  "package.json"
  "packages/admin/package.json"
  "packages/admin-cli/package.json"
  "packages/plugin-sdk/package.json"
  "examples/stripe-plugin/package.json"
)

for file in "${FILES[@]}"; do
  TARGET="${ROOT_DIR}/${file}"
  if [[ -f "${TARGET}" ]]; then
    node -e "const fs=require('fs');const file=process.argv[1];const data=JSON.parse(fs.readFileSync(file,'utf8'));data.version='${VERSION}';fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');" "${TARGET}"
    echo "🔢 Updated ${file} to v${VERSION}"
  fi

done

echo "Version bump complete. Remember to update changelogs and create a release PR."
