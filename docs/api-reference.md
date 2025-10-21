# API Reference

All calculations are performed by our backend API. Use HTTPS POST requests with Content-Type: application/json.

## Base URL
https://simulateon-backend.onrender.com

## Endpoints
### Standard Cycle Calculation
- URL: /calculate-standard
- Method: POST
- Body:
  {
    "refrigerant": "R134a",
    "evap_temp_c": -10,
    "cond_temp_c": 45,
    "superheat_c": 5,
    "subcooling_c": 2
  }
- Success: {"data": {...}}
- Error: {"error": "message"}

### Refrigerant Comparison
- URL: /compare-refrigerants
- Method: POST
- Body:
  {
    "refrigerants": ["R134a", "R290"],
    "cycle_params": {
      "refrigerant": "placeholder",
      "evap_temp_c": -10,
      "cond_temp_c": 45,
      "superheat_c": 5,
      "subcooling_c": 2
    }
  }

### Cascade Cycle Calculation
- URL: /calculate-cascade
- Method: POST
- Body:
  {
    "lt_cycle": { /* low-temperature cycle */ },
    "ht_cycle": { /* high-temperature cycle */ },
    "cascade_hx_delta_t_c": 5.0
  }

## Error Handling
- If response contains {"error": "..."}, display a user-friendly alert. Do not show raw JSON.
- Implement retries and backoff for transient failures.

## Examples
See docs/api-examples.md for curl and JavaScript examples.
