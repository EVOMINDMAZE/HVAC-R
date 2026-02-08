#!/bin/bash
# Start Chrome with remote debugging for CDP log capture
#
# Usage:
#   ./start-chrome-debug.sh [port]
#
# Default port: 9222
#
# This starts Chrome with:
#   - Remote debugging on specified port
#   - Clean profile in /tmp/chrome-debug-profile
#   - No first-run checks
#   - DevTools auto-open for tabs (optional)

PORT=${1:-9222}
PROFILE_DIR="/tmp/chrome-debug-profile"

echo "Starting Chrome with remote debugging on port $PORT..."
echo "Profile directory: $PROFILE_DIR"
echo ""
echo "To connect, run:"
echo "  npx tsx scripts/chrome-devtools-capture.ts --port $PORT"
echo ""
echo "Or for Playwright:"
echo "  npx tsx scripts/capture-browser-logs.ts --headed"
echo ""

# Create profile directory if it doesn't exist
mkdir -p "$PROFILE_DIR"

# Start Chrome
open -na "Google Chrome" --args \
    --remote-debugging-port="$PORT" \
    --user-data-dir="$PROFILE_DIR" \
    --no-first-run \
    --no-default-browser-check \
    "$@"
