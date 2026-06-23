#!/bin/zsh
set -euo pipefail

ROOT="${0:A:h}"
DESTINATION="${1:-$ROOT/outputs}"
APP="$DESTINATION/ORCA NMR Viewer.app"

cd "$ROOT"
swift build --disable-sandbox -c release
BIN_PATH="$(swift build --disable-sandbox -c release --show-bin-path)"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN_PATH/OrcaNMRViewer" "$APP/Contents/MacOS/OrcaNMRViewer"
cp "$ROOT/Resources/Info.plist" "$APP/Contents/Info.plist"
chmod +x "$APP/Contents/MacOS/OrcaNMRViewer"

xattr -cr "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP"
echo "$APP"
