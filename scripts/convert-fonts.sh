#!/bin/bash
set -euo pipefail

ROOT="src/fonts"
INCLUDE_PATTERN="*.ttf"
# Space-separated globs to exclude (relative match)
EXCLUDE_DIRS=("__ignored" "tmp")
VERBOSE=${VERBOSE:-1}

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing tool: $1"; MISSING=1; }
}
MISSING=0
need ttx
need woff2_compress
[ "$MISSING" = 1 ] && { echo "Install missing tools (brew install fonttools woff2)"; exit 1; }

# Activate venv if present & not active
if [ -z "${VIRTUAL_ENV:-}" ] && [ -f "shine-venv/bin/activate" ]; then
  source shine-venv/bin/activate
fi

should_exclude() {
  local path="$1"
  for ex in "${EXCLUDE_DIRS[@]}"; do
    [[ "$path" == *"/$ex/"* ]] && return 0
  done
  return 1
}

convert_one() {
  local ttf="$1"
  local base="${ttf%.ttf}"
  local woff="$base.woff"
  local woff2="$base.woff2"

  # Skip if up-to-date
  if [ -f "$woff2" ] && [ "$woff2" -nt "$ttf" ]; then
    [ "$VERBOSE" -ge 1 ] && echo "Skip (fresh) $ttf"
    return
  fi

  echo "Converting: $ttf"
  ttx -q -f -o "$woff" "$ttf"
  woff2_compress "$ttf" >/dev/null
  mv "${ttf%.ttf}.woff2" "$woff2"

  # Basic size report
  if [ "$VERBOSE" -ge 1 ]; then
    ls -lh "$ttf" "$woff" "$woff2" | awk '{print $5, $9}'
  fi
}

export -f convert_one
export VERBOSE

while IFS= read -r -d '' ttf; do
  dir=$(dirname "$ttf")"/"
  if should_exclude "$dir"; then
    [ "$VERBOSE" -ge 2 ] && echo "Exclude: $ttf"
    continue
  fi
  convert_one "$ttf"
done < <(find "$ROOT" -type f -name "$INCLUDE_PATTERN" -print0)

echo "Font conversion complete."