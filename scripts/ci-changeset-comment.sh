#!/usr/bin/env bash
set -euo pipefail

# Post or remove a sticky PR comment signalling that a changeset is missing.
#
# Usage:
#   ci-changeset-comment.sh upsert <pr-number>
#   ci-changeset-comment.sh delete  <pr-number>

ACTION="${1:-}"
PR_NUMBER="${2:-}"

MARKER='<!-- changeset-gate -->'
REPO="${GITHUB_REPOSITORY:-couimet/ts-npm-packages}"

usage() {
  echo "Usage: ci-changeset-comment.sh <upsert|delete> <pr-number>" >&2
  echo "  upsert: create or update a sticky comment with changeset instructions" >&2
  echo "  delete: remove the sticky comment if it exists" >&2
}

# ── find existing comment id (empty string if none) ──
find_comment_id() {
  gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" \
    --jq '.[] | select(.body | contains("'"${MARKER}"'")) | .id' \
    2>/dev/null || echo ""
}

# ── generate the comment body ──
generate_body() {
  local packages=""
  if [ -f /tmp/changeset-packages.txt ]; then
    packages=$(cat /tmp/changeset-packages.txt)
  fi

  cat << EOF
## ⚠️ Changeset required
EOF

  if [ -n "${packages}" ]; then
    cat << EOF

Changed packages: \`${packages}\`
EOF
  fi

  cat << EOF

Run one of:

\`\`\`bash
pnpm changeset add          # create a changeset for the changed packages
pnpm changeset add --empty  # if no release is needed
\`\`\`

See [CONTRIBUTING.md](https://github.com/${REPO}/blob/main/CONTRIBUTING.md) for the full workflow.
EOF
}

# ── validate ──
if [ -z "${ACTION}" ] || [ -z "${PR_NUMBER}" ]; then
  usage
  exit 2
fi

case "${ACTION}" in
  upsert)
    EXISTING=$(find_comment_id)
    PAYLOAD=$(mktemp)
    cleanup() { rm -f "${PAYLOAD}"; }
    trap cleanup EXIT
    generate_body | jq -Rs '{body: .}' > "${PAYLOAD}"

    if [ -n "${EXISTING}" ]; then
      gh api "repos/${REPO}/issues/comments/${EXISTING}" -X PATCH --input "${PAYLOAD}" > /dev/null
    else
      gh api "repos/${REPO}/issues/${PR_NUMBER}/comments" --input "${PAYLOAD}" > /dev/null
    fi
    ;;
  delete)
    EXISTING=$(find_comment_id)
    if [ -n "${EXISTING}" ]; then
      gh api "repos/${REPO}/issues/comments/${EXISTING}" -X DELETE > /dev/null
    fi
    ;;
  *)
    usage
    exit 2
    ;;
esac
