#!/bin/bash
# Batch convert all TTF fonts in Bebas_Neue and Poppins to WOFF and WOFF2

set -e

FONT_DIRS=(
  "src/fonts/Lato"
  "src/fonts/Playfair_Display"
  "src/fonts/Kristi"
)

# Activate venv if not already active
if [ -z "$VIRTUAL_ENV" ]; then
  source "$(dirname "$0")/../../shine-venv/bin/activate"
fi

for DIR in "${FONT_DIRS[@]}"; do
  find "$DIR" -type f -name '*.ttf' | while read -r ttf; do
    base="${ttf%.ttf}"
    echo "Converting $ttf to $base.woff and $base.woff2"
    # Convert to WOFF
    ttx -f -o "$base.woff" "$ttf"
    # Convert to WOFF2 (requires woff2_compress in PATH)
    if command -v woff2_compress >/dev/null 2>&1; then
      woff2_compress "$ttf"
      mv "${ttf%.ttf}.woff2" "$base.woff2"
    else
      echo "woff2_compress not found, skipping WOFF2 for $ttf"
    fi
  done
done

echo "Font conversion complete."
