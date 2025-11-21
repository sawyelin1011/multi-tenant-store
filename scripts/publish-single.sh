#!/usr/bin/env bash
set -euo pipefail

PACKAGE_DIR=${1:-}
if [[ -z "${PACKAGE_DIR}" ]]; then
  echo "Usage: scripts/publish-single.sh <package-directory>"
  exit 1
fi

if [[ ! -f "${PACKAGE_DIR}/package.json" ]]; then
  echo "Error: ${PACKAGE_DIR} is missing package.json"
  exit 1
fi

PACKAGE_NAME=$(node -p "require('${PACKAGE_DIR}/package.json').name")
PACKAGE_VERSION=$(node -p "require('${PACKAGE_DIR}/package.json').version")
DIST_DIR="${PACKAGE_DIR}/dist/releases"
mkdir -p "${DIST_DIR}"

echo "📦 Preparing release for ${PACKAGE_NAME} v${PACKAGE_VERSION}"
npm --prefix "${PACKAGE_DIR}" run build

echo "📦 Creating tarball (no publish)"
PACK_RESULT=$(npm --prefix "${PACKAGE_DIR}" pack --pack-destination "${DIST_DIR}" | tail -n 1)
TARBALL_PATH="${DIST_DIR}/${PACK_RESULT}"

echo "✅ Tarball ready at ${TARBALL_PATH}"
TAG_NAME="${PACKAGE_NAME}@${PACKAGE_VERSION}"

cat <<INSTRUCTIONS

Manual publish steps (run yourself):
  cd ${PACKAGE_DIR}
  npm publish "dist/releases/${PACK_RESULT}" --access public
  git tag -a ${TAG_NAME} -m "release: ${PACKAGE_NAME} v${PACKAGE_VERSION}"
  git push origin ${TAG_NAME}

Remember: publishing is manual. Review dist/ contents before executing npm publish.
INSTRUCTIONS
