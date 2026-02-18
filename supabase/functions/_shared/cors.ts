const ALLOWED_ORIGINS = [
  'https://thermoneural.com',
  'https://www.thermoneural.com',
  'https://app.thermoneural.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([a-z]+)\.supabase\.co/)?.[1] || '';

if (PROJECT_REF) {
  ALLOWED_ORIGINS.push(
    `https://${PROJECT_REF}.supabase.co`,
    `https://${PROJECT_REF}.supabase.net`
  );
}

export function getAllowedOrigin(origin: string | null): string {
  if (!origin) {
    return ALLOWED_ORIGINS[0];
  }
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  
  const isSupabasePreview = origin.includes('.supabase.') && origin.includes(PROJECT_REF);
  if (isSupabasePreview) {
    return origin;
  }
  
  const isNetlifyPreview = origin.includes('.netlify.app');
  if (isNetlifyPreview) {
    return origin;
  }
  
  return ALLOWED_ORIGINS[0];
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = getAllowedOrigin(origin);
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};