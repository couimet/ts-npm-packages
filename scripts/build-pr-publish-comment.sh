#!/usr/bin/env bash
set -euo pipefail

publish_output=""
mode=""
branch=""
repo=""
sha=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --publish-output) publish_output="$2"; shift 2 ;;
    --mode) mode="$2"; shift 2 ;;
    --branch) branch="$2"; shift 2 ;;
    --repo) repo="$2"; shift 2 ;;
    --sha) sha="$2"; shift 2 ;;
    *) echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$publish_output" || -z "$mode" ]]; then
  echo "Usage: $0 --publish-output <file> --mode <main|prerelease> [--branch <name>] [--repo <owner/repo>] [--sha <sha>]" >&2
  exit 1
fi

if [[ ! -f "$publish_output" ]]; then
  echo "::error::Publish output file not found: ${publish_output}" >&2
  exit 1
fi

comment_file="$(mktemp)"

if [[ "$mode" == "main" ]]; then
  specs=$(grep -oE '@[a-z][a-z0-9-]*/[a-z][a-z0-9-]*@[0-9]+\.[0-9]+\.[0-9]+[^[:space:]]*' "$publish_output" | sort -u) || true
  if [[ -z "$specs" ]]; then
    echo "::warning::No packages were published, skipping PR comment" >&2
    echo "skip=true"
    rm -f "$comment_file"
    exit 0
  fi
  echo '## Published' >> "$comment_file"
  echo '' >> "$comment_file"
  while read -r spec; do
    echo "- \`${spec}\`" >> "$comment_file"
  done <<< "$specs"
elif [[ "$mode" == "prerelease" ]]; then
  specs=$(grep -oE '@[a-z][a-z0-9-]*/[a-z][a-z0-9-]*@[0-9]+\.[0-9]+\.[0-9]+[^[:space:]]*' "$publish_output" | sort -u) || true
  if [[ -z "$specs" ]]; then
    echo "::warning::No packages were published, skipping PR comment" >&2
    echo "skip=true"
    rm -f "$comment_file"
    exit 0
  fi
  echo '## Pre-release published' >> "$comment_file"
  echo '' >> "$comment_file"
  while read -r spec; do
    echo "- \`${spec}\` (\`dev\` dist-tag)" >> "$comment_file"
  done <<< "$specs"
else
  echo "Invalid mode: ${mode}. Expected 'main' or 'prerelease'." >&2
  rm -f "$comment_file"
  exit 1
fi

echo "comment_file=${comment_file}"

# Find PR number
if [[ "$mode" == "main" ]]; then
  if [[ -z "$repo" || -z "$sha" ]]; then
    echo "::error::--repo and --sha are required for main mode" >&2
    rm -f "$comment_file"
    exit 1
  fi
  pr_number=$(gh api "repos/${repo}/commits/${sha}/pulls" --jq '.[0].number')
else
  if [[ -z "$branch" ]]; then
    echo "::error::--branch is required for prerelease mode" >&2
    rm -f "$comment_file"
    exit 1
  fi
  pr_number=$(gh pr list --head "${branch}" --json number --jq '.[0].number')
fi

if [[ -z "${pr_number}" || "${pr_number}" == "null" ]]; then
  echo "::warning::No PR found, skipping comment" >&2
  echo "skip=true"
else
  echo "pr_number=${pr_number}"
fi
