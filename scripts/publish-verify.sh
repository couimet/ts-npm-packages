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
