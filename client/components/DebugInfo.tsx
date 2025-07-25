import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugInfo() {
  const { user, session, isAuthenticated } = useSupabaseAuth();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200 mb-4">
      <CardHeader>
        <CardTitle className="text-yellow-800 text-sm">Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div><strong>Supabase Client:</strong> {supabase ? '✓ Available' : '✗ Not configured'}</div>
        <div><strong>User Authenticated:</strong> {isAuthenticated ? '✓ Yes' : '✗ No'}</div>
        <div><strong>User ID:</strong> {user?.id || 'None'}</div>
        <div><strong>User Email:</strong> {user?.email || 'None'}</div>
        <div><strong>Session:</strong> {session ? '✓ Active' : '✗ None'}</div>
        <div><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</div>
        <div><strong>Environment:</strong> {process.env.NODE_ENV}</div>
      </CardContent>
    </Card>
  );
}
