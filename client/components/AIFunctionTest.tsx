import React, { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function AIFunctionTest() {
  const [payloadText, setPayloadText] = useState<string>(`{\n  "payload": {\n    "symptom": "low cooling",\n    "ambient": { "db": 30, "wb": 24 },\n    "measurements": { "suction_psig": 15 },\n    "model": "Generic-AC"\n  },\n  "userRole": "technician"\n}`);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setError(null);
    setResult(null);
    let parsed: any = null;
    try {
      parsed = JSON.parse(payloadText);
    } catch (e: any) {
      setError('Invalid JSON payload: ' + (e?.message ?? String(e)));
      return;
    }

    setLoading(true);
    try {
      // Call aiTroubleshoot on the api client
      const resp = await apiClient.aiTroubleshoot(parsed);
      setResult(resp);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Troubleshoot Diagnostic Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <label className="block text-sm font-medium">Request JSON</label>
          <textarea
            className="w-full h-48 p-3 border rounded-md font-mono text-sm"
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Button onClick={runTest} disabled={loading}>
              {loading ? 'Running...' : 'Run Test'}
            </Button>
            <Button variant="ghost" onClick={() => { setPayloadText(''); setResult(null); setError(null); }}>
              Reset
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded">
              <strong>Error:</strong>
              <pre className="whitespace-pre-wrap mt-2 text-sm">{String(error)}</pre>
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong>Response:</strong>
              <pre className="whitespace-pre-wrap mt-2 text-sm">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
