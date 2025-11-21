#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
PACKAGES=(
  "packages/admin"
  "packages/plugin-sdk"
  "packages/admin-cli"
  "examples/stripe-plugin"
)

for pkg in "${PACKAGES[@]}"; do
  echo "\n=============================="
  echo "Preparing ${pkg}"
  "${ROOT_DIR}/scripts/publish-single.sh" "${ROOT_DIR}/${pkg}"
  echo "==============================\n"

done

echo "All tarballs prepared. Publishing is still manual!"
echo "Next steps:"
echo " 1. Review git status and commit built dist/ assets"
echo " 2. Push using commit message: 'feat: production-ready MTC Platform admin'"
echo " 3. Run npm publish for each tarball using the printed instructions"
echo " 4. Push the annotated tags to GitHub"
