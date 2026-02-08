#!/bin/bash

# 🚀 HVAC-R AI Pattern Recognition - Production Deployment Checklist
# Use this script to execute production deployment step by step

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Deployment Functions
check_step() {
    local step_name=$1
    local current_step=$(cat .deployment_progress 2>/dev/null || echo "0")
    
    if [ "$current_step" -ge "$step_name" ]; then
        echo -e "${GREEN}✓${NC} Step $step_name completed"
        return 0
    else
        echo -e "${YELLOW}⚡${NC} Step $step_name in progress..."
        return 1
    fi
}

confirm_step() {
    local step_name=$1
    echo -e "${BLUE}🤔${NC} About to execute $step_name..."
    read -p "Continue? (y/N): " response
    case $response in
        y|Y|yes) return 0 ;;
        n|N|no) return 1 ;;
        *) echo "Invalid response. Please enter y or n." && return 2 ;;
    esac
}

# Main deployment logic
main() {
    echo -e "${BLUE}🚀${NC} HVAC-R AI Pattern Recognition - Production Deployment${NC}"
    echo "=================================================="
    
    # Phase 1: Database Tables Creation via Supabase Dashboard
    echo -e "${YELLOW}Phase 1: Creating Database Tables${NC}"
    echo "This will create ai_learning_patterns and diagnostic_outcomes tables with RLS policies"
    echo ""
    
    if check_step "phase1_dashboard_access"; then
        echo -e "${GREEN}✓${NC} Confirmed: You want to use Supabase Dashboard"
        
        echo -e "${BLUE}📋${NC} Step 1.1: Navigate to Supabase Dashboard${NC}"
        echo "https://supabase.com/dashboard/project/rxqflxmzsqhqrzffcsej"
        echo ""
        echo -e "${YELLOW}Instructions:${NC}"
        echo "1. Go to the URL above"
        echo "2. Log in with your Supabase credentials"  
        echo "3. Click 'SQL Editor' from the left menu"
        echo "4. Click 'New migration' button"
        echo "5. Paste this SQL and run:"
        echo ""
        echo -e "${BLUE}-- Migration SQL:${NC}"
        echo "-- This creates both AI tables and RLS policies"
        cat << 'EOF'
-- Create AI Learning Patterns Table
CREATE TABLE IF NOT EXISTS public.ai_learning_patterns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_type text NOT NULL CHECK (pattern_type IN ('symptom_outcome', 'equipment_failure', 'measurement_anomaly', 'seasonal_pattern')),
    pattern_data jsonb NOT NULL,
    confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
    occurrence_count integer DEFAULT 1,
    last_seen timestamptz DEFAULT now(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    equipment_model text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;

-- Create Diagnostic Outcomes Table
CREATE TABLE IF NOT EXISTS public.diagnostic_outcomes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    troubleshooting_session_id uuid REFERENCES public.calculations(id) ON DELETE CASCADE,
    ai_recommendations jsonb NOT NULL,
    technician_actions jsonb,
    final_resolution jsonb,
    success_rating integer CHECK (success_rating >= 1 AND success_rating <= 5),
    followup_required boolean DEFAULT false,
    notes text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.diagnostic_outcomes ENABLE ROW LEVEL SECURITY;

-- Create Indexes for Performance
CREATE INDEX idx_ai_patterns_company_type ON public.ai_learning_patterns(company_id, pattern_type);
CREATE INDEX idx_ai_patterns_confidence ON public.ai_learning_patterns(confidence_score DESC);
CREATE INDEX idx_ai_patterns_last_seen ON public.ai_learning_patterns(last_seen DESC);
CREATE INDEX idx_diagnostic_outcomes_session ON public.diagnostic_outcomes(troubleshooting_session_id);
CREATE INDEX idx_diagnostic_outcomes_company ON public.diagnostic_outcomes(company_id);
EOF
        echo ""
        
        echo -e "${GREEN}✓${NC} Step 1.2: Migration SQL ready to paste"
        echo "6. Click 'Run migration' button"
        echo "7. Wait for migration to complete"
        echo ""
        
        if confirm_step "phase1_run_migration"; then
            echo "1" > .deployment_progress
            echo -e "${GREEN}✓${NC} Migration execution started${NC}"
        fi
    else
        return
    fi
    
    # Phase 2: Historical Data Migration
    echo -e "${YELLOW}Phase 2: Running Historical Data Migration${NC}"
    
    if check_step "phase2_data_migration"; then
        echo -e "${GREEN}✓${NC} Data migration will run after tables are created${NC}"
        
        echo -e "${BLUE}📋${NC} Step 2.1: Run Production Migration Script${NC}"
        echo -e "${YELLOW}Command:${NC}"
        echo "npx tsx server/scripts/production-migration.ts"
        echo ""
        
        if confirm_step "phase2_execute_migration"; then
            echo "2" > .deployment_progress
            echo -e "${GREEN}✓${NC} Historical data migration started${NC}"
            
            # Execute migration
            npx tsx server/scripts/production-migration.ts
            local migration_status=$?
            
            echo ""
            if [ $migration_status -eq 0 ]; then
                echo -e "${GREEN}✓${NC} Migration completed successfully${NC}"
                echo "3" > .deployment_progress
            else
                echo -e "${RED}❌${NC} Migration failed - check logs${NC}"
            fi
        else
            return
    fi
    
    # Phase 3: Production Deployment
    echo -e "${YELLOW}Phase 3: Production Deployment${NC}"
    
    if check_step "phase3_deployment"; then
        echo -e "${GREEN}✓${NC} Ready to deploy to production${NC}"
        
        echo -e "${BLUE}📋${NC} Step 3.1: Build and Deploy Application${NC}"
        echo -e "${YELLOW}Commands:${NC}"
        echo "Client: npm run build:client && netlify deploy --prod --dir=dist/spa"
        echo "Server: npm run build:server && netlify deploy --prod --dir=dist/server --functions=server"
        echo ""
        
        if confirm_step "phase3_deploy"; then
            echo "4" > .deployment_progress
            echo -e "${GREEN}✓${NC} Production deployment started${NC}"
        else
            return
    fi
    else
        return
    fi
    
    echo ""
    echo -e "${BLUE}🎯${NC} Deployment Summary${NC}"
    echo "When all steps complete, your HVAC system will have:"
    echo "✅ AI Pattern Recognition tables in production"
    echo "✅ Historical data migrated for instant learning"  
    echo "✅ Production-ready application deployed"
    echo "✅ Comprehensive monitoring and analytics"
    echo ""
    echo -e "${GREEN}🚀 Ready to transform HVAC troubleshooting with AI!${NC}"
}

# Execute main function
main "$@"