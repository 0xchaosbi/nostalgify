#!/bin/sh
# Builds Nostalgify for this Mac and installs it into Applications.
#   npm run install-app
set -e
cd "$(dirname "$0")/.."

ARCH=$(uname -m)
[ "$ARCH" = "x86_64" ] && ARCH=x64

sh scripts/package.sh "$ARCH"

SRC="out/Nostalgify-darwin-$ARCH/Nostalgify.app"
DEST_DIR="${NOSTALGIFY_INSTALL_DIR:-/Applications}"
if [ ! -w "$DEST_DIR" ]; then
  DEST_DIR="$HOME/Applications"
  mkdir -p "$DEST_DIR"
fi
DEST="$DEST_DIR/Nostalgify.app"

# Quit a running copy so it can be replaced.
if pkill -x Nostalgify 2>/dev/null; then sleep 1; fi

rm -rf "$DEST"
ditto "$SRC" "$DEST"
echo ""
echo "Installed $DEST"
if [ -z "$NOSTALGIFY_NO_OPEN" ]; then
  echo "Opening Nostalgify..."
  open "$DEST"
fi
