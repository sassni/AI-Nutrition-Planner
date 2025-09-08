import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import tensorflow as tf

app = Flask(__name__)
CORS(app)

# Load trained model and scaler
model = tf.keras.models.load_model("nutrition_model.keras")
scaler = joblib.load("scaler.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        age = data.get('age')
        bmi = data.get('bmi')
        activity_level = data.get('activity_level')

        # --- Calorie Estimation Logic ---
        calories = 0
        if activity_level == 1:
            calories = 20 * bmi + age * 2
        elif activity_level == 2:
            calories = 25 * bmi + age * 2
        elif activity_level == 3:
            calories = 30 * bmi + age * 2

        # --- Meal Plan Generation ---
        meal_distribution = {
            "breakfast": 0.25,
            "lunch": 0.30,
            "snack": 0.15,
            "dinner": 0.30
        }

        food_database = {
        "breakfast": ["Oats with Milk", "Boiled Eggs", "Fruit Smoothie", "Greek Yogurt"],
        "lunch": ["Grilled Chicken with Rice", "Mixed Vegetable Curry", "Salmon Salad", "Quinoa Bowl"],
        "snack": ["Nuts & Seeds", "Banana", "Protein Bar", "Boiled Corn"],
        "dinner": ["Vegetable Soup", "Tofu Stir-fry", "Grilled Fish with Veggies", "Chapati with Lentils"]
        }

        meal_plan = {}
        for meal, ratio in meal_distribution.items():
            kcal = round(calories * ratio, 2)
            items = random.sample(food_database[meal], 2)
            meal_plan[meal] = {
                "calories": kcal,
                "items": items
            }

        return jsonify({
            "caloric_need": round(calories, 2),
            "meal_plan": meal_plan
        })

        # Ensure valid input
        if None in (age, bmi, activity_level):
            return jsonify({"error": "Missing input data"}), 400

        # Prepare input
        input_data = np.array([[float(age), float(bmi), float(activity_level)]])

        # Normalize data
        input_data = scaler.transform(input_data)

        # Predict calories
        prediction = model.predict(input_data)[0][0]

        print("Prediction Sent:", float(prediction))  # Debugging

        return jsonify({"caloric_need": float(prediction)})  # Convert NumPy float to Python float

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
