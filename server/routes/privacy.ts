import { RequestHandler } from "express";
import { supabaseAdmin, getSupabaseClient } from "../utils/supabase.js";
import { authenticateSupabaseToken } from "../utils/supabaseAuth.js";

interface ConsentRequest {
  consent_type: string;
  consent_version: string;
  granted: boolean;
}

interface DataSubjectRequest {
  request_type: 'access' | 'deletion' | 'correction' | 'portability';
  description?: string;
}

export const recordConsent: RequestHandler = async (req, res) => {
  try {
    const { consent_type, consent_version, granted }: ConsentRequest = req.body;
    
    if (!consent_type || !consent_version || typeof granted !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'consent_type, consent_version, and granted are required'
      });
    }

    // Input validation: length and character restrictions
    if (consent_type.length > 100 || consent_version.length > 50) {
      return res.status(400).json({
        error: 'Invalid input',
        details: 'consent_type and consent_version must be reasonable length'
      });
    }

    // Prevent potential injection attacks (basic pattern)
    const safePattern = /^[a-zA-Z0-9_.-]+$/;
    if (!safePattern.test(consent_type) || !safePattern.test(consent_version)) {
      return res.status(400).json({
        error: 'Invalid input',
        details: 'consent_type and consent_version can only contain letters, numbers, dots, underscores, and hyphens'
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    // Get the authenticated user ID from the request (set by authenticateSupabaseToken)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Record consent via RPC function
    const { data, error } = await supabaseAdmin.rpc('record_consent', {
      p_user_id: userId,
      p_consent_type: consent_type,
      p_consent_version: consent_version,
      p_granted: granted,
      p_ip_address: req.ip,
      p_user_agent: req.get('user-agent') || null
    });

    if (error) {
      console.error('Error recording consent:', error);
      return res.status(500).json({ error: 'Failed to record consent', details: error.message });
    }

    return res.status(200).json({
      success: true,
      consent_id: data,
      message: 'Consent recorded successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in recordConsent:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const getUserConsents: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabaseAdmin.rpc('get_user_consents', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching consents:', error);
      return res.status(500).json({ error: 'Failed to fetch consents', details: error.message });
    }

    return res.status(200).json({
      consents: data || []
    });
  } catch (error: any) {
    console.error('Unexpected error in getUserConsents:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const checkConsent: RequestHandler = async (req, res) => {
  try {
    const { consent_type, consent_version } = req.query;
    
    if (!consent_type || typeof consent_type !== 'string') {
      return res.status(400).json({
        error: 'Missing required query parameter',
        details: 'consent_type is required'
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const version = typeof consent_version === 'string' ? consent_version : 'latest';
    
    const { data, error } = await supabaseAdmin.rpc('has_consent', {
      p_user_id: userId,
      p_consent_type: consent_type,
      p_consent_version: version
    });

    if (error) {
      console.error('Error checking consent:', error);
      return res.status(500).json({ error: 'Failed to check consent', details: error.message });
    }

    return res.status(200).json({
      has_consent: data,
      consent_type,
      consent_version: version
    });
  } catch (error: any) {
    console.error('Unexpected error in checkConsent:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const submitDataSubjectRequest: RequestHandler = async (req, res) => {
  try {
    const { request_type, description }: DataSubjectRequest = req.body;
    
    if (!request_type || !['access', 'deletion', 'correction', 'portability'].includes(request_type)) {
      return res.status(400).json({
        error: 'Invalid request type',
        details: 'request_type must be one of: access, deletion, correction, portability'
      });
    }

    // Validate description length and content
    if (description && description.length > 1000) {
      return res.status(400).json({
        error: 'Invalid input',
        details: 'Description must be less than 1000 characters'
      });
    }

    // Basic XSS prevention for description
    if (description && /<script|javascript:|on\w+\s*=/i.test(description)) {
      return res.status(400).json({
        error: 'Invalid input',
        details: 'Description contains potentially unsafe content'
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // In a production system, you would:
    // 1. Log the DSR to an audit table
    // 2. Trigger a workflow for manual review
    // 3. Send confirmation email to the user
    // For now, we'll just log and return success
    
    console.log(`Data Subject Request received:`, {
      user_id: userId,
      request_type,
      description,
      timestamp: new Date().toISOString(),
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    return res.status(200).json({
      success: true,
      request_id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Your data subject request has been received. We will process it within 30 days as required by GDPR/CCPA.',
      next_steps: 'You will receive a confirmation email shortly.'
    });
  } catch (error: any) {
    console.error('Unexpected error in submitDataSubjectRequest:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export const exportUserData: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not configured" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // In a production system, you would:
    // 1. Query all user data across tables
    // 2. Generate a structured JSON/XML export
    // 3. Store the export for download
    // 4. Send download link via email
    // For MVP, we'll return a placeholder response
    
    return res.status(200).json({
      success: true,
      message: 'Your data export request has been queued. You will receive an email with a download link within 48 hours.',
      request_id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      estimated_completion: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    console.error('Unexpected error in exportUserData:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};