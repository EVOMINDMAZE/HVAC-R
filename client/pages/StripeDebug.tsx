import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useStripeCheckout } from '@/hooks/useStripe';
import { STRIPE_PRICE_IDS } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

export function StripeDebug() {
  const { isAuthenticated, user, session } = useSupabaseAuth();
  const { createCheckoutSession, loading, error } = useStripeCheckout();
  const { addToast } = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testStripeConfig = () => {
    console.log('Stripe Price IDs:', STRIPE_PRICE_IDS);
    addTestResult(`Stripe Price IDs loaded: ${JSON.stringify(STRIPE_PRICE_IDS, null, 2)}`);
  };

  const testAuthentication = () => {
    console.log('Auth status:', { isAuthenticated, user, hasSession: !!session });
    addTestResult(`Auth status - Authenticated: ${isAuthenticated}, User: ${user?.email || 'none'}, Session: ${!!session}`);
  };

  const testBillingAPI = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/billing/test`);
      const data = await response.json();
      console.log('Billing API test:', data);
      addTestResult(`Billing API test: ${JSON.stringify(data)}`);
    } catch (err: any) {
      console.error('Billing API error:', err);
      addTestResult(`Billing API error: ${err.message}`);
    }
  };

  const testCheckoutSession = async (priceId: string, planName: string) => {
    if (!isAuthenticated) {
      addTestResult(`Cannot test checkout - not authenticated`);
      addToast({
        type: 'error',
        title: 'Not Authenticated',
        description: 'Please sign in to test checkout functionality'
      });
      return;
    }

    try {
      addTestResult(`Testing checkout session for ${planName} with price ID: ${priceId}`);
      await createCheckoutSession(priceId);
      addTestResult(`Checkout session created successfully for ${planName}`);
    } catch (err: any) {
      console.error('Checkout test error:', err);
      addTestResult(`Checkout session error for ${planName}: ${err.message}`);
    }
  };

  const testWithoutAuth = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: 'test-price-id' }),
      });
      const data = await response.json();
      console.log('Test checkout without auth:', data);
      addTestResult(`Test checkout without auth: ${JSON.stringify(data)}`);
    } catch (err: any) {
      console.error('Test checkout error:', err);
      addTestResult(`Test checkout error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Integration Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={testStripeConfig}>Test Stripe Config</Button>
            <Button onClick={testAuthentication}>Test Authentication</Button>
            <Button onClick={testBillingAPI}>Test Billing API</Button>
            <Button onClick={testWithoutAuth}>Test Without Auth</Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Test Checkout Sessions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => testCheckoutSession(STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY, 'Professional Monthly')}
                disabled={loading}
                variant="outline"
              >
                Professional Monthly
              </Button>
              <Button 
                onClick={() => testCheckoutSession(STRIPE_PRICE_IDS.PROFESSIONAL_YEARLY, 'Professional Yearly')}
                disabled={loading}
                variant="outline"
              >
                Professional Yearly
              </Button>
              <Button 
                onClick={() => testCheckoutSession(STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY, 'Enterprise Monthly')}
                disabled={loading}
                variant="outline"
              >
                Enterprise Monthly
              </Button>
              <Button 
                onClick={() => testCheckoutSession(STRIPE_PRICE_IDS.ENTERPRISE_YEARLY, 'Enterprise Yearly')}
                disabled={loading}
                variant="outline"
              >
                Enterprise Yearly
              </Button>
            </div>
          </div>

          {loading && <div className="text-blue-600">Processing checkout...</div>}
          {error && <div className="text-red-600">Error: {error}</div>}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Test Results</h3>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No test results yet</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm mb-1 font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <Button 
            onClick={() => setTestResults([])}
            variant="outline"
            size="sm"
          >
            Clear Results
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
