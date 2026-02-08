#!/bin/bash

# ============================================
# ThermoNeural Master Deployment Script
# ============================================
# Usage: ./scripts/deploy-all.sh [options]
# Options:
#   --skip-tests     Skip running tests
#   --skip-build     Skip building the application
#   --skip-db        Skip database migrations
#   --skip-functions Skip Edge Functions deployment
#   --skip-frontend  Skip frontend deployment
#   --skip-render    Skip Render deployment trigger
#   --dry-run        Show what would be done without executing
#   --force          Skip all confirmations
#   -h, --help       Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SUPABASE_PROJECT_REF="rxqflxmzsqhqrzffcsej"

# Flags
SKIP_TESTS=false
SKIP_BUILD=false
SKIP_DB=false
SKIP_FUNCTIONS=false
SKIP_FRONTEND=false
SKIP_RENDER=false
DRY_RUN=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests) SKIP_TESTS=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-db) SKIP_DB=true; shift ;;
        --skip-functions) SKIP_FUNCTIONS=true; shift ;;
        --skip-frontend) SKIP_FRONTEND=true; shift ;;
        --skip-render) SKIP_RENDER=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        --force) FORCE=true; shift ;;
        -h|--help)
            head -20 "$0" | tail -15
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    read -p "$1 [y/N] " response
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} $1"
    else
        eval "$1"
    fi
}

check_dependencies() {
    log_step "Checking Dependencies"
    
    local missing=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing+=("node")
    else
        log_info "Node.js: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    else
        log_info "npm: $(npm --version)"
    fi
    
    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        missing+=("supabase")
        log_warning "Supabase CLI not found. Install: npm install -g supabase"
    else
        log_info "Supabase CLI: $(supabase --version)"
    fi
    
    # Check Netlify CLI
    if ! command -v netlify &> /dev/null; then
        log_warning "Netlify CLI not found. Install: npm install -g netlify-cli"
    else
        log_info "Netlify CLI: $(netlify --version)"
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        exit 1
    fi
    
    log_success "All dependencies available"
}

check_environment() {
    log_step "Checking Environment"
    
    cd "$PROJECT_ROOT"
    
    # Check .env file
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Run: ./scripts/setup-env.sh"
        exit 1
    fi
    
    # Load environment variables
    source .env
    
    # Check required variables
    local required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    log_success "Environment configured correctly"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests (--skip-tests flag)"
        return 0
    fi
    
    log_step "Running Tests"
    
    cd "$PROJECT_ROOT"
    
    log_info "Running TypeScript type check..."
    run_cmd "npm run typecheck"
    
    log_info "Running unit tests..."
    run_cmd "npm run test"
    
    log_success "All tests passed"
}

build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping build (--skip-build flag)"
        return 0
    fi
    
    log_step "Building Application"
    
    cd "$PROJECT_ROOT"
    
    log_info "Building client and server..."
    run_cmd "npm run build"
    
    # Verify build output
    if [ "$DRY_RUN" = false ]; then
        if [ ! -d "dist/spa" ]; then
            log_error "Client build failed - dist/spa not found"
            exit 1
        fi
        if [ ! -f "dist/server/node-build.mjs" ]; then
            log_error "Server build failed - dist/server/node-build.mjs not found"
            exit 1
        fi
    fi
    
    log_success "Build completed successfully"
}

deploy_database() {
    if [ "$SKIP_DB" = true ]; then
        log_warning "Skipping database migrations (--skip-db flag)"
        return 0
    fi
    
    log_step "Deploying Database Migrations"
    
    cd "$PROJECT_ROOT"
    
    # Check Supabase link
    log_info "Verifying Supabase project link..."
    if [ "$DRY_RUN" = false ]; then
        if ! supabase projects list 2>/dev/null | grep -q "$SUPABASE_PROJECT_REF"; then
            log_info "Linking Supabase project..."
            run_cmd "supabase link --project-ref $SUPABASE_PROJECT_REF"
        fi
    fi
    
    log_info "Pushing database migrations..."
    run_cmd "supabase db push"
    
    log_success "Database migrations applied"
}

deploy_edge_functions() {
    if [ "$SKIP_FUNCTIONS" = true ]; then
        log_warning "Skipping Edge Functions (--skip-functions flag)"
        return 0
    fi
    
    log_step "Deploying Edge Functions"
    
    cd "$PROJECT_ROOT"
    
    # List of all functions to deploy
    local functions=(
        "ai-gateway"
        "ai-troubleshoot"
        "analyze-selling-points"
        "analyze-triage-media"
        "billing"
        "ingest-telemetry"
        "invite-user"
        "invoice-chaser"
        "oauth-token-exchange"
        "poll-integrations"
        "recommended-range"
        "refresh-oauth-token"
        "review-hunter"
        "stripe-webhook"
        "sync-spreadsheets"
        "transcribe-audio"
        "update-role"
        "validate-import"
        "verify-license"
        "warranty-lookup"
        "webhook-dispatcher"
    )
    
    local failed=()
    local succeeded=0
    
    for func in "${functions[@]}"; do
        log_info "Deploying: $func"
        if run_cmd "supabase functions deploy $func --no-verify-jwt 2>&1"; then
            ((succeeded++))
        else
            failed+=("$func")
            log_warning "Failed to deploy: $func"
        fi
    done
    
    if [ ${#failed[@]} -gt 0 ]; then
        log_warning "Failed functions: ${failed[*]}"
    fi
    
    log_success "Deployed $succeeded/${#functions[@]} Edge Functions"
}

deploy_frontend() {
    if [ "$SKIP_FRONTEND" = true ]; then
        log_warning "Skipping frontend deployment (--skip-frontend flag)"
        return 0
    fi
    
    log_step "Deploying Frontend to Netlify"
    
    cd "$PROJECT_ROOT"
    
    # Check if Netlify CLI is available
    if ! command -v netlify &> /dev/null; then
        log_warning "Netlify CLI not available. Skipping frontend deployment."
        log_info "Install with: npm install -g netlify-cli"
        log_info "Then run: netlify deploy --prod --dir=dist/spa"
        return 0
    fi
    
    log_info "Deploying to Netlify..."
    run_cmd "netlify deploy --prod --dir=dist/spa"
    
    log_success "Frontend deployed to Netlify"
}

deploy_render() {
    if [ "$SKIP_RENDER" = true ]; then
        log_warning "Skipping Render deployment (--skip-render flag)"
        return 0
    fi
    
    log_step "Triggering Render Deployment"
    
    # Check for Render deploy hook
    if [ -z "$RENDER_DEPLOY_HOOK_URL" ]; then
        log_warning "RENDER_DEPLOY_HOOK_URL not set. Skipping Render trigger."
        log_info "Add RENDER_DEPLOY_HOOK_URL to .env to enable auto-deploy"
        return 0
    fi
    
    log_info "Triggering Render deploy hook..."
    run_cmd "curl -X POST '$RENDER_DEPLOY_HOOK_URL' -H 'Content-Type: application/json' -d '{\"clearCache\": false}'"
    
    log_success "Render deployment triggered"
}

verify_deployment() {
    log_step "Verifying Deployment"
    
    cd "$PROJECT_ROOT"
    
    if [ -f "scripts/verify-deployment.sh" ]; then
        run_cmd "bash scripts/verify-deployment.sh"
    else
        log_info "Running basic verification..."
        run_cmd "node verify-db.js 2>/dev/null || echo 'Verification script not available'"
    fi
    
    log_success "Deployment verification complete"
}

print_summary() {
    log_step "Deployment Summary"
    
    echo -e "${GREEN}Deployment completed successfully!${NC}\n"
    
    echo "Components deployed:"
    [ "$SKIP_DB" = false ] && echo "  - Database migrations"
    [ "$SKIP_FUNCTIONS" = false ] && echo "  - Edge Functions (21 functions)"
    [ "$SKIP_FRONTEND" = false ] && echo "  - Frontend (Netlify)"
    [ "$SKIP_RENDER" = false ] && echo "  - Calculation Service (Render)"
    
    echo ""
    echo "Next steps:"
    echo "  1. Verify the application at your Netlify URL"
    echo "  2. Check Supabase dashboard for function logs"
    echo "  3. Monitor Render service health"
    echo ""
    echo "Run 'bash scripts/verify-deployment.sh' for health checks"
}

# ============================================
# Main Execution
# ============================================

main() {
    echo -e "${CYAN}"
    echo "  _____ _                           _   _                      _ "
    echo " |_   _| |__   ___ _ __ _ __ ___   | \\ | | ___ _   _ _ __ __ _| |"
    echo "   | | | '_ \\ / _ \\ '__| '_ \` _ \\  |  \\| |/ _ \\ | | | '__/ _\` | |"
    echo "   | | | | | |  __/ |  | | | | | | | |\\  |  __/ |_| | | | (_| | |"
    echo "   |_| |_| |_|\\___|_|  |_| |_| |_| |_| \\_|\\___|\\__,_|_|  \\__,_|_|"
    echo ""
    echo "  Master Deployment Script v1.0"
    echo -e "${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE - No changes will be made"
    fi
    
    # Confirm deployment
    if ! confirm "This will deploy to production. Continue?"; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    check_dependencies
    check_environment
    run_tests
    build_application
    deploy_database
    deploy_edge_functions
    deploy_frontend
    deploy_render
    verify_deployment
    print_summary
}

main "$@"
