#!/bin/bash

# Configuration
FUNCTION_URL="https://rxqflxmzsqhqrzffcsej.supabase.co/functions/v1/verify-license"
INVALID_KEY="this-is-not-a-valid-key"

echo "🧪 Testing ThermoNeural License Gate..."
echo "----------------------------------------"

# 1. Test Invalid Key
echo "1️⃣  Testing INVALID Key (Expect Failure)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $FUNCTION_URL \
  -H "x-license-key: $INVALID_KEY")

if [ "$RESPONSE" != "200" ]; then
  echo "✅  SUCCESS: Blocked invalid key (Status: $RESPONSE)"
else
  echo "❌  FAIL: Allowed invalid key! (Status: $RESPONSE)"
fi

echo "----------------------------------------"

# 2. Test Valid Key (User must provide)
if [ -z "$1" ]; then
  echo "⚠️  To test a VALID key, run this script with the key as an argument:"
  echo "   ./test_gatekeeper.sh <your-uuid-license-key>"
else
  VALID_KEY=$1
  echo "2️⃣  Testing VALID Key: $VALID_KEY"
  RESPONSE=$(curl -s -X POST $FUNCTION_URL \
    -H "x-license-key: $VALID_KEY")
  
  if [[ $RESPONSE == *"valid\":true"* ]]; then
    echo "✅  SUCCESS: Verified valid key!"
    echo "   Response: $RESPONSE"
  else
    echo "❌  FAIL: Could not verify valid key."
    echo "   Response: $RESPONSE"
  fi
fi
echo "----------------------------------------"
