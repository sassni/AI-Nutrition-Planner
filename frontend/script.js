function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);

    if (weight > 0 && height > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        document.getElementById('bmi').value = bmi.toFixed(2);
    } else {
        document.getElementById('bmi').value = '';
    }
}

document.getElementById('weight').addEventListener('input', calculateBMI);
document.getElementById('height').addEventListener('input', calculateBMI);

document.getElementById('nutritionForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const age = document.getElementById('age').value;
    const bmi = document.getElementById('bmi').value;
    const activity = document.getElementById('activity').value;
    const resultDisplay = document.getElementById('result');
    const spinner = document.getElementById('loadingSpinner');

    // Show loading spinner
    spinner.style.display = "block";
    resultDisplay.innerText = "";

    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ age: Number(age), bmi: Number(bmi), activity_level: Number(activity) })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data); // Debugging

        // Hide spinner
        spinner.style.display = "none";

        if (data.caloric_need) {
            resultDisplay.innerText = `Recommended Caloric Intake: ${data.caloric_need.toFixed(2)} kcal`;
            resultDisplay.style.color = "#9D00FF"; /* Dark Neon Purple */
            const mealPlanDiv = document.getElementById("mealPlan");
            const meals = data.meal_plan;
            let html = `<h3 style="color:#00FF99;">Daily Meal Plan</h3>`;
            for (let meal in meals) {
                html += `<h4 style="color:#FFD700;">${meal.charAt(0).toUpperCase() + meal.slice(1)} (${meals[meal].calories} kcal)</h4><ul>`;
                meals[meal].items.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += `</ul>`;
            }
            mealPlanDiv.innerHTML = html;
        } else {
            resultDisplay.innerText = "Error: " + (data.error || "Invalid response from server");
            resultDisplay.style.color = "red";
        }
    } catch (error) {
        console.error("Error fetching nutrition plan:", error);
        resultDisplay.innerText = "Failed to get recommendation. Try again!";
        resultDisplay.style.color = "red";
    } finally {
        spinner.style.display = "none";
    }
});
