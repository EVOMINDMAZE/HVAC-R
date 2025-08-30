import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export function ApiTester() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testApiCall = async (endpoint: string, body: any) => {
    const startTime = Date.now();
    try {
      console.log(`Testing ${endpoint} with body:`, body);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseTime = Date.now() - startTime;
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      // Get response text first to see what we're actually receiving
      const responseText = await response.text();
      console.log(`Response text (first 500 chars):`, responseText.substring(0, 500));
      
      let parsedData;
      let parseError = null;
      
      // Try to parse as JSON
      try {
        parsedData = JSON.parse(responseText);
      } catch (error) {
        parseError = error;
        console.error('JSON parse error:', error);
      }

      return {
        endpoint,
        success: response.ok && !parseError,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        contentType: response.headers.get('content-type'),
        responseText: responseText.substring(0, 1000), // First 1000 chars
        parsedData,
        parseError: parseError?.message,
        isHtml: responseText.toLowerCase().includes('<!doctype') || responseText.toLowerCase().includes('<html')
      };
    } catch (error) {
      console.error(`Network error for ${endpoint}:`, error);
      return {
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const tests = [
      {
        endpoint: '/calculate-standard',
        body: {
          refrigerant: "R134a",
          evap_temp_c: -10,
          cond_temp_c: 40,
          superheat_c: 5,
          subcooling_c: 5
        }
      },
      {
        endpoint: '/compare-refrigerants',
        body: {
          refrigerants: ["R134a", "R410A"],
          cycle_params: {
            refrigerant: "placeholder",
            evap_temp_c: -10,
            cond_temp_c: 40,
            superheat_c: 5,
            subcooling_c: 5
          }
        }
      },
      {
        endpoint: '/calculate-cascade',
        body: {
          lt_cycle: {
            refrigerant: "R744",
            evap_temp_c: -40,
            cond_temp_c: -10,
            superheat_c: 5,
            subcooling_c: 5
          },
          ht_cycle: {
            refrigerant: "R134a",
            evap_temp_c: -15,
            cond_temp_c: 40,
            superheat_c: 5,
            subcooling_c: 5
          },
          cascade_hx_delta_t_c: 5
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      const result = await testApiCall(test.endpoint, test.body);
      results.push(result);
      setTestResults([...results]); // Update incrementally
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between calls
    }

    setIsLoading(false);
  };

  // Temporarily disabled to avoid automatic API calls that might cause JSON parsing errors
  return null;

  if (import.meta.env.MODE === 'production') {
    return null; // Don't show in production
  }

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader className="bg-yellow-100">
        <CardTitle className="flex items-center text-lg">
          <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
          API Debug Tester (Development Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <Button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isLoading ? 'Testing APIs...' : 'Test All API Endpoints'}
          </Button>
        </div>

        {testResults.map((result, index) => (
          <div key={index} className="mb-4 p-4 bg-white rounded-md border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {result.success ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="font-medium">{result.endpoint}</span>
              </div>
              <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {result.status || 'Error'}
              </Badge>
            </div>

            <div className="text-sm space-y-1">
              <div><strong>Status:</strong> {result.status} {result.statusText}</div>
              <div><strong>Response Time:</strong> {result.responseTime}ms</div>
              <div><strong>Content Type:</strong> {result.contentType || 'Unknown'}</div>
              {result.isHtml && (
                <div className="text-red-600"><strong>⚠️ WARNING:</strong> Response is HTML, not JSON!</div>
              )}
              
              {result.parseError && (
                <div className="text-red-600">
                  <strong>Parse Error:</strong> {result.parseError}
                </div>
              )}

              {result.error && (
                <div className="text-red-600">
                  <strong>Network Error:</strong> {result.error}
                </div>
              )}

              {result.responseText && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">View Raw Response</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {result.responseText}
                  </pre>
                </details>
              )}

              {result.parsedData && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-green-600">View Parsed JSON</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.parsedData, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
