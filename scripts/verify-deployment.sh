#!/usr/bin/env bash

# ============================================
# Deployment Verification Script
# ============================================
# Usage: ./scripts/verify-deployment.sh [options]
# Options:
#   --verbose        Show detailed output
#   -h, --help       Show this help message

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Flags
VERBOSE=false

# Counters
OK_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose) VERBOSE=true; shift ;;
        -h|--help)
            head -12 "$0" | tail -8
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

log_check() {
    local name="$1"
    local status="$2"
    local details="$3"
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}[OK]${NC} $name"
        OK_COUNT=$((OK_COUNT + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}[WARN]${NC} $name"
        WARN_COUNT=$((WARN_COUNT + 1))
    else
        echo -e "${RED}[FAIL]${NC} $name"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    if [ "$VERBOSE" = true ] && [ -n "$details" ]; then
        echo "     $details"
    fi
}

# Load environment
cd "$PROJECT_ROOT"
if [ -f ".env" ]; then
    source .env 2>/dev/null || true
fi

echo -e "${CYAN}"
echo "  Deployment Verification"
echo "  ========================"
echo -e "${NC}"

# ============================================
# 1. Environment Check
# ============================================
echo -e "\n${BLUE}1. Environment${NC}"

if [ -n "$VITE_SUPABASE_URL" ]; then
    log_check "VITE_SUPABASE_URL" "OK" "$VITE_SUPABASE_URL"
else
    log_check "VITE_SUPABASE_URL" "FAIL" "Not set"
fi

if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    log_check "VITE_SUPABASE_ANON_KEY" "OK" "Set (${#VITE_SUPABASE_ANON_KEY} chars)"
else
    log_check "VITE_SUPABASE_ANON_KEY" "FAIL" "Not set"
fi

# ============================================
# 2. Build Artifacts
# ============================================
echo -e "\n${BLUE}2. Build Artifacts${NC}"

if [ -d "dist/spa" ] && [ -f "dist/spa/index.html" ]; then
    file_count=$(find dist/spa -type f 2>/dev/null | wc -l | tr -d ' ')
    log_check "Client Build (dist/spa)" "OK" "$file_count files"
else
    log_check "Client Build (dist/spa)" "FAIL" "Not found"
fi

if [ -f "dist/server/node-build.mjs" ]; then
    size=$(du -h dist/server/node-build.mjs 2>/dev/null | cut -f1)
    log_check "Server Build" "OK" "$size"
else
    log_check "Server Build" "FAIL" "Not found"
fi

# ============================================
# 3. Supabase Connection
# ============================================
echo -e "\n${BLUE}3. Supabase Connection${NC}"

if [ -n "$VITE_SUPABASE_URL" ] && [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
    # Test database connection using node
    db_result=$(node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('$VITE_SUPABASE_URL', '$VITE_SUPABASE_ANON_KEY');
    
    (async () => {
        try {
            const { data, error } = await supabase.from('companies').select('count').limit(1);
            if (error) {
                console.log('FAIL');
            } else {
                console.log('OK');
            }
        } catch (e) {
            console.log('FAIL');
        }
    })();
    " 2>/dev/null || echo "FAIL")
    
    if [ "$db_result" = "OK" ]; then
        log_check "Database Connection" "OK"
    else
        log_check "Database Connection" "FAIL" "Connection error"
    fi
    
    # Test AI tables
    ai_result=$(node -e "
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('$VITE_SUPABASE_URL', '$VITE_SUPABASE_ANON_KEY');
    
    (async () => {
        try {
            const { error: e1 } = await supabase.from('ai_learning_patterns').select('count').limit(1);
            const { error: e2 } = await supabase.from('diagnostic_outcomes').select('count').limit(1);
            if (e1 || e2) {
                console.log('FAIL');
            } else {
                console.log('OK');
            }
        } catch (e) {
            console.log('FAIL');
        }
    })();
    " 2>/dev/null || echo "FAIL")
    
    if [ "$ai_result" = "OK" ]; then
        log_check "AI Tables" "OK" "ai_learning_patterns, diagnostic_outcomes"
    else
        log_check "AI Tables" "FAIL" "Tables not accessible"
    fi
else
    log_check "Database Connection" "FAIL" "Missing credentials"
    log_check "AI Tables" "FAIL" "Missing credentials"
fi

# ============================================
# 4. Supabase CLI
# ============================================
echo -e "\n${BLUE}4. Supabase CLI${NC}"

if command -v supabase &> /dev/null; then
    version=$(supabase --version 2>/dev/null)
    log_check "Supabase CLI" "OK" "$version"
    
    # Check project link
    if [ -f "supabase/.temp/project-ref" ]; then
        ref=$(cat supabase/.temp/project-ref)
        log_check "Project Linked" "OK" "$ref"
    else
        log_check "Project Linked" "WARN" "Not linked"
    fi
else
    log_check "Supabase CLI" "WARN" "Not installed"
fi

# ============================================
# 5. Netlify CLI
# ============================================
echo -e "\n${BLUE}5. Netlify CLI${NC}"

if command -v netlify &> /dev/null; then
    version=$(netlify --version 2>/dev/null | head -1)
    log_check "Netlify CLI" "OK" "$version"
else
    log_check "Netlify CLI" "WARN" "Not installed"
fi

# ============================================
# 6. Render Service
# ============================================
echo -e "\n${BLUE}6. Render Service${NC}"

if [ -n "$RENDER_SERVICE_URL" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_SERVICE_URL/health" 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        log_check "Render Health" "OK" "HTTP 200"
    else
        log_check "Render Health" "WARN" "HTTP $response"
    fi
else
    log_check "Render Health" "WARN" "URL not configured"
fi

# ============================================
# 7. Edge Functions Count
# ============================================
echo -e "\n${BLUE}7. Edge Functions${NC}"

func_count=$(ls -d supabase/functions/*/ 2>/dev/null | grep -v "_shared" | wc -l | tr -d ' ')
log_check "Local Functions" "OK" "$func_count functions"

# ============================================
# Summary
# ============================================
echo -e "\n${CYAN}========================================${NC}"
echo -e "${CYAN}Summary${NC}"
echo -e "${CYAN}========================================${NC}"

echo -e "${GREEN}Passed: $OK_COUNT${NC}"
echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

# Exit code
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
else
    exit 0
fi
