#!/bin/bash

# ============================================
# Frontend Deployment Script (Netlify)
# ============================================
# Usage: ./scripts/deploy-frontend.sh [options]
# Options:
#   --preview        Deploy as preview (not production)
#   --skip-build     Skip building, deploy existing dist
#   --message MSG    Custom deploy message
#   --dry-run        Show what would be done
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
PREVIEW=false
SKIP_BUILD=false
DEPLOY_MESSAGE=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --preview) PREVIEW=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --message) DEPLOY_MESSAGE="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help)
            head -14 "$0" | tail -10
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $1"
    else
        eval "$1"
    fi
}

check_netlify_cli() {
    if ! command -v netlify &> /dev/null; then
        log_error "Netlify CLI not found"
        log_info "Install with: npm install -g netlify-cli"
        exit 1
    fi
    log_info "Netlify CLI: $(netlify --version)"
}

check_environment() {
    cd "$PROJECT_ROOT"
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found"
    else
        source .env
    fi
    
    # Check required build variables
    if [ -z "$VITE_SUPABASE_URL" ]; then
        log_error "VITE_SUPABASE_URL not set"
        exit 1
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        log_error "VITE_SUPABASE_ANON_KEY not set"
        exit 1
    fi
    
    log_success "Environment variables configured"
}

build_client() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping build (--skip-build flag)"
        return 0
    fi
    
    echo -e "\n${CYAN}=== Building Client ===${NC}\n"
    
    cd "$PROJECT_ROOT"
    
    log_info "Installing dependencies..."
    run_cmd "npm ci"
    
    log_info "Building client..."
    run_cmd "npm run build:client"
    
    # Verify build
    if [ "$DRY_RUN" = false ]; then
        if [ ! -d "dist/spa" ] || [ ! -f "dist/spa/index.html" ]; then
            log_error "Build failed - dist/spa not found"
            exit 1
        fi
        
        file_count=$(find dist/spa -type f | wc -l)
        total_size=$(du -sh dist/spa | cut -f1)
        log_info "Build output: $file_count files, $total_size total"
    fi
    
    log_success "Client build completed"
}

deploy_to_netlify() {
    echo -e "\n${CYAN}=== Deploying to Netlify ===${NC}\n"
    
    cd "$PROJECT_ROOT"
    
    # Verify dist exists
    if [ ! -d "dist/spa" ]; then
        log_error "dist/spa not found. Run build first or remove --skip-build"
        exit 1
    fi
    
    # Build deploy command
    local deploy_cmd="netlify deploy --dir=dist/spa"
    
    if [ "$PREVIEW" = false ]; then
        deploy_cmd="$deploy_cmd --prod"
        log_info "Deploying to PRODUCTION"
    else
        log_info "Deploying as PREVIEW"
    fi
    
    if [ -n "$DEPLOY_MESSAGE" ]; then
        deploy_cmd="$deploy_cmd --message \"$DEPLOY_MESSAGE\""
    else
        local commit_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        deploy_cmd="$deploy_cmd --message \"Deploy from script - $commit_sha\""
    fi
    
    # Execute deployment
    log_info "Running: $deploy_cmd"
    run_cmd "$deploy_cmd"
    
    log_success "Deployment complete"
}

print_summary() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}Deployment Summary${NC}"
    echo -e "${CYAN}========================================${NC}"
    
    if [ "$PREVIEW" = true ]; then
        echo -e "Type: ${YELLOW}Preview${NC}"
    else
        echo -e "Type: ${GREEN}Production${NC}"
    fi
    
    echo ""
    echo "Next steps:"
    echo "  1. Check Netlify dashboard for deploy status"
    echo "  2. Verify the site loads correctly"
    echo "  3. Test key functionality"
    echo ""
    echo "Useful commands:"
    echo "  netlify status      - Check site status"
    echo "  netlify open        - Open site in browser"
    echo "  netlify logs        - View function logs"
}

# Main
main() {
    echo -e "${CYAN}"
    echo "  Frontend Deployment (Netlify)"
    echo -e "${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE"
    fi
    
    check_netlify_cli
    check_environment
    build_client
    deploy_to_netlify
    print_summary
}

main "$@"
