// Test script to see actual API response - run in browser console

async function testActualAPI() {
  try {
    console.log("Testing actual API...");
    
    const response = await fetch("https://simulateon-backend.onrender.com/calculate-standard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refrigerant: "R134a",
        evap_temp_c: -10,
        cond_temp_c: 45,
        superheat_c: 5,
        subcooling_c: 2
      }),
    });

    const responseData = await response.json();
    
    console.log("=== ACTUAL API RESPONSE ===");
    console.log(JSON.stringify(responseData, null, 2));
    
    if (responseData.data && responseData.data.state_points) {
      console.log("=== STATE POINTS STRUCTURE ===");
      Object.keys(responseData.data.state_points).forEach(key => {
        console.log(`${key}:`, responseData.data.state_points[key]);
        console.log(`Available properties:`, Object.keys(responseData.data.state_points[key]));
      });
    }
    
    if (responseData.data && responseData.data.performance) {
      console.log("=== PERFORMANCE STRUCTURE ===");
      console.log(responseData.data.performance);
      console.log("Available properties:", Object.keys(responseData.data.performance));
    }
    
    return responseData;
  } catch (error) {
    console.error("API Test Error:", error);
  }
}

// Run the test
testActualAPI();
