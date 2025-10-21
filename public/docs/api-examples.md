# API Examples

This page contains minimal examples to call the backend calculation API. All endpoints require HTTPS and accept JSON bodies.

## cURL — Standard Cycle

```bash
curl -X POST https://simulateon-backend.onrender.com/calculate-standard \
  -H "Content-Type: application/json" \
  -d '{
    "refrigerant": "R134a",
    "evap_temp_c": -10,
    "cond_temp_c": 45,
    "superheat_c": 5,
    "subcooling_c": 2
  }'
```

## JavaScript (fetch)

```js
async function calculateStandard() {
  const resp = await fetch('https://simulateon-backend.onrender.com/calculate-standard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refrigerant: 'R134a', evap_temp_c: -10, cond_temp_c: 45, superheat_c: 5, subcooling_c: 2 })
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return data.data;
}
```

## Batch comparison

POST to `/compare-refrigerants` with a list of refrigerants and a common cycle parameter object to receive comparative metrics.

## Notes

- The API returns `{ "data": ... }` on success and `{ "error": "..." }` on failure — always check for `error` before using the result.
- For transient network issues, implement a retry with exponential backoff.
