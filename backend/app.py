from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import tensorflow as tf
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

# 1. Load environment variables from your .env file
load_dotenv()

# 2. Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)

# Load your custom trained TF model and scaler
model = tf.keras.models.load_model("nutrition_model.keras")
scaler = joblib.load("scaler.pkl")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        age = data.get('age')
        bmi = data.get('bmi')
        activity_level = data.get('activity_level')

        # Ensure valid input
        if None in (age, bmi, activity_level):
            return jsonify({"error": "Missing input data"}), 400

        # --- STEP 1: THE MATH (Your TensorFlow Model) ---
        input_data = np.array([[float(age), float(bmi), float(activity_level)]])
        input_data = scaler.transform(input_data)
        prediction = model.predict(input_data)[0][0]
        caloric_need = float(prediction)

        # --- STEP 2: THE INTELLIGENCE (Gemini API) ---
        prompt = f"""
        You are a world-class AI nutritionist and fitness coach. 
        A user has the following profile:
        - Age: {age}
        - BMI: {bmi}
        - Activity Level: {activity_level} (1=Sedentary, 2=Moderate, 3=Active)
        - Target Daily Caloric Intake: {caloric_need:.0f} kcal

        Generate a highly customized daily meal plan and a weekly workout routine.
        Return the response strictly as a JSON object with the following structure:
        {{
            "meal_plan": {{
                "breakfast": {{"calories": 0, "macros": "Protein: Xg, Carbs: Yg, Fats: Zg", "items": ["item 1", "item 2"]}},
                "lunch": {{"calories": 0, "macros": "Protein: Xg, Carbs: Yg, Fats: Zg", "items": ["item 1", "item 2"]}},
                "snack": {{"calories": 0, "macros": "Protein: Xg, Carbs: Yg, Fats: Zg", "items": ["item 1", "item 2"]}},
                "dinner": {{"calories": 0, "macros": "Protein: Xg, Carbs: Yg, Fats: Zg", "items": ["item 1", "item 2"]}}
            }},
            "workout_plan": [
                {{"day": "Monday", "routine": "..."}},
                {{"day": "Tuesday", "routine": "..."}},
                {{"day": "Wednesday", "routine": "..."}},
                {{"day": "Thursday", "routine": "..."}},
                {{"day": "Friday", "routine": "..."}},
                {{"day": "Saturday", "routine": "..."}},
                {{"day": "Sunday", "routine": "..."}}
            ]
        }}
        Ensure the sum of the meal calories equals exactly {caloric_need:.0f}. 
        Make the food suggestions and workouts realistic and specific to their BMI and activity level.
        """

        # We use gemini-2.5-flash as it is lightning fast for this type of generation
        generative_model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Force the output to be JSON
        response = generative_model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )

        # Parse Gemini's JSON response
        ai_data = json.loads(response.text)

        # Return the combined custom model prediction and Gemini's dynamic content
        return jsonify({
            "caloric_need": round(caloric_need, 2),
            "meal_plan": ai_data.get("meal_plan"),
            "workout_plan": ai_data.get("workout_plan")
        })

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)