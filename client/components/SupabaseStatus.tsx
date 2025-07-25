import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SupabaseStatus() {
  if (supabase) {
    return null; // Don't show anything if Supabase is properly configured
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Supabase Not Configured</AlertTitle>
      <AlertDescription className="text-orange-700">
        <p className="mb-3">
          Authentication and data saving features are currently disabled. To enable these features:
        </p>
        <ol className="list-decimal list-inside space-y-1 mb-3 text-sm">
          <li>Create a free Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline inline-flex items-center">supabase.com <ExternalLink className="h-3 w-3 ml-1" /></a></li>
          <li>Copy your project URL and anon key</li>
          <li>Set the environment variables:
            <code className="block mt-1 p-2 bg-orange-100 rounded text-xs">
              VITE_SUPABASE_URL=your-project-url<br/>
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </code>
          </li>
          <li>Create the calculations table in your Supabase database:
            <code className="block mt-1 p-2 bg-orange-100 rounded text-xs">
              CREATE TABLE calculations (<br/>
              &nbsp;&nbsp;id UUID DEFAULT gen_random_uuid() PRIMARY KEY,<br/>
              &nbsp;&nbsp;user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,<br/>
              &nbsp;&nbsp;created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),<br/>
              &nbsp;&nbsp;calculation_type TEXT NOT NULL,<br/>
              &nbsp;&nbsp;inputs JSONB NOT NULL,<br/>
              &nbsp;&nbsp;results JSONB NOT NULL,<br/>
              &nbsp;&nbsp;name TEXT<br/>
              );<br/>
              <br/>
              ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;<br/>
              <br/>
              CREATE POLICY "Users can manage their own calculations"<br/>
              ON calculations FOR ALL USING (auth.uid() = user_id);
            </code>
          </li>
        </ol>
        <p className="text-sm">
          You can still use all calculation features - only saving and authentication are disabled.
        </p>
      </AlertDescription>
    </Alert>
  );
}
