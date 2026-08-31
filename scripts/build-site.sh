#!/usr/bin/env bash
# Build the static site published to Cloudflare Workers.
# Mirrors the layout the Worker serves: the contents of wireframes/ at the root,
# with the clickable prototype (nodelab-proto.html) as the index page.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

cp -R "$ROOT_DIR/wireframes/." "$DIST_DIR/"
cp "$ROOT_DIR/wireframes/nodelab-proto.html" "$DIST_DIR/index.html"

echo "Built site into $DIST_DIR"
