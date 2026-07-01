#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-$(pwd)}"
REPO_URL="https://github.com/couimet/ts-npm-packages"

for changelog in "$REPO_ROOT"/packages/*/CHANGELOG.md; do
  [ -f "$changelog" ] || continue

  pkg_dir="$(dirname "$changelog")"
  pkg_name="$(node -e "process.stdout.write(require('${pkg_dir}/package.json').name)" 2>/dev/null || true)"
  if [ -z "$pkg_name" ]; then
    echo "Warning: Could not read package name from ${pkg_dir}/package.json, skipping ${changelog}" >&2
    continue
  fi

  # ── Step 1: Replace semver bump headings with keep-a-changelog categories ──
  tmp="$(mktemp)"
  sed \
    -e 's/^### Major Changes$/### Changed/' \
    -e 's/^### Minor Changes$/### Added/' \
    -e 's/^### Patch Changes$/### Fixed/' \
    "$changelog" > "$tmp"
  mv "$tmp" "$changelog"

  # ── Step 2: Add brackets to bare version headers (## X.Y.Z → ## [X.Y.Z]) ──
  tmp="$(mktemp)"
  while IFS= read -r line; do
    if [[ "$line" =~ ^##\ [0-9]+\.[0-9]+\.[0-9]+ ]] && [[ ! "$line" =~ ^##\ \[ ]]; then
      rest="${line#\#\# }"
      echo "## [${rest}]"
    else
      echo "$line"
    fi
  done < "$changelog" > "$tmp"
  mv "$tmp" "$changelog"

  # ── Step 3: Structure, markers, and links ──
  tmp="$(mktemp)"
  awk -v pkg_name="$pkg_name" -v repo_url="$REPO_URL" '
    function encode_tag(pkg, ver) {
      gsub(/@/, "%40", pkg)
      gsub(/\//, "%2F", pkg)
      return pkg "%40" ver
    }

    function flush_block() {
      if (!in_version_block) return
      if (section == "pre_boilerplate") {
        misplaced_blocks = misplaced_blocks current_block
      } else {
        entries_content = entries_content current_block
      }
      current_block = ""
      in_version_block = 0
    }

    BEGIN {
      section = "pre_boilerplate"
      has_entries_marker = 0
      has_links_marker = 0
      pre_boilerplate = ""
      boilerplate = ""
      post_boilerplate = ""
      misplaced_blocks = ""
      entries_content = ""
      links_content = ""
      current_block = ""
      in_version_block = 0
      version_count = 0
    }

    # ── Markers: consume and remember they existed ──

    /^<!-- changelog-entries -->/ {
      has_entries_marker = 1
      flush_block()
      section = "entries"
      next
    }

    /^<!-- changelog-links -->/ {
      has_links_marker = 1
      flush_block()
      section = "links"
      next
    }

    # ── Boilerplate boundary: "All notable changes" ──

    section == "pre_boilerplate" && /^All notable changes/ {
      flush_block()
      section = "boilerplate"
      boilerplate = boilerplate $0 "\n"
      next
    }

    # ── Boilerplate ends at keepachangelog.com line ──

    section == "boilerplate" && /keepachangelog\.com/ {
      boilerplate = boilerplate $0 "\n"
      section = "post_boilerplate"
      next
    }

    # ── Compare link: end version block, switch to links section ──

    /^\[.*\]: https:\/\// {
      flush_block()
      section = "links"
      links_content = links_content $0 "\n"
      next
    }

    # ── Version header: ## [X.Y.Z]... ──

    /^## \[[0-9]+\.[0-9]+\.[0-9]+/ {
      vline = $0
      sub(/^## \[/, "", vline)
      sub(/\].*$/, "", vline)
      versions[++version_count] = vline
      flush_block()
      current_block = $0 "\n"
      in_version_block = 1
      next
    }

    # ── Regular line accumulation ──

    {
      if (in_version_block) {
        current_block = current_block $0 "\n"
      } else if (section == "pre_boilerplate") {
        pre_boilerplate = pre_boilerplate $0 "\n"
      } else if (section == "boilerplate") {
        boilerplate = boilerplate $0 "\n"
      } else if (section == "post_boilerplate") {
        post_boilerplate = post_boilerplate $0 "\n"
      } else if (section == "entries") {
        entries_content = entries_content $0 "\n"
      } else {
        links_content = links_content $0 "\n"
      }
    }

    END {
      flush_block()

      # ── Output header (pre-boilerplate + boilerplate + post-boilerplate) ──
      printf "%s", pre_boilerplate
      printf "%s", boilerplate
      printf "%s", post_boilerplate

      # ── Entries marker ──
      print "<!-- changelog-entries -->"

      # ── Output version blocks (misplaced blocks moved here + normal entries) ──
      printf "%s", misplaced_blocks
      printf "%s", entries_content

      # ── Links marker ──
      print "<!-- changelog-links -->"

      # ── Existing links ──
      printf "%s", links_content

      # ── Generate missing compare links ──
      split(links_content, link_lines, "\n")
      for (i = 1; i in link_lines; i++) {
        line = link_lines[i]
        if (line ~ /^\[.*\]: https:\/\//) {
          v = line
          sub(/^\[/, "", v)
          sub(/\]:.*$/, "", v)
          existing[v] = 1
        }
      }

      for (i = 1; i <= version_count; i++) {
        v = versions[i]
        if (!(v in existing)) {
          if (i == version_count) {
            tag = encode_tag(pkg_name, v)
            printf "[%s]: %s/releases/tag/%s\n", v, repo_url, tag
          } else {
            prev = versions[i + 1]
            tag_prev = encode_tag(pkg_name, prev)
            tag_curr = encode_tag(pkg_name, v)
            printf "[%s]: %s/compare/%s...%s\n", v, repo_url, tag_prev, tag_curr
          }
        }
      }
    }
  ' "$changelog" > "$tmp"
  mv "$tmp" "$changelog"
done
