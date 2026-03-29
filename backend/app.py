from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import tensorflow as tf
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
from meal_generator import generate_full_day_plan

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
        print(f"--- ML PIPELINE AUDIT ---")
        print(f"Raw Extracted Variables -> Age: {age}, BMI: {bmi}, Activity Level: {activity_level}")

        input_data_raw = np.array([[float(age), float(bmi), float(activity_level)]])
        print(f"Input Array (Pre-Scaling): {input_data_raw}")

        input_data_scaled = scaler.transform(input_data_raw)
        print(f"Input Array (Post-Scaling): {input_data_scaled}")

        prediction = model.predict(input_data_scaled)[0][0]
        print(f"Raw Prediction Float: {prediction}")
        print(f"-------------------------")
        
        caloric_need = float(prediction)
        
        # --- NEW: Custom ML Meal Generator ---
        custom_meal_plan = generate_full_day_plan(caloric_need)

        # --- STEP 2: THE INTELLIGENCE (Gemini API) ---
        prompt = f"""
        You are a world-class AI fitness coach. 
        A user has the following profile:
        - Age: {age}
        - BMI: {bmi}
        - Activity Level: {activity_level} (0=Sedentary, 1=Moderate, 2=Active)

        Generate a highly customized weekly workout routine for this user.
        Return the response strictly as a JSON object with the following structure:
        {{
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
        Make the workouts realistic and specific to their BMI and activity level.
        """

        # We use gemini-2.5-flash as it is lightning fast for this type of generation
        generative_model = genai.GenerativeModel("gemini-2.5-flash")
        
        try:
            # Force the output to be JSON
            response = generative_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )

            # Parse Gemini's JSON response
            ai_data = json.loads(response.text)
            
            if "workout_plan" in ai_data:
                with open('last_workout_cache.json', 'w') as f:
                    json.dump(ai_data["workout_plan"], f)
        
        except Exception as e:
            print(f"Gemini API rate limit or error hit: {str(e)}")
            try:
                with open('last_workout_cache.json', 'r') as f:
                    cached_data = json.load(f)
                    ai_data = {"workout_plan": cached_data}
                    print("Successfully loaded fallback workout plan from local cache.")
            except FileNotFoundError:
                print("No local cache found. Falling back to generic 7-day plan.")
                ai_data = {
                    "workout_plan": [
                        {"day": "Monday", "routine": "Full Body Fundamentals | Exercises: Squats 3x10, Pushups 3x15, Plank 60s"},
                        {"day": "Tuesday", "routine": "Moderate Cardio | Exercises: Crunches 3x20, Burpees 3x10"},
                        {"day": "Wednesday", "routine": "Active Recovery | Exercises: Light Cardio 20m, Stretching"},
                        {"day": "Thursday", "routine": "Upper Body & Core Focus | Exercises: Dumbbell Rows 3x12, Shoulder Press 3x10"},
                        {"day": "Friday", "routine": "Lower Body Power | Exercises: Lunges 3x12, Glute Bridges 3x15"},
                        {"day": "Saturday", "routine": "Long Outdoor Activity | Exercises: Yoga Routine, Deep Stretching"},
                        {"day": "Sunday", "routine": "Rest and Hydrate"}
                    ]
                }

        # Return the combined custom model prediction and Gemini/Custom dynamic content
        return jsonify({
            "caloric_need": round(caloric_need, 2),
            "meal_plan": custom_meal_plan,
            "workout_plan": ai_data.get("workout_plan")
        })

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        context = data.get('context')

        if not user_message:
            return jsonify({"error": "Missing message data"}), 400

        # --- THE INTELLIGENCE (Gemini API for Conversational Chat) ---
        prompt = f"""
        You are a supportive, highly knowledgeable AI fitness and nutrition coach.
        You have just built the following customized diet and training plan for the user:
        
        {json.dumps(context, indent=2) if context else 'No specific plan context provided.'}
        
        The user has just sent you the following message:
        "{user_message}"
        
        Read their message carefully. Respond directly to them in a friendly, encouraging, and concise manner. 
        If they ask for adjustments or questions about their diet or workout, reference the plan provided above and offer specific advice.
        """

        generative_model = genai.GenerativeModel("gemini-2.5-flash")
        response = generative_model.generate_content(prompt)

        return jsonify({
            "reply": response.text
        })

    except Exception as e:
        print("Chat Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)