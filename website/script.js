// Initialize falling leaves animation
function initLeavesAnimation() {
    const leavesContainer = document.getElementById('leavesBackground');
    
    // Number of leaves to create - only background leaves
    const numLeaves = 8;
    
    // Leaf configurations: [left position %, size, duration, delay, opacity]
    // Only background leaves on the sides, avoiding the center container area
    const leafConfigs = [
        [5, 60, 9, 0, 0.4],
        [12, 55, 10, 2, 0.35],
        [18, 65, 8.5, 0.5, 0.4],
        [25, 60, 11, 3, 0.35],
        [75, 55, 9.5, 1.5, 0.4],
        [82, 60, 10.5, 2.5, 0.35],
        [88, 65, 8, 1, 0.4],
        [95, 60, 12, 4, 0.35],
    ];
    
    // Load the leaves animation for each leaf
    for (let i = 0; i < numLeaves; i++) {
        const leafDiv = document.createElement('div');
        leafDiv.className = 'leaf-animation';
        leafDiv.id = `leaf-${i}`;
        
        // Apply configuration
        const config = leafConfigs[i] || [50, 50, 9, 0, 0.4];
        leafDiv.style.left = config[0] + '%';
        leafDiv.style.width = config[1] + 'px';
        leafDiv.style.height = config[1] + 'px';
        leafDiv.style.animationDuration = config[2] + 's';
        leafDiv.style.animationDelay = config[3] + 's';
        leafDiv.style.opacity = config[4];
        
        leavesContainer.appendChild(leafDiv);
        
        // Load Lottie animation
        lottie.loadAnimation({
            container: leafDiv,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: 'leaves.json'
        });
    }
}

// Start the animation when page loads
window.addEventListener('DOMContentLoaded', function() {
    initLeavesAnimation();
});

document.getElementById('cropForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const region = document.getElementById('region').value;
    const soilType = document.getElementById('soilType').value;
    const crop = document.getElementById('crop').value;
    const rainfall = parseFloat(document.getElementById('rainfall').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const fertilizerUsed = document.getElementById('fertilizerUsed').value;
    const irrigationUsed = document.getElementById('irrigationUsed').value;
    const weatherCondition = document.getElementById('weatherCondition').value;
    const daysToHarvest = parseInt(document.getElementById('daysToHarvest').value);
    
    // Create the input map object
    const inputMap = {
        "Region": region,
        "Soil_Type": soilType,
        "Crop": crop,
        "Rainfall_mm": rainfall,
        "Temperature_Celsius": temperature,
        "Fertilizer_Used": fertilizerUsed,
        "Irrigation_Used": irrigationUsed,
        "Weather_Condition": weatherCondition,
        "Days_to_Harvest": daysToHarvest
    };
    
    // Display the map
    const outputContainer = document.getElementById('outputContainer');
    const outputMap = document.getElementById('outputMap');
    const predictionContainer = document.getElementById('predictionContainer');
    const errorContainer = document.getElementById('errorContainer');
    const submitBtn = document.getElementById('submitBtn');
    
    // Format the output as JSON with proper indentation
    outputMap.textContent = JSON.stringify(inputMap, null, 4);
    
    // Show the output container
    outputContainer.style.display = 'block';
    predictionContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    
    // Show loading state
    submitBtn.textContent = 'Predicting...';
    submitBtn.disabled = true;
    
    try {
        // Send data to backend for prediction
        const response = await fetch('http://localhost:5001/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(inputMap)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Display prediction
            document.getElementById('predictionValue').textContent = result.prediction.toFixed(2);
            predictionContainer.style.display = 'block';
            errorContainer.style.display = 'none';
        } else {
            // Display error
            document.getElementById('errorMessage').textContent = result.error || 'Prediction failed';
            errorContainer.style.display = 'block';
            predictionContainer.style.display = 'none';
        }
    } catch (error) {
        // Display error
        document.getElementById('errorMessage').textContent = 'Error connecting to prediction server. Make sure the Flask server is running on port 5001.';
        errorContainer.style.display = 'block';
        predictionContainer.style.display = 'none';
        console.error('Error:', error);
    } finally {
        // Reset button
        submitBtn.textContent = 'Predict Yield';
        submitBtn.disabled = false;
    }
    
    // Smooth scroll to output
    outputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

