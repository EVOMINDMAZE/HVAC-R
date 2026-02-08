#!/bin/bash

# ============================================
# Environment Setup Script
# ============================================
# Usage: ./scripts/setup-env.sh
# 
# Interactive wizard to configure environment variables
# for ThermoNeural deployment.

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
ENV_FILE="$PROJECT_ROOT/.env"
ENV_TEMPLATE="$PROJECT_ROOT/.env.template"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

prompt_value() {
    local var_name="$1"
    local description="$2"
    local default_value="$3"
    local is_secret="$4"
    
    echo ""
    echo -e "${CYAN}$var_name${NC}"
    echo -e "  $description"
    
    if [ -n "$default_value" ] && [ "$is_secret" != "true" ]; then
        echo -e "  Default: $default_value"
    fi
    
    if [ "$is_secret" = "true" ]; then
        read -s -p "  Value (hidden): " value
        echo ""
    else
        read -p "  Value: " value
    fi
    
    if [ -z "$value" ] && [ -n "$default_value" ]; then
        value="$default_value"
    fi
    
    echo "$value"
}

# Main
main() {
    echo -e "${CYAN}"
    echo "  _____ _                           _   _                      _ "
    echo " |_   _| |__   ___ _ __ _ __ ___   | \\ | | ___ _   _ _ __ __ _| |"
    echo "   | | | '_ \\ / _ \\ '__| '_ \` _ \\  |  \\| |/ _ \\ | | | '__/ _\` | |"
    echo "   | | | | | |  __/ |  | | | | | | | |\\  |  __/ |_| | | | (_| | |"
    echo "   |_| |_| |_|\\___|_|  |_| |_| |_| |_| \\_|\\___|\\__,_|_|  \\__,_|_|"
    echo ""
    echo "  Environment Setup Wizard"
    echo -e "${NC}"
    
    # Check if .env exists
    if [ -f "$ENV_FILE" ]; then
        log_warning ".env file already exists"
        read -p "Overwrite existing configuration? [y/N] " overwrite
        if [[ ! "$overwrite" =~ ^[yY] ]]; then
            log_info "Setup cancelled"
            exit 0
        fi
        cp "$ENV_FILE" "$ENV_FILE.backup"
        log_info "Backup created: .env.backup"
    fi
    
    echo ""
    echo -e "${CYAN}=== Supabase Configuration ===${NC}"
    echo "Get these from: https://supabase.com/dashboard/project/_/settings/api"
    
    VITE_SUPABASE_URL=$(prompt_value \
        "VITE_SUPABASE_URL" \
        "Your Supabase project URL" \
        "https://rxqflxmzsqhqrzffcsej.supabase.co")
    
    VITE_SUPABASE_ANON_KEY=$(prompt_value \
        "VITE_SUPABASE_ANON_KEY" \
        "Your Supabase anon/public key" \
        "" \
        "true")
    
    SUPABASE_SERVICE_ROLE_KEY=$(prompt_value \
        "SUPABASE_SERVICE_ROLE_KEY" \
        "Your Supabase service role key (for server-side operations)" \
        "" \
        "true")
    
    SUPABASE_DB_PASSWORD=$(prompt_value \
        "SUPABASE_DB_PASSWORD" \
        "Your Supabase database password" \
        "" \
        "true")
    
    echo ""
    echo -e "${CYAN}=== Stripe Configuration ===${NC}"
    echo "Get these from: https://dashboard.stripe.com/apikeys"
    
    VITE_STRIPE_PUBLISHABLE_KEY=$(prompt_value \
        "VITE_STRIPE_PUBLISHABLE_KEY" \
        "Stripe publishable key (pk_...)" \
        "" \
        "false")
    
    STRIPE_SECRET_KEY=$(prompt_value \
        "STRIPE_SECRET_KEY" \
        "Stripe secret key (sk_...)" \
        "" \
        "true")
    
    STRIPE_WEBHOOK_SECRET=$(prompt_value \
        "STRIPE_WEBHOOK_SECRET" \
        "Stripe webhook secret (whsec_...)" \
        "" \
        "true")
    
    echo ""
    echo -e "${CYAN}=== Render Configuration ===${NC}"
    echo "Get deploy hook from: Render Dashboard > Your Service > Settings > Deploy Hook"
    
    RENDER_SERVICE_URL=$(prompt_value \
        "RENDER_SERVICE_URL" \
        "Your Render service URL (for health checks)" \
        "")
    
    RENDER_DEPLOY_HOOK_URL=$(prompt_value \
        "RENDER_DEPLOY_HOOK_URL" \
        "Render deploy hook URL (for auto-deploy)" \
        "" \
        "true")
    
    echo ""
    echo -e "${CYAN}=== Netlify Configuration (Optional) ===${NC}"
    echo "Only needed for CI/CD. Get from: Netlify Dashboard > Site Settings"
    
    NETLIFY_SITE_ID=$(prompt_value \
        "NETLIFY_SITE_ID" \
        "Netlify Site ID" \
        "")
    
    NETLIFY_AUTH_TOKEN=$(prompt_value \
        "NETLIFY_AUTH_TOKEN" \
        "Netlify personal access token" \
        "" \
        "true")
    
    # Write .env file
    echo ""
    log_info "Writing .env file..."
    
    cat > "$ENV_FILE" << EOF
# ============================================
# ThermoNeural Environment Configuration
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ============================================

# Supabase
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD=$SUPABASE_DB_PASSWORD

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# Render (Heavy Calculations)
RENDER_SERVICE_URL=$RENDER_SERVICE_URL
RENDER_DEPLOY_HOOK_URL=$RENDER_DEPLOY_HOOK_URL

# Netlify (CI/CD)
NETLIFY_SITE_ID=$NETLIFY_SITE_ID
NETLIFY_AUTH_TOKEN=$NETLIFY_AUTH_TOKEN

# Node Environment
NODE_ENV=development
EOF
    
    log_success ".env file created successfully"
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Setup Complete${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo "Your environment is now configured!"
    echo ""
    echo "Next steps:"
    echo "  1. Verify settings: cat .env"
    echo "  2. Run verification: ./scripts/verify-deployment.sh"
    echo "  3. Deploy: ./scripts/deploy-all.sh"
    echo ""
    echo "For GitHub Actions, add these secrets to your repository:"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_ACCESS_TOKEN"
    echo "  - SUPABASE_DB_PASSWORD"
    echo "  - NETLIFY_AUTH_TOKEN"
    echo "  - NETLIFY_SITE_ID"
    echo "  - RENDER_DEPLOY_HOOK_URL"
}

main "$@"
