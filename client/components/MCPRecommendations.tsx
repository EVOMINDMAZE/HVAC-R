import React from 'react';

export function MCPRecommendations() {
  return (
    <div className="p-4 bg-white shadow rounded">
      <h3 className="font-semibold mb-2">Recommended Integrations</h3>
      <ul className="text-sm list-disc ml-5 space-y-1">
        <li>
          Sentry — Error monitoring and alerting for production issues. Click <a href="#" className="text-blue-600 underline">Connect to Sentry</a> to enable.
        </li>
        <li>
          Neon or Supabase — Managed Postgres for storing calculations and collaboration data. Click <a href="#" className="text-blue-600 underline">Connect to Neon</a>.
        </li>
        <li>
          Netlify — Deploy and host production builds. Click <a href="#" className="text-blue-600 underline">Connect to Netlify</a>.
        </li>
      </ul>
      <div className="mt-3 text-xs text-muted-foreground">
        To connect any integration, open the MCP popover from the top-right and select the service you want to connect.
      </div>
    </div>
  );
}
