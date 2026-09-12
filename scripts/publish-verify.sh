#!/usr/bin/env bash
set -euo pipefail

# Verify that pre-release packages published to npm with the dev dist-tag
# can be installed and imported successfully.

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cd "$tmp"
pnpm init > /dev/null

# Discover pre-release packages from the workspace
pkgs=$(pnpm -C "$OLDPWD" version:list | grep -E -e '-(alpha|beta|rc)\.' || true)

if [[ -z "$pkgs" ]]; then
  echo "No pre-release packages found. Run /publish-prerelease-prepare first."
  exit 1
fi

# A published package declares its own type surface. A built declaration that
# names a private workspace package would ship an import that no consumer can
# install, so every private package name is rejected here before anything ships.
repo_root="$OLDPWD"
leak_found=0
while read -r private_name; do
  [[ -z "$private_name" ]] && continue
  while IFS= read -r declaration; do
    [[ -z "$declaration" ]] && continue
    echo "ERROR: ${declaration#"${repo_root}/"} names the private package ${private_name}." >&2
    leak_found=1
  done < <(grep -rlF -- "$private_name" "${repo_root}"/packages/*/dist --include='*.d.ts' 2> /dev/null || true)
done < <(jq -r 'select(.private == true) | .name' "${repo_root}"/packages/*/package.json)

if [[ "$leak_found" -eq 1 ]]; then
  echo "ERROR: a published package re-exports a type from a private workspace package." >&2
  exit 1
fi

echo "Installing pre-release packages from dev dist-tag..."
while read -r spec; do
  name="${spec%@*}"
  echo "  $name@dev"
  pnpm add "$name@dev" > /dev/null
done <<< "$pkgs"

# Build test script that imports each installed package
cat > test.mjs << 'TESTEOF'
(async () => {
TESTEOF

while read -r spec; do
  name="${spec%@*}"
  echo "  await import('$name');" >> test.mjs
  echo "  console.log('OK  $name');" >> test.mjs
done <<< "$pkgs"

cat >> test.mjs << 'TESTEOF'
  console.log('All pre-release packages resolve successfully');
})();
TESTEOF

node test.mjs
