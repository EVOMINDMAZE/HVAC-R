
-- Migration: Fix JSON conversion bug in check_seat_limit
-- This resolves the "invalid input syntax for type json" error

BEGIN TRANSACTION;

CREATE OR REPLACE FUNCTION public.check_seat_limit(p_company_id UUID DEFAULT NULL::UUID)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
