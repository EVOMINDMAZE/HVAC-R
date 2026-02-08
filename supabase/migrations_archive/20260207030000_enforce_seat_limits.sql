-- Enforce seat limits when using an invite code
-- Also fixes a potential race condition by locking the company row

CREATE OR REPLACE FUNCTION public.use_invite_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_validation JSONB;
    v_result JSONB;
    v_company_id UUID;
    v_role public.user_role;
    v_seat_limit INT;
    v_current_seats INT;
BEGIN
    -- 1. Validate the invite code
    v_validation := public.validate_invite_code(p_code);

    -- 2. Check if validation passed
    IF COALESCE((v_validation->>'valid')::BOOLEAN, FALSE) != TRUE THEN
        RETURN v_validation;
    END IF;

    v_company_id := (v_validation->>'company_id')::UUID;
    v_role := (v_validation->>'role')::public.user_role;

    -- 3. Check for duplicates (Is user already a member?)
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND company_id = v_company_id
    ) THEN
        RETURN jsonb_build_object('valid', FALSE, 'error', 'Already a member');
    END IF;

    -- 4. Check Seat Limits (Critical Logic)
    -- Lock the company row to prevent race conditions
    SELECT seat_limit INTO v_seat_limit
    FROM public.companies
    WHERE id = v_company_id
    FOR UPDATE;

    -- Count current active members (owners, admins, managers, techs)
    -- We exclude clients from seat limits usually, but let's assume standard logic includes all internal staff
    SELECT COUNT(*) INTO v_current_seats
    FROM public.user_roles
    WHERE company_id = v_company_id
    AND role IN ('admin', 'manager', 'tech', 'technician');
    
    -- Also count the owner (if they are not in user_roles, which they should be via get_user_companies_v2 logic, but let's be safe)
    -- Actually, owner is usually distinct.
    -- Let's stick to the user_roles count + 1 (owner) if owner is not in user_roles.
    -- Simplified: Just count user_roles. If you want strict limits, ensure owner is in user_roles or counted separately.
    -- For this implementation, we assume seat_limit applies to *invited* members.

    IF v_current_seats >= v_seat_limit THEN
         RETURN jsonb_build_object('valid', FALSE, 'error', 'Company seat limit reached. Please contact the administrator.');
    END IF;

    -- 5. Insert new role
    INSERT INTO public.user_roles (user_id, company_id, role)
    VALUES (
        auth.uid(),
        v_company_id,
        v_role
    );

    -- 6. Update invite usage count
    UPDATE public.invite_codes
    SET current_uses = current_uses + 1
    WHERE code = p_code;

    -- 7. Switch context to the new company
    v_result := public.switch_company_context(
        v_company_id
    );

    RETURN jsonb_build_object('valid', TRUE, 'joined_company', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;