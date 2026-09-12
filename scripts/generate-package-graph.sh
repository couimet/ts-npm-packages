#!/usr/bin/env bash
set -euo pipefail

# Regenerate the package dependency graph block in the root README.
#
# The block is delimited by the BEGIN/END dependency-graph markers in README.md.
# Edges come from `dependencies` and `peerDependencies` between workspace packages.
# A `devDependencies` entry is drawn only when its target is a private workspace
# package, since a private package is never published and reaches a consumer only
# as a dev dependency. Other `devDependencies` stay excluded, so the graph shows
# runtime structure rather than every package's linting setup.
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
    private: manifest.private === true,
    dependencies: Object.keys(manifest.dependencies ?? {}),
    peerDependencies: Object.keys(manifest.peerDependencies ?? {}),
    devDependencies: Object.keys(manifest.devDependencies ?? {}),
  });
}

const workspacePackages = new Map(manifests.map((manifest) => [manifest.name, manifest]));
const isPrivateWorkspacePackage = (name) => workspacePackages.get(name)?.private === true;

// A pair listed in more than one section is drawn once, under the stronger kind.
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

for (const manifest of manifests) {
  for (const target of manifest.devDependencies) {
    if (!isPrivateWorkspacePackage(target)) {
      continue;
    }
    const key = `${manifest.name}>${target}`;
    if (!edges.has(key)) {
      edges.set(key, { from: manifest.name, to: target, kind: "devDependencies" });
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

const arrow = (kind) => {
  if (kind === "dependencies") {
    return "-->";
  }
  return kind === "peerDependencies" ? "-.->" : "==>";
};

const diagram = ["graph LR"];
for (const edge of sortedEdges) {
  diagram.push(`${INDENT}${shortName(edge.from)} ${arrow(edge.kind)} ${shortName(edge.to)}`);
}

const legend = [
  "- Solid arrows (`-->`) mark a `dependencies` edge and dotted arrows (`-.->`) mark a `peerDependencies` edge.",
  "- Thick arrows (`==>`) mark a `devDependencies` edge onto a private workspace package, which is never published.",
  "- Other `devDependencies` are omitted.",
];

if (omitted.length === 0) {
  legend.push("- Every package declares at least one internal edge that the graph draws.");
} else {
  const listed = omitted.map((name) => `\`${shortName(name)}\``);
  const subject = listed.length === 1 ? `${listed[0]} is` : `${listed.slice(0, -1).join(", ")} and ${listed[listed.length - 1]} are`;
  legend.push(`- ${subject} not shown because it declares no internal edge that the graph draws.`);
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
