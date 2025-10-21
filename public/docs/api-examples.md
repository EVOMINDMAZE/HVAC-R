# API Examples

## cURL - Standard Cycle
curl -X POST https://simulateon-backend.onrender.com/calculate-standard \
  -H "Content-Type: application/json" \
  -d '{"refrigerant":"R134a","evap_temp_c":-10,"cond_temp_c":45,"superheat_c":5,"subcooling_c":2}'

## JavaScript (fetch)
```js
const res = await fetch('https://simulateon-backend.onrender.com/calculate-standard', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ refrigerant: 'R134a', evap_temp_c: -10, cond_temp_c: 45, superheat_c:5, subcooling_c:2 })
});
const json = await res.json();
if (json.error) throw new Error(json.error);
console.log(json.data);
```

## Batch comparison example
POST /compare-refrigerants with an array of refrigerants and the same cycle parameters to obtain comparative metrics.

## Notes
- Always check for {"error":"..."} in the response and display a user-friendly message.
- Respect rate limits and implement exponential backoff for retries.
