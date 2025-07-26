// Test script to analyze API response structure
async function testApiStructure() {
  try {
    const response = await fetch(
      "https://simulateon-backend.onrender.com/calculate-standard",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refrigerant: "R134a",
          evap_temp_c: -10,
          cond_temp_c: 45,
          superheat_c: 5,
          subcooling_c: 2,
        }),
      },
    );

    const data = await response.json();

    console.log("=== ACTUAL API RESPONSE STRUCTURE ===");
    console.log(JSON.stringify(data, null, 2));

    if (data.state_points) {
      console.log("\n=== STATE POINTS ANALYSIS ===");
      Object.keys(data.state_points).forEach((key) => {
        const point = data.state_points[key];
        console.log(`${key}: Available properties:`, Object.keys(point));
        console.log("  Sample values:", {
          temp_c: point.temp_c,
          temperature_c: point.temperature_c,
          temperature: point.temperature,
          pressure_kpa: point.pressure_kpa,
          pressure: point.pressure,
          enthalpy_kj_kg: point.enthalpy_kj_kg,
          enthalpy: point.enthalpy,
        });
      });
    }

    if (data.performance) {
      console.log("\n=== PERFORMANCE ANALYSIS ===");
      console.log("Available properties:", Object.keys(data.performance));
      console.log("Sample values:", {
        cop: data.performance.cop,
        cooling_capacity_kw: data.performance.cooling_capacity_kw,
        compressor_work_kw: data.performance.compressor_work_kw,
      });
    }
  } catch (error) {
    console.error("Error testing API:", error);
  }
}

testApiStructure();
