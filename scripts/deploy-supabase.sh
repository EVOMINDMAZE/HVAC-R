#!/bin/bash

# ============================================
# Supabase Deployment Script
# ============================================
# Usage: ./scripts/deploy-supabase.sh [options]
# Options:
#   --db-only        Deploy only database migrations
#   --functions-only Deploy only Edge Functions
#   --function NAME  Deploy a specific function
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
SUPABASE_PROJECT_REF="rxqflxmzsqhqrzffcsej"

# Flags
DB_ONLY=false
FUNCTIONS_ONLY=false
SPECIFIC_FUNCTION=""
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --db-only) DB_ONLY=true; shift ;;
        --functions-only) FUNCTIONS_ONLY=true; shift ;;
        --function) SPECIFIC_FUNCTION="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help)
            head -15 "$0" | tail -10
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

# All Edge Functions
FUNCTIONS=(
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

check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found"
        log_info "Install with: npm install -g supabase"
        exit 1
    fi
    log_info "Supabase CLI: $(supabase --version)"
}

link_project() {
    log_info "Checking Supabase project link..."
    
    cd "$PROJECT_ROOT"
    
    # Check if already linked
    if [ -f "supabase/.temp/project-ref" ]; then
        local current_ref=$(cat supabase/.temp/project-ref)
        if [ "$current_ref" = "$SUPABASE_PROJECT_REF" ]; then
            log_info "Already linked to $SUPABASE_PROJECT_REF"
            return 0
        fi
    fi
    
    log_info "Linking to project $SUPABASE_PROJECT_REF..."
    run_cmd "supabase link --project-ref $SUPABASE_PROJECT_REF"
}

deploy_migrations() {
    if [ "$FUNCTIONS_ONLY" = true ]; then
        return 0
    fi
    
    echo -e "\n${CYAN}=== Deploying Database Migrations ===${NC}\n"
    
    cd "$PROJECT_ROOT"
    
    # Count migrations
    local migration_count=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
    log_info "Found $migration_count migration files"
    
    # Push migrations
    log_info "Pushing migrations to Supabase..."
    run_cmd "supabase db push"
    
    log_success "Database migrations applied"
}

deploy_functions() {
    if [ "$DB_ONLY" = true ]; then
        return 0
    fi
    
    echo -e "\n${CYAN}=== Deploying Edge Functions ===${NC}\n"
    
    cd "$PROJECT_ROOT"
    
    local functions_to_deploy=()
    
    if [ -n "$SPECIFIC_FUNCTION" ]; then
        # Deploy specific function
        if [[ " ${FUNCTIONS[*]} " =~ " ${SPECIFIC_FUNCTION} " ]]; then
            functions_to_deploy+=("$SPECIFIC_FUNCTION")
        else
            log_error "Unknown function: $SPECIFIC_FUNCTION"
            log_info "Available functions: ${FUNCTIONS[*]}"
            exit 1
        fi
    else
        # Deploy all functions
        functions_to_deploy=("${FUNCTIONS[@]}")
    fi
    
    local succeeded=0
    local failed=()
    
    for func in "${functions_to_deploy[@]}"; do
        log_info "Deploying: $func"
        if run_cmd "supabase functions deploy $func --no-verify-jwt 2>&1"; then
            ((succeeded++))
            log_success "Deployed: $func"
        else
            failed+=("$func")
            log_warning "Failed: $func"
        fi
    done
    
    echo ""
    log_info "Deployment results: $succeeded/${#functions_to_deploy[@]} succeeded"
    
    if [ ${#failed[@]} -gt 0 ]; then
        log_warning "Failed functions: ${failed[*]}"
    fi
}

verify_deployment() {
    echo -e "\n${CYAN}=== Verifying Deployment ===${NC}\n"
    
    # Check if functions are listed
    log_info "Checking deployed functions..."
    
    if [ "$DRY_RUN" = false ]; then
        run_cmd "supabase functions list 2>/dev/null | head -30 || echo 'Unable to list functions'"
    fi
    
    log_success "Verification complete"
}

# Main
main() {
    echo -e "${CYAN}"
    echo "  Supabase Deployment Script"
    echo "  Project: $SUPABASE_PROJECT_REF"
    echo -e "${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE"
    fi
    
    check_supabase_cli
    link_project
    deploy_migrations
    deploy_functions
    verify_deployment
    
    echo ""
    log_success "Supabase deployment complete!"
    
    echo ""
    echo "Quick reference:"
    echo "  - Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF"
    echo "  - Functions: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/functions"
    echo "  - Database: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_REF/editor"
}

main "$@"
