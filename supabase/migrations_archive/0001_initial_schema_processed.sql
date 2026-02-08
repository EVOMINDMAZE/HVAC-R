--
-- PostgreSQL database dump
--

\restrict 8BhakXivIhnC13LsIGkrZ2F5Hrn4rN8CuRZDjWe07fEA31nYfSG9SBHlFztnopq

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.7 (Debian 17.7-3.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS storage;


--
-- Name: job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_status AS ENUM (
    'pending',
    'assigned',
    'en_route',
    'on_site',
    'completed',
    'cancelled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'client',
    'tech',
    'student',
    'technician',
    'manager'
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: audit_log_role_assigned(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.audit_log_role_assigned() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public.log_audit_event(
        'role_assigned',
        NEW.company_id,
        NEW.user_id,
        'user_role',
        NEW.user_id,
        jsonb_build_object(
            'role', NEW.role,
            'client_id', NEW.client_id
        )
    );
    RETURN NEW;
END;
$$;


--
-- Name: audit_log_role_changed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.audit_log_role_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.role != NEW.role THEN
        PERFORM public.log_audit_event(
            'role_changed',
            NEW.company_id,
            NEW.user_id,
            'user_role',
            NEW.user_id,
            jsonb_build_object(
                'old_role', OLD.role,
                'new_role', NEW.role
            )
        );
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: audit_log_role_removed(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.audit_log_role_removed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public.log_audit_event(
        'role_removed',
        OLD.company_id,
        OLD.user_id,
        'user_role',
        OLD.user_id,
        jsonb_build_object(
            'role', OLD.role
        )
    );
    RETURN OLD;
END;
$$;


--
-- Name: check_seat_limit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.check_seat_limit(p_company_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_company_id UUID;
    v_row RECORD;
BEGIN
    -- Determine target company
    v_company_id := COALESCE(
        p_company_id,
        (SELECT (raw_user_meta_data->>'active_company_id')::UUID FROM auth.users WHERE id = auth.uid())
    );

    -- Fetch company data into a RECORD
    SELECT subscription_tier, seat_limit, seat_usage
    INTO v_row
    FROM public.companies
    WHERE id = v_company_id;

    -- Handle missing company
    IF v_row IS NULL THEN
        RETURN jsonb_build_object(
            'can_add', FALSE,
            'error', 'Company not found',
            'seat_limit', 0,
            'seat_usage', 0,
            'tier', 'unknown'
        );
    END IF;

    -- Return proper JSONB object
    RETURN jsonb_build_object(
        'can_add', v_row.seat_usage < v_row.seat_limit,
        'seat_limit', v_row.seat_limit,
        'seat_usage', v_row.seat_usage,
        'available', v_row.seat_limit - v_row.seat_usage,
        'tier', v_row.subscription_tier,
        'company_id', v_company_id
    );
END;
$$;


--
-- Name: check_user_can_access_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.check_user_can_access_company(p_company_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_has_access BOOLEAN := FALSE;
    v_reason TEXT := 'Access denied';
    v_requires_skool BOOLEAN := FALSE;
    v_has_skool BOOLEAN := FALSE;
    v_company_name TEXT;
BEGIN
    -- Check basic membership
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = p_company_id
    ) THEN
        v_has_access := TRUE;
        v_reason := 'Direct member';
    ELSIF EXISTS (
        SELECT 1 FROM public.companies
        WHERE user_id = auth.uid() AND id = p_company_id
    ) THEN
        v_has_access := TRUE;
        v_reason := 'Company owner';
    END IF;
    
    -- Check if company requires Skool
    SELECT c.skool_community_id, c.name
    INTO v_requires_skool, v_company_name
    FROM public.companies c
    WHERE c.id = p_company_id;
    
    IF v_requires_skool IS NOT NULL AND v_requires_skool != '' THEN
        SELECT verify_skool_subscription(v_requires_skool) INTO v_has_skool;
        
        IF NOT v_has_skool THEN
            v_has_access := FALSE;
            v_reason := 'Active Skool subscription required for ' || v_company_name;
        ELSE
            v_reason := v_reason || ' + Skool verified';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'has_access', v_has_access,
        'reason', v_reason,
        'requires_skool', v_requires_skool IS NOT NULL AND v_requires_skool != '',
        'skool_verified', v_has_skool
    );
END;
$$;


--
-- Name: company_requires_skool(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.company_requires_skool(p_company_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_requires BOOLEAN;
    v_community_id TEXT;
BEGIN
    v_community_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    )::TEXT;
    
    -- Check if any invite in company requires Skool
    SELECT EXISTS (
        SELECT 1 FROM public.invite_codes ic
        WHERE ic.company_id = v_community_id::UUID
        AND ic.skool_subscription_required = TRUE
        AND ic.expires_at > NOW()
        AND ic.current_uses < ic.max_uses
    ) INTO v_requires;
    
    RETURN v_requires;
END;
$$;


--
-- Name: create_invitation_link(uuid, text, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.create_invitation_link(p_company_id uuid, p_role text, p_expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval), p_max_uses integer DEFAULT 1) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_slug TEXT;
    v_has_permission BOOLEAN;
BEGIN
    -- Permission check: user must be admin/manager of the company
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND company_id = p_company_id
          AND role IN ('admin', 'manager')
    ) INTO v_has_permission;

    IF NOT v_has_permission THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission to create invitation links for this company');
    END IF;

    -- Generate unique slug
    LOOP
        v_slug := encode(gen_random_bytes(8), 'hex');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invitation_links WHERE slug = v_slug);
    END LOOP;

    -- Insert the invitation link
    INSERT INTO public.invitation_links (
        slug, company_id, role, expires_at, max_uses, created_by
    ) VALUES (
        v_slug, p_company_id, p_role, p_expires_at, p_max_uses, auth.uid()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'slug', v_slug,
        'link', '/invite/' || v_slug
    );
END;
$$;


--
-- Name: create_job_from_alert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.create_job_from_alert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_client_id UUID;
    v_asset_name TEXT;
    v_active_job_exists BOOLEAN;
BEGIN
    -- Only proceed for Critical alerts
    IF NEW.severity != 'critical' THEN
        RETURN NEW;
    END IF;

    -- Get Asset Details
    SELECT client_id, name INTO v_client_id, v_asset_name
    FROM public.assets
    WHERE id = NEW.asset_id;

    -- Check if an active/pending job already exists for this asset
    SELECT EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE asset_id = NEW.asset_id 
        AND status IN ('active', 'pending')
    ) INTO v_active_job_exists;

    -- If no active job, create one!
    IF NOT v_active_job_exists THEN
        INSERT INTO public.jobs (
            user_id, -- Assign to the Admin who owns the client
            job_name,
            client_name, -- Legacy text field
            status,
            notes,
            client_id,
            asset_id,
            created_at
        )
        SELECT 
            c.user_id,
            'CRITICAL: ' || v_asset_name || ' - Alert', -- Removed rule_name, added generic suffix
            cl.name,
            'active',
            'Auto-generated by System based on Critical Alert: ' || NEW.message,
            v_client_id,
            NEW.asset_id,
            NOW()
        FROM public.clients cl
        JOIN public.companies c ON cl.company_id = c.id
        WHERE cl.id = v_client_id;
        
        RAISE NOTICE 'Auto-created job for Asset %', v_asset_name;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: debug_get_companies(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.debug_get_companies(target_user_id uuid) RETURNS TABLE(company_id uuid, company_name text, role text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    -- 1. Active Roles
    SELECT c.id, c.name as company_name, ur.role::TEXT
    FROM public.companies c
    JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = target_user_id
    
    UNION
    
    -- 2. Owned Companies
    SELECT c.id, c.name as company_name, 'owner'::TEXT as role
    FROM public.companies c
    WHERE c.user_id = target_user_id
    
    ORDER BY company_name ASC;
END;
$$;


--
-- Name: get_company_audit_logs(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_company_audit_logs(p_company_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, user_id uuid, action text, entity_type text, entity_id uuid, details jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.created_at
    FROM public.audit_logs al
    WHERE al.company_id = COALESCE(p_company_id, al.company_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


--
-- Name: get_company_settings(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_company_settings(p_company_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_company_id UUID;
    v_settings JSONB;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    SELECT to_jsonb(cs) INTO v_settings
    FROM public.company_settings cs
    WHERE cs.company_id = v_company_id;

    IF v_settings IS NULL THEN
        -- Return default settings
        RETURN jsonb_build_object(
            'theme', 'system',
            'primary_color', '#3b82f6',
            'email_notifications', TRUE,
            'job_created_notifications', TRUE,
            'job_completed_notifications', TRUE,
            'invite_sent_notifications', TRUE,
            'default_role', 'tech',
            'auto_assign_jobs', FALSE,
            'require_approval_for_jobs', FALSE,
            'timezone', 'America/New_York',
            'date_format', 'MM/dd/yyyy',
            'currency', 'USD',
            'enable_client_portal', TRUE,
            'enable_dispatch_board', TRUE,
            'enable_inventory', FALSE,
            'company_id', v_company_id
        );
    END IF;

    RETURN v_settings;
END;
$$;


--
-- Name: get_company_subscription(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_company_subscription(p_company_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_company_id UUID;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    RETURN jsonb_build_object(
        'tier', (SELECT subscription_tier FROM public.companies WHERE id = v_company_id),
        'seat_limit', (SELECT seat_limit FROM public.companies WHERE id = v_company_id),
        'seat_usage', (SELECT seat_usage FROM public.companies WHERE id = v_company_id),
        'available', (SELECT seat_limit - seat_usage FROM public.companies WHERE id = v_company_id),
        'status', (SELECT subscription_status FROM public.companies WHERE id = v_company_id),
        'expires_at', (SELECT subscription_expires_at FROM public.companies WHERE id = v_company_id)
    );
END;
$$;


--
-- Name: get_company_team(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_company_team() RETURNS TABLE(user_id uuid, role text, email text, full_name text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
    req_role TEXT;
    req_company UUID;
BEGIN
    -- 1. Get Requester's Context
    req_role := public.get_my_role()::TEXT;
    req_company := public.get_my_company_id();
    
    -- 2. Verify Permissions
    IF req_role NOT IN ('admin', 'manager') OR req_company IS NULL THEN
        RAISE EXCEPTION 'Access Denied: Only Admins and Managers can view team details. (Role: %, Company: %)', req_role, req_company;
    END IF;

    -- 3. Return Team Data
    RETURN QUERY
    SELECT 
        ft.user_id,
        ft.role,
        COALESCE(ft.email, 'Pending Invite'),
        COALESCE(ft.full_name, 'Unknown')
    FROM (
        SELECT 
            ur.user_id as user_id,
            ur.role::TEXT as role,
            au.email::TEXT as email,
            (au.raw_user_meta_data->>'full_name')::TEXT as full_name
        FROM 
            public.user_roles ur
        JOIN 
            auth.users au ON ur.user_id = au.id
        WHERE 
            ur.company_id = req_company
        
        UNION ALL
        
        -- Also include the company owner if they don't have a record in user_roles
        SELECT 
            c.user_id as user_id,
            'admin'::TEXT as role,
            au.email::TEXT as email,
            (au.raw_user_meta_data->>'full_name')::TEXT as full_name
        FROM 
            public.companies c
        JOIN 
            auth.users au ON c.user_id = au.id
        WHERE 
            c.id = req_company
            AND NOT EXISTS (
                SELECT 1 FROM public.user_roles nested_ur 
                WHERE nested_ur.user_id = c.user_id
            )
    ) ft
    ORDER BY 
        CASE WHEN ft.role = 'admin' THEN 1
             WHEN ft.role = 'manager' THEN 2
             ELSE 3 
        END ASC,
        ft.email ASC;
END;
$$;


--
-- Name: get_my_companies(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_companies() RETURNS TABLE(company_id uuid, company_name text, role text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    -- 1. Active Roles
    SELECT c.id, c.name, ur.role::TEXT
    FROM public.companies c
    JOIN public.user_roles ur ON c.id = ur.company_id
    WHERE ur.user_id = auth.uid()
    
    UNION
    
    -- 2. Owned Companies (Implicit Admin/Owner role)
    SELECT c.id, c.name, 'owner'::TEXT as role
    FROM public.companies c
    WHERE c.user_id = auth.uid()
    
    ORDER BY company_name ASC;
END;
$$;


--
-- Name: get_my_company_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_company_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    active_id UUID;
    valid_id UUID;
BEGIN
    -- 1. Try to get from metadata
    SELECT (raw_user_meta_data->>'active_company_id')::UUID
    INTO active_id
    FROM auth.users
    WHERE id = auth.uid();

    -- 2. If present, verify membership
    IF active_id IS NOT NULL THEN
        SELECT company_id INTO valid_id
        FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = active_id;
        
        -- If user is still a member of that active company, return it
        IF valid_id IS NOT NULL THEN
            RETURN valid_id;
        END IF;
    END IF;

    -- 3. Fallback: Return first company found (existing logic)
    SELECT company_id INTO valid_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC -- consistent ordering
    LIMIT 1;

    -- 4. Fallback for Owners (if not in user_roles)
    IF valid_id IS NULL THEN
        SELECT id INTO valid_id
        FROM public.companies
        WHERE user_id = auth.uid()
        LIMIT 1;
    END IF;

    RETURN valid_id;
END;
$$;


--
-- Name: get_my_company_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_company_id(p_company_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- For now, redirect to the session user's company
    RETURN public.get_my_company_id();
END;
$$;


--
-- Name: get_my_company_metadata(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_company_metadata() RETURNS TABLE(id uuid, name text, logo_url text, website text, phone text, email text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    cid UUID;
BEGIN
    -- 1. Resolve Company ID
    cid := public.get_my_company_id();
    
    -- 2. Return specific safe columns
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.logo_url,
        c.website,
        c.phone,
        c.email
    FROM public.companies c
    WHERE c.id = cid;
END;
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS public.user_role
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    r public.user_role;
    is_owner BOOLEAN;
BEGIN
    SELECT role INTO r
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF r IS NULL THEN
        -- Check if they are an owner in companies table
        SELECT EXISTS(SELECT 1 FROM public.companies WHERE user_id = auth.uid()) INTO is_owner;
        IF is_owner THEN
            RETURN 'admin'::public.user_role;
        END IF;
    END IF;

    RETURN r;
END;
$$;


--
-- Name: get_my_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_my_role(p_company_id uuid DEFAULT NULL::uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result TEXT;
    v_company_id UUID;
BEGIN
    v_company_id := COALESCE(
        p_company_id,
        (SELECT raw_user_meta_data->>'active_company_id' FROM auth.users WHERE id = auth.uid())::UUID
    );

    SELECT role INTO v_result
    FROM public.user_roles
    WHERE user_id = auth.uid() AND company_id = v_company_id;

    IF v_result IS NULL THEN
        IF EXISTS (SELECT 1 FROM public.companies WHERE user_id = auth.uid() AND id = v_company_id) THEN
            v_result := 'owner';
        END IF;
    END IF;

    RETURN v_result;
END;
$$;


--
-- Name: get_public_invite_info(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_public_invite_info(invite_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'provider', provider,
        'status', status,
        'invited_email', invited_email, -- Show the user which email was invited
        'reply_to', (metadata->>'reply_to') -- Show who invited them (Instructor/Tech)
    )
    INTO result
    FROM public.integrations
    WHERE id = invite_id;

    IF result IS NULL THEN
        RETURN jsonb_build_object('error', 'Invite not found');
    END IF;

    RETURN result;
END;
$$;


--
-- Name: get_recent_activity(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_recent_activity(p_company_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10) RETURNS TABLE(id uuid, action text, details jsonb, created_at timestamp with time zone, user_email text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.action,
        al.details,
        al.created_at,
        au.email AS user_email
    FROM public.audit_logs al
    LEFT JOIN auth.users au ON au.id = al.user_id
    WHERE al.company_id = COALESCE(p_company_id, al.company_id)
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$;


--
-- Name: get_related_patterns(uuid, text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_related_patterns(p_company_id uuid, p_symptoms text[], p_equipment_model text DEFAULT NULL::text) RETURNS TABLE(pattern_id uuid, pattern_type text, pattern_data jsonb, confidence_score integer, occurrence_count integer, relevance_score numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.pattern_type,
        p.pattern_data,
        p.confidence_score,
        p.occurrence_count,
        -- Calculate relevance score based on symptom overlap and recency
        (
            (p.confidence_score::numeric / 100.0 * 0.4) +
            (LEAST(p.occurrence_count::numeric, 20) / 20.0 * 0.3) +
            (EXTRACT(EPOCH FROM (now() - p.last_seen)) / (30 * 24 * 3600.0) * -0.3) -- More recent = higher score
        )::numeric as relevance_score
    FROM public.ai_learning_patterns p
    WHERE p.company_id = p_company_id
      AND COALESCE(p.equipment_model = p_equipment_model, true)
      AND (
        -- Match symptom patterns
        p.pattern_type = 'symptom_outcome' 
        AND p.pattern_data ? 'symptoms'
        AND p.pattern_data->'symptoms' ?| p_symptoms
        OR
        -- Match equipment failure patterns
        p.pattern_type = 'equipment_failure'
        AND COALESCE(p.equipment_model = p_equipment_model, true)
        OR
        -- Match measurement anomalies
        p.pattern_type = 'measurement_anomaly'
      )
    ORDER BY relevance_score DESC
    LIMIT 10;
END;
$$;


--
-- Name: get_user_companies_v2(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_user_companies_v2() RETURNS TABLE(company_id uuid, company_name text, role text, is_owner boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    WITH user_companies AS (
        -- 1. Explicit Roles
        SELECT 
            c.id, 
            c.name, 
            ur.role::TEXT as user_role,  -- Distinct name to avoid ambiguity
            FALSE as is_owner_flag
        FROM public.companies c
        JOIN public.user_roles ur ON c.id = ur.company_id
        WHERE ur.user_id = auth.uid()
        
        UNION ALL
        
        -- 2. Owned Companies
        SELECT 
            c.id, 
            c.name, 
            'owner'::TEXT as user_role,   -- Same distinct name
            TRUE as is_owner_flag
        FROM public.companies c
        WHERE c.user_id = auth.uid()
    )
    SELECT DISTINCT ON (id)
        id as company_id,
        name as company_name,
        user_role as role,                -- Map to output column name
        is_owner_flag as is_owner
    FROM user_companies
    ORDER BY id, is_owner_flag DESC; -- Prioritize owner status if both exist
END;
$$;


--
-- Name: get_user_consents(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_user_consents(p_user_id uuid) RETURNS TABLE(consent_type text, consent_version text, granted boolean, granted_at timestamp with time zone)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT
        consent_type,
        consent_version,
        granted,
        granted_at
    FROM public.user_consents
    WHERE user_id = p_user_id
    ORDER BY consent_type, consent_version DESC;
$$;


--
-- Name: get_user_id_by_email(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'auth', 'public'
    AS $$
DECLARE
  ret_id UUID;
BEGIN
  -- Check if requester is admin/manager (optional check bypassed for now to rely on caller)
  IF auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO ret_id FROM auth.users WHERE email = user_email;
  RETURN ret_id;
END;
$$;


--
-- Name: get_user_skool_subscriptions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.get_user_skool_subscriptions() RETURNS TABLE(id uuid, skool_community_id text, skool_community_name text, subscription_status text, subscription_tier text, expires_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id,
        ss.skool_community_id,
        ss.skool_community_name,
        ss.subscription_status,
        ss.subscription_tier,
        ss.expires_at
    FROM public.skool_subscriptions ss
    WHERE ss.user_id = auth.uid()
    ORDER BY ss.created_at DESC;
END;
$$;


--
-- Name: grant_client_access(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.grant_client_access(target_email text, target_client_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
DECLARE
    target_user_id UUID;
    executor_role public.user_role;
    result JSONB;
BEGIN
    -- 1. Check if the executing user is an Admin
    SELECT role INTO executor_role
    FROM public.user_roles
    WHERE user_id = auth.uid();

    IF executor_role IS DISTINCT FROM 'admin' THEN
        -- Fallback: Check companies table for legacy admins
        IF NOT EXISTS (SELECT 1 FROM public.companies WHERE user_id = auth.uid()) THEN
            RAISE EXCEPTION 'Access Denied: Only Admins can grant access.';
        END IF;
    END IF;

    -- 2. Find the user by email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found. Please ask the client to Sign Up first.';
    END IF;

    -- 3. Insert or Update user_roles
    INSERT INTO public.user_roles (user_id, role, client_id)
    VALUES (target_user_id, 'client', target_client_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'client',
        client_id = target_client_id,
        updated_at = now();

    result := jsonb_build_object(
        'success', true,
        'message', 'Access granted successfully',
        'user_id', target_user_id
    );

    RETURN result;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_consent(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.has_consent(p_user_id uuid, p_consent_type text, p_consent_version text DEFAULT 'latest'::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_granted BOOLEAN;
BEGIN
    IF p_consent_version = 'latest' THEN
        SELECT granted INTO v_granted
        FROM public.user_consents
        WHERE user_id = p_user_id
          AND consent_type = p_consent_type
        ORDER BY consent_version DESC
        LIMIT 1;
    ELSE
        SELECT granted INTO v_granted
        FROM public.user_consents
        WHERE user_id = p_user_id
          AND consent_type = p_consent_type
          AND consent_version = p_consent_version;
    END IF;
    
    RETURN COALESCE(v_granted, false);
END;
$$;


--
-- Name: link_skool_subscription(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.link_skool_subscription(p_skool_community_id text, p_skool_community_name text DEFAULT NULL::text, p_subscription_tier text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Upsert subscription
    INSERT INTO public.skool_subscriptions (
        user_id, skool_community_id, skool_community_name, 
        subscription_status, subscription_tier, expires_at
    ) VALUES (
        auth.uid(), p_skool_community_id, p_skool_community_name,
        'active', p_subscription_tier, NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (user_id, skool_community_id)
    DO UPDATE SET
        skool_community_name = COALESCE(p_skool_community_name, EXCLUDED.skool_community_name),
        subscription_status = 'active',
        subscription_tier = COALESCE(p_subscription_tier, EXCLUDED.subscription_tier),
        updated_at = NOW(),
        expires_at = NOW() + INTERVAL '30 days';
    
    SELECT jsonb_build_object(
        'success', TRUE,
        'community_id', p_skool_community_id,
        'community_name', p_skool_community_name
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;


--
-- Name: log_asset_changes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.log_asset_changes() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.asset_audit_logs (asset_id, changed_by, change_type, new_data)
        VALUES (NEW.id, auth.uid(), TG_OP, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.asset_audit_logs (asset_id, changed_by, change_type, old_data, new_data)
        VALUES (NEW.id, auth.uid(), TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.asset_audit_logs (asset_id, changed_by, change_type, old_data)
        VALUES (OLD.id, auth.uid(), TG_OP, row_to_json(OLD)::jsonb);
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: log_audit_event(text, uuid, uuid, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_company_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        company_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_company_id,
        COALESCE(p_user_id, auth.uid()),
        p_action,
        p_entity_type,
        p_entity_id,
        p_details
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;


--
-- Name: log_invite_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.log_invite_created() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public.log_audit_event(
        'invite_created',
        NEW.company_id,
        NEW.created_by,
        'invite_code',
        NEW.id,
        jsonb_build_object(
            'role', NEW.role,
            'expires_at', NEW.expires_at,
            'max_uses', NEW.max_uses,
            'skool_required', NEW.skool_subscription_required
        )
    );
    RETURN NEW;
END;
$$;


--
-- Name: process_integration_invite(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.process_integration_invite() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Try to get current user ID
    target_user_id := auth.uid();

    -- 2. If NULL (Admin/Seed context), fetch from the Client's Company Owner
    IF target_user_id IS NULL THEN
        SELECT c.user_id 
        INTO target_user_id
        FROM public.clients cl
        JOIN public.companies c ON cl.company_id = c.id
        WHERE cl.id = NEW.client_id;
    END IF;

    -- 3. If still NULL, we proceed (it will likely fail due to NOT NULL constraint, 
    -- which is intended if we can't find an owner).

    IF NEW.status = 'pending_invite' AND NEW.invited_email IS NOT NULL THEN
        INSERT INTO public.workflow_requests (
            user_id,
            workflow_type,
            status,
            input_payload
        ) VALUES (
            target_user_id,
            'client_invite',
            'pending',
            jsonb_build_object(
                'integration_id', NEW.id,
                'provider', NEW.provider,
                'email', NEW.invited_email,
                'client_id', NEW.client_id,
                'created_at', NEW.created_at,
                'reply_to', COALESCE(NEW.metadata->>'reply_to', 'System')
            )
        );
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: process_job_scheduling(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.process_job_scheduling() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    client_email TEXT;
    client_name TEXT;
    company_owner_id UUID;
BEGIN
    -- Only trigger when status changes to 'scheduled'
    IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
        
        -- Fetch Client Email & Owner ID
        SELECT 
            cl.email,
            cl.name,
            c.user_id
        INTO 
            client_email,
            client_name,
            company_owner_id
        FROM public.clients cl
        JOIN public.companies c ON cl.company_id = c.id
        WHERE cl.id = NEW.client_id;

        -- Insert into Workflow Queue
        IF client_email IS NOT NULL AND company_owner_id IS NOT NULL THEN
             INSERT INTO public.workflow_requests (
                user_id,
                workflow_type,
                status,
                input_payload
            ) VALUES (
                company_owner_id,
                'job_scheduled',
                'pending',
                jsonb_build_object(
                    'job_id', NEW.id,
                    'title', NEW.title,
                    'start_time', NEW.start_time,
                    'client_name', client_name,
                    'client_email', client_email,
                    'created_at', NOW()
                )
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: process_telemetry(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.process_telemetry() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    rule RECORD;
    triggered BOOLEAN;
    alert_msg TEXT;
    
    -- Variables for Queue Insertion
    asset_owner_id UUID;
    client_phone TEXT;
BEGIN
    -- Loop through active rules for this asset
    FOR rule IN 
        SELECT * FROM public.automation_rules 
        WHERE asset_id = NEW.asset_id 
        AND is_active = true
    LOOP
        triggered := FALSE;
        
        -- Check Logic based on trigger_type
        -- Note: We currently only support 'temperature' readings for these rules
        IF NEW.reading_type = 'temperature' THEN
        
            -- High Temp Check
            IF rule.trigger_type = 'temperature_high' AND NEW.value > rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'Temperature High Alert: ' || NEW.value || '°F (Threshold: ' || rule.threshold_value || '°F)';
                
            -- Low Temp Check
            ELSIF rule.trigger_type = 'temperature_low' AND NEW.value < rule.threshold_value THEN
                triggered := TRUE;
                alert_msg := 'Temperature Low Alert: ' || NEW.value || '°F (Threshold: ' || rule.threshold_value || '°F)';
            END IF;
            
        END IF;

        -- If Triggered, Create Alert AND Request Automation
        IF triggered THEN
            -- 1. Create Internal Alert Record
            INSERT INTO public.rules_alerts (rule_id, asset_id, reading_id, message, severity, status)
            VALUES (rule.id, NEW.asset_id, NEW.id, alert_msg, 'mod', 'new');
            
            -- 2. Fetch Context (Owner & Phone)
            SELECT 
                co.user_id, 
                cl.contact_phone
            INTO 
                asset_owner_id, 
                client_phone
            FROM public.assets a
            JOIN public.clients cl ON a.client_id = cl.id
            JOIN public.companies co ON cl.company_id = co.id
            WHERE a.id = NEW.asset_id;

            -- 3. Trigger Native Automation via Queue (workflow_requests)
            -- This inserts a row, which Supabase Edge Function 'webhook-dispatcher' picks up
            IF asset_owner_id IS NOT NULL THEN
                -- Default phone fallback if missing
                IF client_phone IS NULL THEN
                    client_phone := '';
                END IF;

                INSERT INTO public.workflow_requests (
                    user_id, 
                    workflow_type, 
                    status, 
                    input_payload
                ) VALUES (
                    asset_owner_id,
                    'system_alert', -- Standardized native alert type
                    'pending',
                    jsonb_build_object(
                        'phone', client_phone,
                        'message', alert_msg,
                        'asset_id', NEW.asset_id,
                        'reading_value', NEW.value,
                        'timestamp', NOW()
                    )
                );
            END IF;
            
        END IF;
        
    END LOOP;
    
    RETURN NEW;
END;
$$;


--
-- Name: record_consent(uuid, text, text, boolean, inet, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.record_consent(p_user_id uuid, p_consent_type text, p_consent_version text, p_granted boolean, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    INSERT INTO public.user_consents (
        user_id,
        consent_type,
        consent_version,
        granted,
        granted_at,
        ip_address,
        user_agent
    )
    VALUES (
        p_user_id,
        p_consent_type,
        p_consent_version,
        p_granted,
        CASE WHEN p_granted THEN NOW() ELSE NULL END,
        p_ip_address,
        p_user_agent
    )
    ON CONFLICT (user_id, consent_type, consent_version)
    DO UPDATE SET
        granted = EXCLUDED.granted,
        granted_at = CASE WHEN EXCLUDED.granted THEN NOW() ELSE NULL END,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW()
    RETURNING id INTO v_consent_id;
    
    RETURN v_consent_id;
END;
$$;


--
-- Name: setup_email_automation_webhook(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.setup_email_automation_webhook(service_key text, endpoint_url text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
    trigger_func_sql TEXT;
BEGIN
    -- 1. Create the Trigger Function with the dynamic Secret
    --    Uses net.http_post (standard Supabase pg_net)
    trigger_func_sql := format($func$
        CREATE OR REPLACE FUNCTION public.trigger_email_dispatcher()
        RETURNS TRIGGER AS $t$
        BEGIN
            PERFORM net.http_post(
                url := '%s',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer %s'
                ),
                body := jsonb_build_object(
                    'record', row_to_json(NEW)
                )
            );
            RETURN NEW;
        END;
        $t$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$, endpoint_url, service_key);

    EXECUTE trigger_func_sql;

    -- 2. Create the Trigger on workflow_requests (INSERT only)
    DROP TRIGGER IF EXISTS on_workflow_request_insert ON public.workflow_requests;
    
    CREATE TRIGGER on_workflow_request_insert
        AFTER INSERT ON public.workflow_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_email_dispatcher();

    RETURN jsonb_build_object('success', true, 'message', 'Webhook Trigger Configured (net.http_post)');
END;
$_$;


--
-- Name: switch_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.switch_company(target_company_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    is_member BOOLEAN;
BEGIN
    -- Verify membership OR ownership
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND company_id = target_company_id
        UNION
        SELECT 1 FROM public.companies
        WHERE user_id = auth.uid() AND id = target_company_id
    ) INTO is_member;

    IF NOT is_member THEN
        RAISE EXCEPTION 'User is not a member of this company';
    END IF;

    -- Update Metadata
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('active_company_id', target_company_id)
    WHERE id = auth.uid();
END;
$$;


--
-- Name: switch_company_context(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.switch_company_context(p_company_id uuid, p_role_override text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_company_id UUID;
    v_role TEXT;
    v_result JSONB;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.user_roles
    WHERE user_id = auth.uid() AND company_id = p_company_id;

    IF v_company_id IS NULL THEN
        SELECT id INTO v_company_id
        FROM public.companies
        WHERE user_id = auth.uid() AND id = p_company_id;
    END IF;

    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'You do not have access to company %', p_company_id;
    END IF;

    SELECT role INTO v_role
    FROM public.user_roles
    WHERE user_id = auth.uid() AND company_id = p_company_id;

    IF v_role IS NULL THEN
        v_role := 'owner';
    END IF;

    IF p_role_override IS NOT NULL THEN
        v_role := p_role_override;
    END IF;

    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
        'active_company_id', v_company_id,
        'active_role', v_role
    )
    WHERE id = auth.uid();

    SELECT jsonb_build_object(
        'company_id', v_company_id,
        'company_name', (SELECT name FROM public.companies WHERE id = v_company_id),
        'role', v_role
    ) INTO v_result;

    RETURN v_result;
END;
$$;


--
-- Name: sync_calculation_type(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.sync_calculation_type() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.calculation_type := NEW.type;
    RETURN NEW;
END;
$$;


--
-- Name: trigger_review_hunter(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.trigger_review_hunter() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    client_phone TEXT;
    client_email TEXT;
    client_name TEXT;
    tech_name TEXT;
    company_owner_id UUID;
BEGIN
    -- Only fire when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
        -- Fetch Client Info & Company Owner (for the user_id of the request)
        SELECT 
            cl.contact_phone,
            cl.email,
            cl.name,
            co.user_id
        INTO 
            client_phone,
            client_email,
            client_name,
            company_owner_id
        FROM public.clients cl
        JOIN public.companies co ON cl.company_id = co.id
        WHERE cl.id = NEW.client_id;
        
        -- Fetch Tech Name (if assigned)
        IF NEW.technician_id IS NOT NULL THEN
            SELECT email INTO tech_name FROM auth.users WHERE id = NEW.technician_id;
        ELSE
            tech_name := 'Our Technician';
        END IF;

        -- Create Workflow Request
        INSERT INTO public.workflow_requests (
            user_id,
            workflow_type,
            status,
            input_payload
        ) VALUES (
            company_owner_id,
            'review_hunter',
            'pending',
            jsonb_build_object(
                'job_id', NEW.id,
                'client_name', client_name,
                'client_email', client_email,
                'client_phone', client_phone,
                'tech_name', tech_name,
                'completed_at', NOW()
            )
        );
        
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: update_company_seat_usage(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_company_seat_usage() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_company_id UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_company_id := NEW.company_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_company_id := OLD.company_id;
    ELSE
        v_company_id := NEW.company_id;
    END IF;

    UPDATE public.companies
    SET seat_usage = (
        SELECT COUNT(*) FROM public.user_roles WHERE company_id = v_company_id
    )
    WHERE id = v_company_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_company_settings(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_company_settings(p_company_id uuid, p_settings jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_settings JSONB;
BEGIN
    -- Check permission (Admin in roles OR Owner in companies table)
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = p_company_id
        AND role = 'admin'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.companies
        WHERE id = p_company_id
        AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'No permission');
    END IF;

    -- Upsert settings
    INSERT INTO public.company_settings (
        company_id,
        theme,
        primary_color,
        email_notifications,
        job_created_notifications,
        job_completed_notifications,
        invite_sent_notifications,
        default_role,
        auto_assign_jobs,
        require_approval_for_jobs,
        timezone,
        date_format,
        currency,
        enable_client_portal,
        enable_dispatch_board,
        enable_inventory,
        updated_at
    )
    VALUES (
        p_company_id,
        COALESCE((p_settings->>'theme')::TEXT, 'system'),
        COALESCE(p_settings->>'primary_color', '#3b82f6'),
        COALESCE((p_settings->>'email_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'job_created_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'job_completed_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'invite_sent_notifications')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'default_role')::TEXT, 'tech'),
        COALESCE((p_settings->>'auto_assign_jobs')::BOOLEAN, FALSE),
        COALESCE((p_settings->>'require_approval_for_jobs')::BOOLEAN, FALSE),
        COALESCE(p_settings->>'timezone', 'America/New_York'),
        COALESCE(p_settings->>'date_format', 'MM/dd/yyyy'),
        COALESCE(p_settings->>'currency', 'USD'),
        COALESCE((p_settings->>'enable_client_portal')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'enable_dispatch_board')::BOOLEAN, TRUE),
        COALESCE((p_settings->>'enable_inventory')::BOOLEAN, FALSE),
        NOW()
    )
    ON CONFLICT (company_id)
    DO UPDATE SET
        theme = COALESCE(EXCLUDED.theme, company_settings.theme),
        primary_color = COALESCE(EXCLUDED.primary_color, company_settings.primary_color),
        email_notifications = COALESCE(EXCLUDED.email_notifications, company_settings.email_notifications),
        job_created_notifications = COALESCE(EXCLUDED.job_created_notifications, company_settings.job_created_notifications),
        job_completed_notifications = COALESCE(EXCLUDED.job_completed_notifications, company_settings.job_completed_notifications),
        invite_sent_notifications = COALESCE(EXCLUDED.invite_sent_notifications, company_settings.invite_sent_notifications),
        default_role = COALESCE(EXCLUDED.default_role, company_settings.default_role),
        auto_assign_jobs = COALESCE(EXCLUDED.auto_assign_jobs, company_settings.auto_assign_jobs),
        require_approval_for_jobs = COALESCE(EXCLUDED.require_approval_for_jobs, company_settings.require_approval_for_jobs),
        timezone = COALESCE(EXCLUDED.timezone, company_settings.timezone),
        date_format = COALESCE(EXCLUDED.date_format, company_settings.date_format),
        currency = COALESCE(EXCLUDED.currency, company_settings.currency),
        enable_client_portal = COALESCE(EXCLUDED.enable_client_portal, company_settings.enable_client_portal),
        enable_dispatch_board = COALESCE(EXCLUDED.enable_dispatch_board, company_settings.enable_dispatch_board),
        enable_inventory = COALESCE(EXCLUDED.enable_inventory, company_settings.enable_inventory),
        updated_at = NOW();

    -- Log the change
    PERFORM public.log_audit_event(
        'settings_changed',
        p_company_id,
        auth.uid(),
        'company_settings',
        p_company_id,
        p_settings
    );

    SELECT to_jsonb(cs) INTO v_settings
    FROM public.company_settings cs
    WHERE cs.company_id = p_company_id;

    RETURN jsonb_build_object('success', TRUE, 'settings', v_settings);
END;
$$;


--
-- Name: update_company_settings_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_company_settings_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_cylinder_weight(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_cylinder_weight() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  if NEW.transaction_type = 'charge' then
    update public.refrigerant_cylinders
    set current_weight_lbs = current_weight_lbs - NEW.amount_lbs
    where id = NEW.cylinder_id;
  elsif NEW.transaction_type = 'recover' then
    -- Recovering INTO a cylinder adds weight
    update public.refrigerant_cylinders
    set current_weight_lbs = current_weight_lbs + NEW.amount_lbs
    where id = NEW.cylinder_id;
  end if;
  return NEW;
end;
$$;


--
-- Name: update_invitation_links_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_invitation_links_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_pattern_occurrence(text, jsonb, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_pattern_occurrence(p_pattern_type text, p_pattern_data jsonb, p_company_id uuid, p_equipment_model text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    pattern_id uuid;
BEGIN
    -- Try to find existing pattern
    SELECT id INTO pattern_id 
    FROM public.ai_learning_patterns 
    WHERE pattern_type = p_pattern_type 
      AND pattern_data @> p_pattern_data
      AND company_id = p_company_id
      AND COALESCE(equipment_model = p_equipment_model, true);
    
    IF pattern_id IS NOT NULL THEN
        -- Update existing pattern
        UPDATE public.ai_learning_patterns 
        SET 
            occurrence_count = occurrence_count + 1,
            confidence_score = LEAST(confidence_score + 5, 100),
            last_seen = now()
        WHERE id = pattern_id;
    ELSE
        -- Create new pattern
        INSERT INTO public.ai_learning_patterns (pattern_type, pattern_data, company_id, equipment_model, confidence_score)
        VALUES (p_pattern_type, p_pattern_data, p_company_id, p_equipment_model, 50)
        RETURNING id INTO pattern_id;
    END IF;
    
    RETURN pattern_id;
END;
$$;


--
-- Name: update_seat_limit_from_tier(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_seat_limit_from_tier() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.subscription_tier = 'free' THEN
        NEW.seat_limit = 3;
    ELSIF NEW.subscription_tier = 'pro' THEN
        NEW.seat_limit = 1;
    ELSIF NEW.subscription_tier = 'business' THEN
        NEW.seat_limit = 10;
    ELSE
        NEW.seat_limit = 1; -- fallback
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_subscription_plan(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_subscription_plan() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Map price_id to plan name based on common patterns
  -- This should be kept in sync with server-side mapping logic
  NEW.plan = CASE 
    WHEN NEW.price_id LIKE '%professional%' OR NEW.price_id LIKE '%solo%' THEN 'pro'
    WHEN NEW.price_id LIKE '%enterprise%' OR NEW.price_id LIKE '%business%' THEN 'business'
    ELSE 'free'
  END;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_user_roles_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_user_roles_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: use_invitation_link(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.use_invitation_link(p_slug text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_validation JSONB;
    v_result JSONB;
BEGIN
    -- Validate the link
    SELECT * INTO v_validation FROM public.validate_invitation_link(p_slug);
    
    IF NOT (v_validation->>'valid')::BOOLEAN THEN
        RETURN v_validation;
    END IF;

    -- Check seat limit
    SELECT * INTO v_result FROM public.check_seat_limit((v_validation->'invite'->>'company_id')::UUID);
    IF NOT (v_result->>'within_limit')::BOOLEAN THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Seat limit reached for this company');
    END IF;

    -- Add user to company with specified role
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (
        auth.uid(),
        (v_validation->'invite'->>'company_id')::UUID,
        v_validation->'invite'->>'role'
    )
    ON CONFLICT (user_id, company_id) DO UPDATE
    SET role = EXCLUDED.role;

    -- Increment usage count
    UPDATE public.invitation_links
    SET current_uses = current_uses + 1
    WHERE slug = p_slug;

    -- Switch to the company context
    SELECT * INTO v_result FROM public.switch_company_context(
        (v_validation->'invite'->>'company_id')::UUID
    );

    RETURN jsonb_build_object('success', TRUE, 'company_id', v_validation->'invite'->>'company_id');
END;
$$;


--
-- Name: validate_invitation_link(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.validate_invitation_link(p_slug text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_invite JSONB;
BEGIN
    SELECT jsonb_build_object(
        'valid', TRUE,
        'company_id', il.company_id,
        'company_name', c.name,
        'role', il.role,
        'expires_at', il.expires_at,
        'max_uses', il.max_uses,
        'current_uses', il.current_uses
    ) INTO v_invite
    FROM public.invitation_links il
    JOIN public.companies c ON c.id = il.company_id
    WHERE il.slug = p_slug
      AND (il.expires_at IS NULL OR il.expires_at > NOW())
      AND (il.max_uses IS NULL OR il.current_uses < il.max_uses);

    IF v_invite IS NULL THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid or expired invitation link');
    END IF;

    RETURN jsonb_build_object('valid', TRUE, 'invite', v_invite);
END;
$$;


--
-- Name: verify_skool_subscription(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.verify_skool_subscription(p_skool_community_id text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_result BOOLEAN;
BEGIN
    -- If no community specified, check if user has ANY active subscription
    IF p_skool_community_id IS NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.skool_subscriptions ss
            WHERE ss.user_id = auth.uid()
            AND ss.subscription_status = 'active'
            AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
        ) INTO v_result;
        RETURN v_result;
    END IF;
    
    -- Check specific community
    SELECT EXISTS (
        SELECT 1 FROM public.skool_subscriptions ss
        WHERE ss.user_id = auth.uid()
        AND ss.skool_community_id = p_skool_community_id
        AND ss.subscription_status = 'active'
        AND (ss.expires_at IS NULL OR ss.expires_at > NOW())
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
	return query 
		with files_folders as (
			select path_tokens[levels] as folder
			from storage.objects
			where objects.name ilike prefix || '%'
			and bucket_id = bucketname
			GROUP by folder
			limit limits
			offset offsets
		) 
		select files_folders.folder as name, objects.id, objects.updated_at, objects.created_at, objects.last_accessed_at, objects.metadata from files_folders 
		left join storage.objects
		on prefix || files_folders.folder = objects.name and objects.bucket_id=bucketname;
END
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE OR REPLACE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_learning_patterns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.ai_learning_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pattern_type text NOT NULL,
    pattern_data jsonb NOT NULL,
    confidence_score integer,
    occurrence_count integer DEFAULT 1,
    last_seen timestamp with time zone DEFAULT now(),
    company_id uuid,
    equipment_model text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_learning_patterns_confidence_score_check CHECK (((confidence_score >= 0) AND (confidence_score <= 100))),
    CONSTRAINT ai_learning_patterns_pattern_type_check CHECK ((pattern_type = ANY (ARRAY['symptom_outcome'::text, 'equipment_failure'::text, 'measurement_anomaly'::text, 'seasonal_pattern'::text])))
);


--
-- Name: asset_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.asset_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid,
    changed_by uuid,
    change_type text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_at timestamp with time zone DEFAULT now()
);


--
-- Name: asset_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.asset_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    integration_id uuid NOT NULL,
    external_device_id text NOT NULL,
    external_device_name text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    serial_number text,
    location_on_site text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    model_number text,
    manufacturer text,
    photo_url text,
    warranty_status text,
    refrigerant_type text,
    full_charge_lbs numeric,
    install_date date
);


--
-- Name: COLUMN assets.refrigerant_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assets.refrigerant_type IS 'Type of refrigerant used in the asset (e.g., R-410A, R-22)';


--
-- Name: COLUMN assets.full_charge_lbs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assets.full_charge_lbs IS 'Total design refrigerant charge in pounds (used for leak rate calculations)';


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_action_check CHECK ((action = ANY (ARRAY['company_created'::text, 'company_updated'::text, 'role_assigned'::text, 'role_changed'::text, 'role_removed'::text, 'invite_created'::text, 'invite_used'::text, 'invite_revoked'::text, 'company_switched'::text, 'subscription_upgraded'::text, 'subscription_downgraded'::text, 'settings_changed'::text, 'member_removed'::text, 'skool_linked'::text, 'skool_unlinked'::text])))
);


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.automation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    company_id uuid NOT NULL,
    trigger_type text NOT NULL,
    threshold_value double precision,
    action_type text DEFAULT 'sms'::text NOT NULL,
    action_config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: calculations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.calculations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type text NOT NULL,
    name text,
    notes text,
    parameters jsonb NOT NULL,
    results jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    project_id uuid,
    location_lat double precision,
    location_lng double precision,
    weather_data jsonb,
    evidence_urls text[],
    session_context jsonb,
    learning_version integer DEFAULT 1,
    calculation_type text
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    contact_name text,
    contact_phone text,
    contact_email text,
    address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    notification_preferences jsonb DEFAULT '{"sms_enabled": true, "email_enabled": true}'::jsonb,
    zip_code text
);


--
-- Name: COLUMN clients.notification_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.notification_preferences IS 'Per-client notification preferences. Structure: { "sms_enabled": boolean, "email_enabled": boolean }';


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#000000'::text,
    website text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    alert_phone text,
    alert_config jsonb DEFAULT '{}'::jsonb,
    subscription_status text DEFAULT 'active'::text,
    financing_link text,
    financing_enabled boolean DEFAULT false,
    seat_limit integer DEFAULT 5,
    skool_community_id text,
    skool_community_name text,
    subscription_tier text DEFAULT 'free'::text,
    seat_usage integer DEFAULT 0,
    subscription_expires_at timestamp with time zone,
    CONSTRAINT companies_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['active'::text, 'past_due'::text, 'canceled'::text, 'trialing'::text, 'provisioning'::text]))),
    CONSTRAINT companies_subscription_tier_check CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'pro'::text, 'business'::text])))
);


--
-- Name: TABLE companies; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.companies IS 'Company profiles for white-labeling. Automations now handled via Supabase Edge Functions (review-hunter, invoice-chaser, webhook-dispatcher).';


--
-- Name: COLUMN companies.subscription_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.companies.subscription_status IS 'Tracks the Business-in-a-Box subscription status';


--
-- Name: COLUMN companies.financing_link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.companies.financing_link IS 'URL for 3rd party financing (e.g. Wisetack)';


--
-- Name: COLUMN companies.financing_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.companies.financing_enabled IS 'Toggle to show/hide the link on PDFs';


--
-- Name: COLUMN companies.seat_limit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.companies.seat_limit IS 'Maximum number of paid seats (technicians, admins, managers) allowed for this company.';


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    theme text DEFAULT 'system'::text,
    primary_color text DEFAULT '#3b82f6'::text,
    email_notifications boolean DEFAULT true,
    job_created_notifications boolean DEFAULT true,
    job_completed_notifications boolean DEFAULT true,
    invite_sent_notifications boolean DEFAULT true,
    default_role text DEFAULT 'tech'::text,
    auto_assign_jobs boolean DEFAULT false,
    require_approval_for_jobs boolean DEFAULT false,
    timezone text DEFAULT 'America/New_York'::text,
    date_format text DEFAULT 'MM/dd/yyyy'::text,
    currency text DEFAULT 'USD'::text,
    enable_client_portal boolean DEFAULT true,
    enable_dispatch_board boolean DEFAULT true,
    enable_inventory boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT company_settings_default_role_check CHECK ((default_role = ANY (ARRAY['tech'::text, 'manager'::text, 'admin'::text]))),
    CONSTRAINT company_settings_theme_check CHECK ((theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])))
);


--
-- Name: diagnostic_outcomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.diagnostic_outcomes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    troubleshooting_session_id uuid,
    ai_recommendations jsonb NOT NULL,
    technician_actions jsonb,
    final_resolution jsonb,
    success_rating integer,
    followup_required boolean DEFAULT false,
    notes text,
    user_id uuid,
    company_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT diagnostic_outcomes_success_rating_check CHECK (((success_rating >= 1) AND (success_rating <= 5)))
);


--
-- Name: iaq_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.iaq_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid,
    client_id uuid,
    job_id uuid,
    technician_id uuid,
    temperature_f double precision,
    humidity_percent double precision,
    co2_ppm integer,
    voc_level text,
    pm25_level double precision,
    checklist jsonb DEFAULT '{}'::jsonb,
    overall_score integer,
    wellness_score integer,
    comfort_score integer,
    unit_health_score integer,
    notes text,
    media_urls text[],
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT iaq_audits_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'sent'::text])))
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    provider text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at timestamp with time zone,
    status text DEFAULT 'pending'::text,
    invited_email text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: invitation_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.invitation_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    company_id uuid NOT NULL,
    role text NOT NULL,
    expires_at timestamp with time zone,
    max_uses integer DEFAULT 1,
    current_uses integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invitation_links_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'manager'::text, 'tech'::text, 'technician'::text, 'client'::text])))
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_number text DEFAULT ((('INV-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || SUBSTRING((gen_random_uuid())::text FROM 1 FOR 6)),
    client_id uuid NOT NULL,
    job_id uuid,
    company_id uuid NOT NULL,
    status text DEFAULT 'draft'::text,
    total_amount numeric(10,2) DEFAULT 0.00,
    due_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    items jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'unpaid'::text, 'overdue'::text, 'cancelled'::text])))
);


--
-- Name: job_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.job_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    user_id uuid,
    status public.job_status NOT NULL,
    note text,
    geo_lat double precision,
    geo_lng double precision,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    job_name text,
    client_name text,
    status public.job_status DEFAULT 'pending'::public.job_status,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    client_id uuid,
    asset_id uuid,
    company_id uuid,
    technician_id uuid,
    ticket_number text DEFAULT ((('JOB-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || SUBSTRING((gen_random_uuid())::text FROM 1 FOR 6)),
    title text,
    description text,
    geo_lat double precision,
    geo_lng double precision,
    scheduled_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone
);


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.licenses (
    key uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'inactive'::text NOT NULL,
    plan_tier text DEFAULT 'standard'::text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT licenses_status_check CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'canceled'::text, 'inactive'::text])))
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    address text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text, 'completed'::text])))
);


--
-- Name: refrigerant_cylinders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.refrigerant_cylinders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cylinder_code text NOT NULL,
    refrigerant_type text NOT NULL,
    initial_weight_lbs numeric NOT NULL,
    current_weight_lbs numeric NOT NULL,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT refrigerant_cylinders_status_check CHECK ((status = ANY (ARRAY['active'::text, 'empty'::text, 'returned'::text])))
);


--
-- Name: refrigerant_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.refrigerant_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cylinder_id uuid,
    job_id text,
    transaction_type text NOT NULL,
    amount_lbs numeric NOT NULL,
    notes text,
    technician_name text,
    created_at timestamp with time zone DEFAULT now(),
    asset_id uuid,
    CONSTRAINT refrigerant_logs_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['charge'::text, 'recover'::text, 'disposal'::text, 'addition'::text])))
);


--
-- Name: COLUMN refrigerant_logs.asset_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.refrigerant_logs.asset_id IS 'Specific asset target for this refrigerant transaction';


--
-- Name: rules_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.rules_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid,
    asset_id uuid NOT NULL,
    reading_id uuid,
    message text NOT NULL,
    severity text DEFAULT 'info'::text,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: skill_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.skill_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid,
    skill_type text NOT NULL,
    xp_value integer DEFAULT 10,
    metadata jsonb,
    verified_at timestamp with time zone DEFAULT now()
);


--
-- Name: skool_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.skool_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    skool_community_id text NOT NULL,
    skool_community_name text,
    subscription_status text DEFAULT 'active'::text,
    subscription_tier text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    price_monthly numeric NOT NULL,
    price_yearly numeric NOT NULL,
    calculations_limit integer NOT NULL,
    limit_period text DEFAULT 'monthly'::text,
    features jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    status text DEFAULT 'inactive'::text NOT NULL,
    price_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    plan text DEFAULT 'free'::text
);


--
-- Name: COLUMN subscriptions.plan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.plan IS 'Plan name (free, pro, business) derived from subscription_plans.name';


--
-- Name: telemetry_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.telemetry_readings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id uuid NOT NULL,
    reading_type text NOT NULL,
    value double precision NOT NULL,
    unit text,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- Name: triage_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.triage_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    homeowner_name text,
    homeowner_phone text,
    problem_description text,
    media_urls text[],
    ai_analysis jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'new'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT triage_submissions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'analyzed'::text, 'converted'::text, 'archived'::text])))
);


--
-- Name: COLUMN triage_submissions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.triage_submissions.status IS 'Status of the lead: new, analyzed (by AI), converted (to job), or archived (ignored/completed).';


--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    consent_type text NOT NULL,
    consent_version text NOT NULL,
    granted boolean DEFAULT false NOT NULL,
    granted_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text,
    CONSTRAINT user_consents_consent_type_check CHECK ((consent_type = ANY (ARRAY['privacy_policy'::text, 'marketing_emails'::text, 'analytics_tracking'::text, 'essential_cookies'::text, 'functional_cookies'::text, 'performance_cookies'::text, 'advertising_cookies'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL,
    role public.user_role DEFAULT 'client'::public.user_role NOT NULL,
    company_id uuid NOT NULL,
    client_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    id integer NOT NULL,
    CONSTRAINT check_multi_role_mapping CHECK ((((role = 'client'::public.user_role) AND (client_id IS NOT NULL)) OR ((role = ANY (ARRAY['tech'::public.user_role, 'technician'::public.user_role, 'manager'::public.user_role, 'admin'::public.user_role])) AND (company_id IS NOT NULL)))),
    CONSTRAINT check_role_mapping CHECK (((((role = 'admin'::public.user_role) OR (role = 'manager'::public.user_role) OR (role = 'student'::public.user_role) OR (role = 'technician'::public.user_role) OR (role = 'tech'::public.user_role)) AND (company_id IS NOT NULL)) OR ((role = 'client'::public.user_role) AND (client_id IS NOT NULL))))
);


--
-- Name: user_roles_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_roles_backup (
    user_id uuid,
    role public.user_role,
    company_id uuid,
    client_id uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: warranty_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.warranty_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    job_id uuid,
    status text DEFAULT 'draft'::text,
    equipment_info jsonb DEFAULT '{}'::jsonb,
    fault_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT warranty_claims_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'processed'::text])))
);


--
-- Name: workflow_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.workflow_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    workflow_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    input_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    result_payload jsonb DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT workflow_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.iceberg_namespaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_name text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    catalog_id uuid NOT NULL
);


--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.iceberg_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    namespace_id uuid NOT NULL,
    bucket_name text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    remote_table_id text,
    shard_key text,
    shard_id text,
    catalog_id uuid NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE IF NOT EXISTS storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: ai_learning_patterns ai_learning_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_learning_patterns
    ADD CONSTRAINT ai_learning_patterns_pkey PRIMARY KEY (id);


--
-- Name: asset_audit_logs asset_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_audit_logs
    ADD CONSTRAINT asset_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: asset_mappings asset_mappings_asset_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_mappings
    ADD CONSTRAINT asset_mappings_asset_id_key UNIQUE (asset_id);


--
-- Name: asset_mappings asset_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_mappings
    ADD CONSTRAINT asset_mappings_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: calculations calculations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculations
    ADD CONSTRAINT calculations_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_name_key UNIQUE (user_id, name);


--
-- Name: company_settings company_settings_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_key UNIQUE (company_id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_outcomes diagnostic_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_outcomes
    ADD CONSTRAINT diagnostic_outcomes_pkey PRIMARY KEY (id);


--
-- Name: iaq_audits iaq_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iaq_audits
    ADD CONSTRAINT iaq_audits_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: invitation_links invitation_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_links
    ADD CONSTRAINT invitation_links_pkey PRIMARY KEY (id);


--
-- Name: invitation_links invitation_links_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_links
    ADD CONSTRAINT invitation_links_slug_key UNIQUE (slug);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: job_timeline job_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_timeline
    ADD CONSTRAINT job_timeline_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (key);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: refrigerant_cylinders refrigerant_cylinders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerant_cylinders
    ADD CONSTRAINT refrigerant_cylinders_pkey PRIMARY KEY (id);


--
-- Name: refrigerant_logs refrigerant_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerant_logs
    ADD CONSTRAINT refrigerant_logs_pkey PRIMARY KEY (id);


--
-- Name: rules_alerts rules_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules_alerts
    ADD CONSTRAINT rules_alerts_pkey PRIMARY KEY (id);


--
-- Name: skill_logs skill_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_logs
    ADD CONSTRAINT skill_logs_pkey PRIMARY KEY (id);


--
-- Name: skool_subscriptions skool_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skool_subscriptions
    ADD CONSTRAINT skool_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: telemetry_readings telemetry_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telemetry_readings
    ADD CONSTRAINT telemetry_readings_pkey PRIMARY KEY (id);


--
-- Name: triage_submissions triage_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_submissions
    ADD CONSTRAINT triage_submissions_pkey PRIMARY KEY (id);


--
-- Name: skool_subscriptions unique_skool_community; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skool_subscriptions
    ADD CONSTRAINT unique_skool_community UNIQUE (user_id, skool_community_id);


--
-- Name: user_consents user_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);


--
-- Name: user_consents user_consents_user_id_consent_type_consent_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_consent_type_consent_version_key UNIQUE (user_id, consent_type, consent_version);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, company_id);


--
-- Name: warranty_claims warranty_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_pkey PRIMARY KEY (id);


--
-- Name: workflow_requests workflow_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_requests
    ADD CONSTRAINT workflow_requests_pkey PRIMARY KEY (id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_pkey PRIMARY KEY (id);


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_learning_patterns_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_learning_patterns_company ON public.ai_learning_patterns USING btree (company_id);


--
-- Name: idx_ai_learning_patterns_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_learning_patterns_last_seen ON public.ai_learning_patterns USING btree (last_seen);


--
-- Name: idx_ai_learning_patterns_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_learning_patterns_model ON public.ai_learning_patterns USING btree (equipment_model);


--
-- Name: idx_ai_learning_patterns_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_learning_patterns_type ON public.ai_learning_patterns USING btree (pattern_type);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_company ON public.audit_logs USING btree (company_id);


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_calculations_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calculations_created ON public.calculations USING btree (created_at DESC);


--
-- Name: idx_calculations_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calculations_user_created ON public.calculations USING btree (user_id, created_at DESC);


--
-- Name: idx_clients_notification_prefs; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_notification_prefs ON public.clients USING gin (notification_preferences);


--
-- Name: idx_diagnostic_outcomes_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnostic_outcomes_company ON public.diagnostic_outcomes USING btree (company_id);


--
-- Name: idx_diagnostic_outcomes_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnostic_outcomes_session ON public.diagnostic_outcomes USING btree (troubleshooting_session_id);


--
-- Name: idx_diagnostic_outcomes_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnostic_outcomes_success ON public.diagnostic_outcomes USING btree (success_rating);


--
-- Name: idx_invitation_links_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitation_links_company ON public.invitation_links USING btree (company_id);


--
-- Name: idx_invitation_links_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitation_links_slug ON public.invitation_links USING btree (slug);


--
-- Name: idx_skool_subs_community; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skool_subs_community ON public.skool_subscriptions USING btree (skool_community_id);


--
-- Name: idx_skool_subs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skool_subs_user ON public.skool_subscriptions USING btree (user_id);


--
-- Name: idx_user_consents_type_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_type_version ON public.user_consents USING btree (consent_type, consent_version);


--
-- Name: idx_user_consents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_consents_user_id ON public.user_consents USING btree (user_id);


--
-- Name: subscriptions_plan_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX subscriptions_plan_idx ON public.subscriptions USING btree (plan);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (catalog_id, name);


--
-- Name: idx_iceberg_tables_location; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_tables_location ON storage.iceberg_tables USING btree (location);


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (catalog_id, namespace_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: ai_learning_patterns handle_ai_learning_patterns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_ai_learning_patterns_updated_at BEFORE UPDATE ON public.ai_learning_patterns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: calculations handle_calculations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_calculations_updated_at BEFORE UPDATE ON public.calculations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: projects handle_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: subscriptions handle_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: warranty_claims handle_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.warranty_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_consents handle_user_consents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER handle_user_consents_updated_at BEFORE UPDATE ON public.user_consents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: integrations on_integration_invite; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_integration_invite AFTER INSERT ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.process_integration_invite();


--
-- Name: jobs on_job_completed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_job_completed AFTER UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.trigger_review_hunter();


--
-- Name: jobs on_job_scheduled; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_job_scheduled AFTER INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.process_job_scheduling();


--
-- Name: refrigerant_logs on_log_entry; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_log_entry AFTER INSERT ON public.refrigerant_logs FOR EACH ROW EXECUTE FUNCTION public.update_cylinder_weight();


--
-- Name: calculations sync_calculation_type_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_calculation_type_trigger BEFORE INSERT OR UPDATE ON public.calculations FOR EACH ROW EXECUTE FUNCTION public.sync_calculation_type();


--
-- Name: assets tr_log_asset_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_log_asset_changes AFTER INSERT OR DELETE OR UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.log_asset_changes();


--
-- Name: user_roles trigger_audit_role_assigned; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_role_assigned AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_log_role_assigned();


--
-- Name: user_roles trigger_audit_role_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_role_changed AFTER UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_log_role_changed();


--
-- Name: user_roles trigger_audit_role_removed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_role_removed AFTER DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_log_role_removed();


--
-- Name: rules_alerts trigger_auto_create_job; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_create_job AFTER INSERT ON public.rules_alerts FOR EACH ROW EXECUTE FUNCTION public.create_job_from_alert();


--
-- Name: company_settings trigger_company_settings_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_company_settings_updated BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_company_settings_timestamp();


--
-- Name: invitation_links trigger_invitation_links_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_invitation_links_updated BEFORE UPDATE ON public.invitation_links FOR EACH ROW EXECUTE FUNCTION public.update_invitation_links_timestamp();


--
-- Name: telemetry_readings trigger_process_telemetry; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_process_telemetry AFTER INSERT ON public.telemetry_readings FOR EACH ROW EXECUTE FUNCTION public.process_telemetry();


--
-- Name: companies trigger_update_seat_limit_on_tier_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_seat_limit_on_tier_change BEFORE INSERT OR UPDATE OF subscription_tier ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_seat_limit_from_tier();


--
-- Name: user_roles trigger_user_roles_seat_usage; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_user_roles_seat_usage AFTER INSERT OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_company_seat_usage();


--
-- Name: user_roles trigger_user_roles_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_user_roles_updated BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_user_roles_timestamp();


--
-- Name: invoices update_invoices_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_modtime BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscription_plan_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subscription_plan_trigger BEFORE INSERT OR UPDATE OF price_id ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_subscription_plan();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: ai_learning_patterns ai_learning_patterns_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_learning_patterns
    ADD CONSTRAINT ai_learning_patterns_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: asset_audit_logs asset_audit_logs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_audit_logs
    ADD CONSTRAINT asset_audit_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_audit_logs asset_audit_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_audit_logs
    ADD CONSTRAINT asset_audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: asset_mappings asset_mappings_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_mappings
    ADD CONSTRAINT asset_mappings_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_mappings asset_mappings_integration_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_mappings
    ADD CONSTRAINT asset_mappings_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES public.integrations(id) ON DELETE CASCADE;


--
-- Name: assets assets_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: automation_rules automation_rules_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: automation_rules automation_rules_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: calculations calculations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculations
    ADD CONSTRAINT calculations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: calculations calculations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calculations
    ADD CONSTRAINT calculations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clients clients_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: companies companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: company_settings company_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: diagnostic_outcomes diagnostic_outcomes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_outcomes
    ADD CONSTRAINT diagnostic_outcomes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: diagnostic_outcomes diagnostic_outcomes_troubleshooting_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_outcomes
    ADD CONSTRAINT diagnostic_outcomes_troubleshooting_session_id_fkey FOREIGN KEY (troubleshooting_session_id) REFERENCES public.calculations(id) ON DELETE CASCADE;


--
-- Name: diagnostic_outcomes diagnostic_outcomes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_outcomes
    ADD CONSTRAINT diagnostic_outcomes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: iaq_audits iaq_audits_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iaq_audits
    ADD CONSTRAINT iaq_audits_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: iaq_audits iaq_audits_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iaq_audits
    ADD CONSTRAINT iaq_audits_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: iaq_audits iaq_audits_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iaq_audits
    ADD CONSTRAINT iaq_audits_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: iaq_audits iaq_audits_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iaq_audits
    ADD CONSTRAINT iaq_audits_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES auth.users(id);


--
-- Name: integrations integrations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: invitation_links invitation_links_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_links
    ADD CONSTRAINT invitation_links_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invitation_links invitation_links_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_links
    ADD CONSTRAINT invitation_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: job_timeline job_timeline_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_timeline
    ADD CONSTRAINT job_timeline_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_timeline job_timeline_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_timeline
    ADD CONSTRAINT job_timeline_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: jobs jobs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: jobs jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: licenses licenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: refrigerant_cylinders refrigerant_cylinders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerant_cylinders
    ADD CONSTRAINT refrigerant_cylinders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refrigerant_logs refrigerant_logs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerant_logs
    ADD CONSTRAINT refrigerant_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;


--
-- Name: refrigerant_logs refrigerant_logs_cylinder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerant_logs
    ADD CONSTRAINT refrigerant_logs_cylinder_id_fkey FOREIGN KEY (cylinder_id) REFERENCES public.refrigerant_cylinders(id) ON DELETE SET NULL;


--
-- Name: refrigerant_logs refrigerant_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refrigerant_logs
    ADD CONSTRAINT refrigerant_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: rules_alerts rules_alerts_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules_alerts
    ADD CONSTRAINT rules_alerts_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: rules_alerts rules_alerts_reading_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules_alerts
    ADD CONSTRAINT rules_alerts_reading_id_fkey FOREIGN KEY (reading_id) REFERENCES public.telemetry_readings(id) ON DELETE SET NULL;


--
-- Name: rules_alerts rules_alerts_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rules_alerts
    ADD CONSTRAINT rules_alerts_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.automation_rules(id) ON DELETE CASCADE;


--
-- Name: skill_logs skill_logs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_logs
    ADD CONSTRAINT skill_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: skill_logs skill_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_logs
    ADD CONSTRAINT skill_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: skool_subscriptions skool_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skool_subscriptions
    ADD CONSTRAINT skool_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: telemetry_readings telemetry_readings_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telemetry_readings
    ADD CONSTRAINT telemetry_readings_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: user_consents user_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: warranty_claims warranty_claims_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: warranty_claims warranty_claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: workflow_requests workflow_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_requests
    ADD CONSTRAINT workflow_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: iceberg_namespaces iceberg_namespaces_catalog_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_catalog_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_namespace_id_fkey FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: company_settings Admins can manage settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Admins can manage settings" ON public.company_settings TO authenticated USING (((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.company_id = company_settings.company_id) AND (user_roles.role = 'admin'::public.user_role))))));


--
-- Name: user_roles Admins can update roles for their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Admins can update roles for their company" ON public.user_roles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles admin_role
  WHERE ((admin_role.user_id = auth.uid()) AND (admin_role.role = 'admin'::public.user_role) AND (admin_role.company_id = user_roles.company_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles admin_role
  WHERE ((admin_role.user_id = auth.uid()) AND (admin_role.role = 'admin'::public.user_role) AND (admin_role.company_id = user_roles.company_id)))));


--
-- Name: jobs Admins can view all jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Admins can view all jobs" ON public.jobs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::public.user_role)))));


--
-- Name: audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.company_id = audit_logs.company_id) AND (user_roles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));


--
-- Name: triage_submissions Admins can view triage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Admins can view triage" ON public.triage_submissions FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: triage_submissions Allow public submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Allow public submissions" ON public.triage_submissions FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: invoices Clients can view their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Clients can view their own invoices" ON public.invoices FOR SELECT USING ((client_id IN ( SELECT user_roles.client_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: invoices Clients view their own invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Clients view their own invoices" ON public.invoices FOR SELECT USING ((client_id IN ( SELECT user_roles.client_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: invoices Company Admins can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company Admins can manage invoices" ON public.invoices USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: invoices Company Admins manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company Admins manage invoices" ON public.invoices USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: diagnostic_outcomes Company can insert own outcomes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company can insert own outcomes" ON public.diagnostic_outcomes FOR INSERT WITH CHECK ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: ai_learning_patterns Company can insert own patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company can insert own patterns" ON public.ai_learning_patterns FOR INSERT WITH CHECK ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: diagnostic_outcomes Company can update own outcomes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company can update own outcomes" ON public.diagnostic_outcomes FOR UPDATE USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: ai_learning_patterns Company can update own patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company can update own patterns" ON public.ai_learning_patterns FOR UPDATE USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: diagnostic_outcomes Company can view own outcomes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company can view own outcomes" ON public.diagnostic_outcomes FOR SELECT USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: ai_learning_patterns Company can view own patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Company can view own patterns" ON public.ai_learning_patterns FOR SELECT USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: assets Enable asset read for all authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Enable asset read for all authenticated users" ON public.assets FOR SELECT TO authenticated USING (true);


--
-- Name: iaq_audits Manage IAQ Audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Manage IAQ Audits" ON public.iaq_audits USING ((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))));


--
-- Name: user_roles Manage: Admin ONLY create/delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Manage: Admin ONLY create/delete roles" ON public.user_roles USING (((public.get_my_role() = 'admin'::public.user_role) AND (company_id = public.get_my_company_id())));


--
-- Name: user_roles Manage: Admin/Manager update company roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Manage: Admin/Manager update company roles" ON public.user_roles FOR UPDATE USING (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (company_id = public.get_my_company_id())));


--
-- Name: user_roles Manage: Admin/Manager view company roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Manage: Admin/Manager view company roles" ON public.user_roles FOR SELECT USING ((((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (company_id = public.get_my_company_id())) OR (user_id = auth.uid())));


--
-- Name: assets Managers can create company assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can create company assets" ON public.assets FOR INSERT WITH CHECK (((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: jobs Managers can create company jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can create company jobs" ON public.jobs FOR INSERT WITH CHECK (((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: assets Managers can delete company assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can delete company assets" ON public.assets FOR DELETE USING (((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: jobs Managers can delete company jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can delete company jobs" ON public.jobs FOR DELETE USING (((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: assets Managers can update company assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can update company assets" ON public.assets FOR UPDATE USING (((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: jobs Managers can update company jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can update company jobs" ON public.jobs FOR UPDATE USING (((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: user_roles Managers can update company user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Managers can update company user roles" ON public.user_roles FOR UPDATE USING (((company_id = public.get_my_company_id()) AND (public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))));


--
-- Name: subscription_plans Public read plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Public read plans" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: jobs RBAC: Create Jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Create Jobs" ON public.jobs FOR INSERT WITH CHECK (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND ((company_id = public.get_my_company_id()) OR (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))))));


--
-- Name: workflow_requests RBAC: Create Requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Create Requests" ON public.workflow_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: jobs RBAC: Delete Jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Delete Jobs" ON public.jobs FOR DELETE USING (((public.get_my_role() = 'admin'::public.user_role) AND ((company_id = public.get_my_company_id()) OR (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))))));


--
-- Name: assets RBAC: Manage Assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Manage Assets" ON public.assets USING (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id())))));


--
-- Name: clients RBAC: Manage Clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Manage Clients" ON public.clients USING (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (company_id = public.get_my_company_id()))) WITH CHECK (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (company_id = public.get_my_company_id())));


--
-- Name: invitation_links RBAC: Manage Invitation Links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Manage Invitation Links" ON public.invitation_links TO authenticated USING (((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.company_id = invitation_links.company_id) AND (user_roles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role]))))))) WITH CHECK (((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.company_id = invitation_links.company_id) AND (user_roles.role = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])))))));


--
-- Name: automation_rules RBAC: Manage Rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Manage Rules" ON public.automation_rules USING (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (company_id = public.get_my_company_id())));


--
-- Name: workflow_requests RBAC: Manager Retry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Manager Retry" ON public.workflow_requests FOR UPDATE USING (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (user_id IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.company_id = public.get_my_company_id())))));


--
-- Name: jobs RBAC: Update Jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: Update Jobs" ON public.jobs FOR UPDATE USING ((((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND ((company_id = public.get_my_company_id()) OR (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))))) OR ((public.get_my_role() = 'tech'::public.user_role) AND (technician_id = auth.uid())))) WITH CHECK ((((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND ((company_id = public.get_my_company_id()) OR (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))))) OR ((public.get_my_role() = 'tech'::public.user_role) AND (technician_id = auth.uid()))));


--
-- Name: asset_audit_logs RBAC: View Asset Audit Logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Asset Audit Logs" ON public.asset_audit_logs FOR SELECT USING ((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])));


--
-- Name: assets RBAC: View Assets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Assets" ON public.assets FOR SELECT USING ((((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'tech'::public.user_role])) AND (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id())))) OR ((public.get_my_role() = 'client'::public.user_role) AND (client_id IN ( SELECT user_roles.client_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))))));


--
-- Name: clients RBAC: View Clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Clients" ON public.clients FOR SELECT USING ((((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'tech'::public.user_role])) AND (company_id = public.get_my_company_id())) OR ((public.get_my_role() = 'client'::public.user_role) AND (id IN ( SELECT user_roles.client_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))))));


--
-- Name: jobs RBAC: View Jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Jobs" ON public.jobs FOR SELECT USING ((((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND ((company_id = public.get_my_company_id()) OR (client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id = public.get_my_company_id()))))) OR ((public.get_my_role() = 'tech'::public.user_role) AND ((company_id = public.get_my_company_id()) OR (technician_id = auth.uid()))) OR ((public.get_my_role() = 'client'::public.user_role) AND (client_id IN ( SELECT user_roles.client_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))))));


--
-- Name: jobs RBAC: View Jobs Multi-Company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Jobs Multi-Company" ON public.jobs FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.check_user_can_access_company(jobs.company_id) check_user_can_access_company(check_user_can_access_company)
  WHERE (((public.check_user_can_access_company(jobs.company_id) ->> 'has_access'::text))::boolean = true))) OR (technician_id = auth.uid()) OR (client_id IN ( SELECT user_roles.client_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid())))));


--
-- Name: workflow_requests RBAC: View Requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Requests" ON public.workflow_requests FOR SELECT USING (((auth.uid() = user_id) OR ((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role])) AND (user_id IN ( SELECT user_roles.user_id
   FROM public.user_roles
  WHERE (user_roles.company_id = public.get_my_company_id()))))));


--
-- Name: automation_rules RBAC: View Rules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "RBAC: View Rules" ON public.automation_rules FOR SELECT USING (((public.get_my_role() = ANY (ARRAY['admin'::public.user_role, 'manager'::public.user_role, 'tech'::public.user_role])) AND (company_id = public.get_my_company_id())));


--
-- Name: job_timeline Read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Read access for authenticated users" ON public.job_timeline FOR SELECT TO authenticated USING (true);


--
-- Name: telemetry_readings Service Role can insert telemetry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Service Role can insert telemetry" ON public.telemetry_readings FOR INSERT WITH CHECK (true);


--
-- Name: diagnostic_outcomes Service Role full access outcomes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Service Role full access outcomes" ON public.diagnostic_outcomes USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ai_learning_patterns Service Role full access patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Service Role full access patterns" ON public.ai_learning_patterns USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: subscriptions Service role can manage all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Service role can manage all subscriptions" ON public.subscriptions USING ((auth.role() = 'service_role'::text));


--
-- Name: clients Strict Company Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Strict Company Isolation" ON public.clients TO authenticated USING ((company_id = public.get_my_company_id())) WITH CHECK ((company_id = public.get_my_company_id()));


--
-- Name: invoices Strict Company Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Strict Company Isolation" ON public.invoices TO authenticated USING ((company_id = public.get_my_company_id())) WITH CHECK ((company_id = public.get_my_company_id()));


--
-- Name: jobs Strict Company Isolation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Strict Company Isolation" ON public.jobs TO authenticated USING ((company_id = public.get_my_company_id())) WITH CHECK ((company_id = public.get_my_company_id()));


--
-- Name: jobs Technicians can update own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Technicians can update own jobs" ON public.jobs FOR UPDATE TO authenticated USING ((technician_id = auth.uid())) WITH CHECK ((technician_id = auth.uid()));


--
-- Name: job_timeline Techs and Admins can add timeline events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Techs and Admins can add timeline events" ON public.job_timeline FOR INSERT WITH CHECK ((job_id IN ( SELECT jobs.id
   FROM public.jobs)));


--
-- Name: job_timeline Techs can insert timeline for own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Techs can insert timeline for own jobs" ON public.job_timeline FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.jobs
  WHERE ((jobs.id = job_timeline.job_id) AND (jobs.technician_id = auth.uid())))));


--
-- Name: companies Users can create their own company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can create their own company" ON public.companies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: integrations Users can delete integrations for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete integrations for their clients" ON public.integrations FOR DELETE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id IN ( SELECT companies.id
           FROM public.companies
          WHERE (companies.user_id = auth.uid()))))));


--
-- Name: calculations Users can delete own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete own calculations" ON public.calculations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can delete their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete their own consents" ON public.user_consents FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: projects Users can delete their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete their own projects" ON public.projects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: warranty_claims Users can delete their own warranty claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can delete their own warranty claims" ON public.warranty_claims FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: integrations Users can insert integrations for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert integrations for their clients" ON public.integrations FOR INSERT WITH CHECK ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id IN ( SELECT companies.id
           FROM public.companies
          WHERE (companies.user_id = auth.uid()))))));


--
-- Name: calculations Users can insert own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert own calculations" ON public.calculations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: workflow_requests Users can insert own workflow_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert own workflow_requests" ON public.workflow_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: companies Users can insert their own company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own company" ON public.companies FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_consents Users can insert their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own consents" ON public.user_consents FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: refrigerant_cylinders Users can insert their own cylinders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own cylinders" ON public.refrigerant_cylinders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: refrigerant_logs Users can insert their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own logs" ON public.refrigerant_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: projects Users can insert their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: skill_logs Users can insert their own skill logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own skill logs" ON public.skill_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: warranty_claims Users can insert their own warranty claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can insert their own warranty claims" ON public.warranty_claims FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: asset_mappings Users can manage asset mappings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can manage asset mappings" ON public.asset_mappings USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.client_id IN ( SELECT clients.id
           FROM public.clients
          WHERE (clients.company_id IN ( SELECT companies.id
                   FROM public.companies
                  WHERE (companies.user_id = auth.uid()))))))));


--
-- Name: assets Users can manage assets of their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can manage assets of their clients" ON public.assets USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id IN ( SELECT companies.id
           FROM public.companies
          WHERE (companies.user_id = auth.uid()))))));


--
-- Name: integrations Users can update integrations for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update integrations for their clients" ON public.integrations FOR UPDATE USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id IN ( SELECT companies.id
           FROM public.companies
          WHERE (companies.user_id = auth.uid()))))));


--
-- Name: calculations Users can update own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update own calculations" ON public.calculations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: rules_alerts Users can update their alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their alerts" ON public.rules_alerts FOR UPDATE USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.client_id IN ( SELECT clients.id
           FROM public.clients
          WHERE (clients.company_id IN ( SELECT companies.id
                   FROM public.companies
                  WHERE (companies.user_id = auth.uid()))))))));


--
-- Name: companies Users can update their own company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own company" ON public.companies FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can update their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own consents" ON public.user_consents FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: refrigerant_cylinders Users can update their own cylinders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own cylinders" ON public.refrigerant_cylinders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: projects Users can update their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own projects" ON public.projects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: warranty_claims Users can update their own warranty claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can update their own warranty claims" ON public.warranty_claims FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: rules_alerts Users can view alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view alerts" ON public.rules_alerts FOR SELECT USING (((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.client_id IN ( SELECT clients.id
           FROM public.clients
          WHERE (clients.company_id IN ( SELECT companies.id
                   FROM public.companies
                  WHERE (companies.user_id = auth.uid()))))))) OR (asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.client_id IN ( SELECT user_roles.client_id
           FROM public.user_roles
          WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'client'::public.user_role))))))));


--
-- Name: integrations Users can view integrations for their clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view integrations for their clients" ON public.integrations FOR SELECT USING ((client_id IN ( SELECT clients.id
   FROM public.clients
  WHERE (clients.company_id IN ( SELECT companies.id
           FROM public.companies
          WHERE (companies.user_id = auth.uid()))))));


--
-- Name: calculations Users can view own calculations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view own calculations" ON public.calculations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workflow_requests Users can view own workflow_requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view own workflow_requests" ON public.workflow_requests FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: telemetry_readings Users can view telemetry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view telemetry" ON public.telemetry_readings FOR SELECT USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.client_id IN ( SELECT clients.id
           FROM public.clients
          WHERE (clients.company_id IN ( SELECT companies.id
                   FROM public.companies
                  WHERE (companies.user_id = auth.uid()))))))));


--
-- Name: rules_alerts Users can view their alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their alerts" ON public.rules_alerts FOR SELECT USING ((asset_id IN ( SELECT assets.id
   FROM public.assets
  WHERE (assets.client_id IN ( SELECT clients.id
           FROM public.clients
          WHERE (clients.company_id IN ( SELECT companies.id
                   FROM public.companies
                  WHERE (companies.user_id = auth.uid()))))))));


--
-- Name: companies Users can view their own company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own company" ON public.companies FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_consents Users can view their own consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own consents" ON public.user_consents FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: refrigerant_cylinders Users can view their own cylinders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own cylinders" ON public.refrigerant_cylinders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: licenses Users can view their own licenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own licenses" ON public.licenses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: refrigerant_logs Users can view their own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own logs" ON public.refrigerant_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: projects Users can view their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own projects" ON public.projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: skill_logs Users can view their own skill logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own skill logs" ON public.skill_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subscriptions Users can view their own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own subscription" ON public.subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: warranty_claims Users can view their own warranty claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view their own warranty claims" ON public.warranty_claims FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: job_timeline Users can view timeline of accessible jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "Users can view timeline of accessible jobs" ON public.job_timeline FOR SELECT USING ((job_id IN ( SELECT jobs.id
   FROM public.jobs)));


--
-- Name: companies View Active Company Details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "View Active Company Details" ON public.companies FOR SELECT TO authenticated USING (((id = public.get_my_company_id()) OR (id IN ( SELECT user_roles.company_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))) OR (user_id = auth.uid())));


--
-- Name: invitation_links View Active Company Invitation Links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "View Active Company Invitation Links" ON public.invitation_links FOR SELECT TO authenticated USING (((company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.company_id = invitation_links.company_id))))));


--
-- Name: user_roles View Members of Active Company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "View Members of Active Company" ON public.user_roles FOR SELECT TO authenticated USING (((company_id = public.get_my_company_id()) OR (user_id = auth.uid())));


--
-- Name: user_roles View Technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY IF NOT EXISTS "View Technicians" ON public.user_roles FOR SELECT TO authenticated USING ((role = ANY (ARRAY['technician'::public.user_role, 'tech'::public.user_role])));


--
-- Name: ai_learning_patterns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_mappings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_mappings ENABLE ROW LEVEL SECURITY;

--
-- Name: assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: automation_rules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

--
-- Name: calculations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: company_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: diagnostic_outcomes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diagnostic_outcomes ENABLE ROW LEVEL SECURITY;

--
-- Name: iaq_audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.iaq_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: invitation_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitation_links ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: job_timeline; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_timeline ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: licenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: refrigerant_cylinders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refrigerant_cylinders ENABLE ROW LEVEL SECURITY;

--
-- Name: refrigerant_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refrigerant_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: rules_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rules_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: skill_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.skill_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: telemetry_readings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telemetry_readings ENABLE ROW LEVEL SECURITY;

--
-- Name: triage_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.triage_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: warranty_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Authenticated users can upload company logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "Authenticated users can upload company logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'company-assets'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Authenticated users can upload evidence; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "Authenticated users can upload evidence" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'calculation-evidence'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Authenticated users can view evidence; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "Authenticated users can view evidence" ON storage.objects FOR SELECT USING (((bucket_id = 'calculation-evidence'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects IAQ Media Storage; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "IAQ Media Storage" ON storage.objects TO authenticated USING ((bucket_id = 'iaq-reports'::text));


--
-- Name: objects Public Access to company assets; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "Public Access to company assets" ON storage.objects FOR SELECT USING ((bucket_id = 'company-assets'::text));


--
-- Name: objects Public Read Triage; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "Public Read Triage" ON storage.objects FOR SELECT TO authenticated, anon USING ((bucket_id = 'triage-uploads'::text));


--
-- Name: objects Public Uploads Triage; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY IF NOT EXISTS "Public Uploads Triage" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK ((bucket_id = 'triage-uploads'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 8BhakXivIhnC13LsIGkrZ2F5Hrn4rN8CuRZDjWe07fEA31nYfSG9SBHlFztnopq

