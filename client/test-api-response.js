// Run this in browser console to see actual API response structure

fetch("https://simulateon-backend.onrender.com/calculate-standard", {
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
})
.then(response => response.json())
.then(data => {
    console.log("=== FULL API RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && data.data.state_points) {
        console.log("=== STATE POINTS STRUCTURE ===");
        Object.keys(data.data.state_points).forEach(key => {
            console.log(`${key}:`, Object.keys(data.data.state_points[key]));
        });
    }
    
    if (data.data && data.data.performance) {
        console.log("=== PERFORMANCE STRUCTURE ===");
        console.log(Object.keys(data.data.performance));
    }
})
.catch(error => console.error('Error:', error));
