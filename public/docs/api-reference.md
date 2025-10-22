# API Reference

All calculations are performed by the Simulateon backend API. Use HTTPS POST requests with the `Content-Type: application/json` header.

## Base URL

`https://simulateon-backend.onrender.com`

## Endpoints

### Standard Cycle Calculation

- URL: `/calculate-standard`
- Method: `POST`
- Request body (example):

```json
{
  "refrigerant": "R134a",
  "evap_temp_c": -10,
  "cond_temp_c": 45,
  "superheat_c": 5,
  "subcooling_c": 2
}
```

- Success response: `{ "data": { /* calculation results */ } }`
- Error response: `{ "error": "message" }`

### Refrigerant Comparison

- URL: `/compare-refrigerants`
- Method: `POST`
- Request body (example):

```json
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
```

### Cascade Cycle Calculation

- URL: `/calculate-cascade`
- Method: `POST`
- Request body (example):

```json
{
  "lt_cycle": {
    "refrigerant": "R744",
    "evap_temp_c": -50,
    "cond_temp_c": -5,
    "superheat_c": 3,
    "subcooling_c": 2
  },
  "ht_cycle": {
    "refrigerant": "R134a",
    "evap_temp_c": 0,
    "cond_temp_c": 40,
    "superheat_c": 5,
    "subcooling_c": 2
  },
  "cascade_hx_delta_t_c": 5.0
}
```

## Error Handling

- If the response body contains `{ "error": "..." }`, show a user-friendly alert with that message — do not display raw JSON.
- For transient failures, implement retries with exponential backoff and surface clear messages to the user.

## Examples

See `api-examples.md` for concrete curl and JavaScript usage patterns.
