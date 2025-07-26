// Quick test of new API structure
fetch("https://simulateon-backend.onrender.com/calculate-standard", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    refrigerant: "R134a",
    evap_temp_c: -10,
    cond_temp_c: 45,
    superheat_c: 5,
    subcooling_c: 2,
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("\n=== NEW API RESPONSE STRUCTURE ===");
    console.log(JSON.stringify(data, null, 2));

    if (data.data && data.data.performance) {
      console.log("\n=== PERFORMANCE PROPERTIES ===");
      Object.keys(data.data.performance).forEach((key) => {
        console.log(
          `${key}: ${data.data.performance[key]} (${typeof data.data.performance[key]})`,
        );
      });
    }
  })
  .catch((err) => console.error("Error:", err));
