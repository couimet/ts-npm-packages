#!/usr/bin/env bash
set -euo pipefail

# Regenerate the package dependency graph block in the root README.
#
# The block is delimited by the BEGIN/END dependency-graph markers in README.md.
# Edges come from `dependencies` and `peerDependencies` between workspace packages.
# `devDependencies` are deliberately excluded, so the graph shows runtime structure
# rather than every package's linting setup.
#
# Usage:
#   generate-package-graph.sh [repo-root]           rewrite the README block
#   generate-package-graph.sh [repo-root] --check   exit 1 when the block is stale

repo_root=""
check_only=false

for arg in "$@"; do
  case "$arg" in
    --check)
      check_only=true
      ;;
    -*)
      echo "ERROR: unknown option '$arg'" >&2
      exit 2
      ;;
    *)
      if [ -n "$repo_root" ]; then
        echo "ERROR: unexpected argument '$arg'" >&2
        exit 2
      fi
      repo_root="$arg"
      ;;
  esac
done

repo_root="${repo_root:-$(pwd)}"

if [ ! -f "${repo_root}/README.md" ]; then
  echo "ERROR: ${repo_root}/README.md not found" >&2
  exit 1
fi

if [ ! -d "${repo_root}/packages" ]; then
  echo "ERROR: ${repo_root}/packages not found" >&2
  exit 1
fi

rendered="$(mktemp)"
trap 'rm -f "$rendered"' EXIT

REPO_ROOT="$repo_root" OUTPUT_FILE="$rendered" node <<'NODE'
const fs = require("fs");
const path = require("path");

const repoRoot = process.env.REPO_ROOT;
const outputFile = process.env.OUTPUT_FILE;

const BEGIN_MARKER = "<!-- BEGIN dependency-graph -->";
const END_MARKER = "<!-- END dependency-graph -->";
const INDENT = "    ";

const shortName = (name) => name.replace(/^@[^/]+\//, "");

const manifests = [];
for (const entry of fs.readdirSync(path.join(repoRoot, "packages")).sort()) {
  const manifestPath = path.join(repoRoot, "packages", entry, "package.json");
  if (!fs.existsSync(manifestPath)) {
    continue;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifests.push({
    name: manifest.name,
    dependencies: Object.keys(manifest.dependencies ?? {}),
    peerDependencies: Object.keys(manifest.peerDependencies ?? {}),
  });
}

const workspacePackages = new Set(manifests.map((manifest) => manifest.name));

// A target listed in both sections is drawn once, as a `dependencies` edge.
const edges = new Map();
for (const manifest of manifests) {
  for (const [kind, targets] of [
    ["dependencies", manifest.dependencies],
    ["peerDependencies", manifest.peerDependencies],
  ]) {
    for (const target of targets) {
      if (!workspacePackages.has(target)) {
        continue;
      }
      const key = `${manifest.name}>${target}`;
      if (!edges.has(key)) {
        edges.set(key, { from: manifest.name, to: target, kind });
      }
    }
  }
}

const sortedEdges = [...edges.values()].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));

const connected = new Set();
for (const edge of sortedEdges) {
  connected.add(edge.from);
  connected.add(edge.to);
}
const omitted = manifests
  .map((manifest) => manifest.name)
  .filter((name) => !connected.has(name))
  .sort();

const arrow = (kind) => (kind === "dependencies" ? "-->" : "-.->");

const diagram = ["graph LR"];
for (const edge of sortedEdges) {
  diagram.push(`${INDENT}${shortName(edge.from)} ${arrow(edge.kind)} ${shortName(edge.to)}`);
}

const legend = [
  "- Solid arrows (`-->`) mark a `dependencies` edge and dotted arrows (`-.->`) mark a `peerDependencies` edge.",
  "- `devDependencies` are omitted.",
];

if (omitted.length === 0) {
  legend.push("- Every package declares at least one internal `dependencies` or `peerDependencies` entry.");
} else {
  const listed = omitted.map((name) => `\`${shortName(name)}\``);
  const subject = listed.length === 1 ? `${listed[0]} is` : `${listed.slice(0, -1).join(", ")} and ${listed[listed.length - 1]} are`;
  legend.push(`- ${subject} not shown because it declares no internal \`dependencies\` or \`peerDependencies\` entry.`);
}

const block = [BEGIN_MARKER, "", "```mermaid", ...diagram, "```", "", ...legend, "", END_MARKER].join("\n");

const readmePath = path.join(repoRoot, "README.md");
const readme = fs.readFileSync(readmePath, "utf8");

const beginIndex = readme.indexOf(BEGIN_MARKER);
const endIndex = readme.indexOf(END_MARKER);

if (beginIndex === -1 || endIndex === -1) {
  throw new Error(`README.md must contain both ${BEGIN_MARKER} and ${END_MARKER}`);
}
if (endIndex < beginIndex) {
  throw new Error(`README.md has ${END_MARKER} before ${BEGIN_MARKER}`);
}

fs.writeFileSync(outputFile, readme.slice(0, beginIndex) + block + readme.slice(endIndex + END_MARKER.length));
NODE

if [ "$check_only" = true ]; then
  if ! diff -u "${repo_root}/README.md" "$rendered" >&2; then
    echo "ERROR: README.md dependency graph is out of date. Run scripts/generate-package-graph.sh." >&2
    exit 1
  fi
else
  cp "$rendered" "${repo_root}/README.md"
fi
