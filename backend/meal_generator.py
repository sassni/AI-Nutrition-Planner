import pandas as pd
import random

# Load the AI-clustered dataset
try:
    df = pd.read_csv('ML_Categorized_Food_Database.csv')
except FileNotFoundError:
    print("Error: ML_Categorized_Food_Database.csv not found in the backend folder.")
    df = pd.DataFrame() # Fallback

def generate_meal(target_calories, template):
    """
    Selects foods based on the ML clusters and scales them to hit target calories.
    """
    if df.empty:
        return {"error": "Database missing"}

    selected_foods = []
    base_calories = 0.001 # Prevent division by zero
    
    # 1. Pick one random food for each category in our template
    for category in template:
        options = df[df['Category'] == category]
        if not options.empty:
            chosen_item = options.sample(1).iloc[0]
            selected_foods.append(chosen_item)
            base_calories += chosen_item['Caloric Value']
    
    # 2. Calculate the exact math multiplier to hit the target calories
    multiplier = target_calories / base_calories
    
    # 3. Scale the macros and build the response
    meal_details = {
        "items": [],
        "calories": 0,
        "macros": ""
    }
    
    total_pro = total_carb = total_fat = 0
    
    for item in selected_foods:
        # Assuming original DB values are per 100g
        portion_grams = 100 * multiplier 
        
        meal_details["items"].append(f"{portion_grams:.0f}g of {item['food']}")
        
        meal_details["calories"] += (item['Caloric Value'] * multiplier)
        total_pro += (item['Protein'] * multiplier)
        total_carb += (item['Carbohydrates'] * multiplier)
        total_fat += (item['Fat'] * multiplier)
        
    # Format cleanly for the frontend
    meal_details["calories"] = round(meal_details["calories"])
    meal_details["macros"] = f"P: {total_pro:.0f}g | C: {total_carb:.0f}g | F: {total_fat:.0f}g"
    
    return meal_details

def generate_full_day_plan(daily_caloric_need):
    """
    Distributes calories and generates the full day using our ML clusters.
    """
    # 30% Breakfast, 35% Lunch, 35% Dinner
    plan = {
        "breakfast": generate_meal(daily_caloric_need * 0.30, ['High Protein', 'High Carb']),
        "lunch": generate_meal(daily_caloric_need * 0.35, ['High Protein', 'High Carb', 'Low-Cal Carb/Veggie']),
        "dinner": generate_meal(daily_caloric_need * 0.35, ['High Protein', 'Low-Cal Carb/Veggie', 'Low-Cal Carb/Veggie'])
    }
    
    return plan