"use client";

import React, { useState, useEffect } from "react";
import { Activity, Apple, Scale, Calculator, Loader2, Utensils, Move, Home, Sun, Moon, MessageCircle, Flame, Dumbbell } from "lucide-react";

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    activityLevel: "1",
  });
  const [bmi, setBmi] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Apply dark mode globally to the <html> document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Live BMI Calculation
  useEffect(() => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(calculatedBmi.toFixed(1));
    } else {
      setBmi("");
    }
  }, [formData.weight, formData.height]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setFormData({ age: "", weight: "", height: "", activityLevel: "1" });
    setResults(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults(null);

    if (!formData.age || !bmi || !formData.activityLevel) {
      setError("Please fill out all fields.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(formData.age),
          bmi: Number(bmi),
          activity_level: Number(formData.activityLevel),
        }),
      });

      if (!response.ok) throw new Error("Failed to communicate with endpoint.");

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResults({
        caloric_need: data.caloric_need,
        meal_plan: data.meal_plan,
        workout_plan: data.workout_plan,
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-500 overflow-x-hidden p-6 pt-24">

        {/* Floating iOS Glassmorphism Dock */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center p-2 rounded-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 gap-2">
          <button
            onClick={handleReset}
            className="p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            className="p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
            title="AI Chat Coming Soon"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="max-w-6xl mx-auto space-y-10">

          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-3xl mb-2 backdrop-blur-sm border border-purple-500/20 shadow-sm">
              <Apple className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-emerald-500 dark:from-purple-400 dark:to-emerald-400 bg-clip-text text-transparent pb-1">
              AI Nutrition Planner
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto text-lg/relaxed font-medium">
              Precision biometrics paired with intelligence. Map your unique engine.
            </p>
          </header>

          {/* Main Content Layout Grid */}
          <div className="space-y-8">

            {/* ====== TOP ROW (Form vs. Chat + Target Card) ====== */}
            <div className="grid lg:grid-cols-2 gap-8 items-stretch">

              {/* Input Form Column (Left) */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500/20 to-emerald-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>

                <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl shadow-neutral-200/50 dark:shadow-none transition-colors duration-500 h-full">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-neutral-400" />
                    Biometric Engine
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          placeholder="e.g. 25"
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold text-base"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">Weight (kg)</label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="e.g. 70"
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">Height (cm)</label>
                        <input
                          type="number"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          placeholder="e.g. 175"
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold text-base"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold flex items-center gap-1 uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">
                          <Scale className="w-4 h-4" /> Est. BMI
                        </label>
                        <input
                          type="text"
                          value={bmi}
                          readOnly
                          placeholder="--"
                          className="w-full bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 text-emerald-600 dark:text-emerald-400 rounded-2xl px-5 py-4 pointer-events-none font-black text-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold flex items-center gap-1 uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">
                        <Move className="w-4 h-4" /> Activity Tier
                      </label>
                      <div className="relative">
                        <select
                          name="activityLevel"
                          value={formData.activityLevel}
                          onChange={handleChange}
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-semibold cursor-pointer text-base"
                        >
                          <option value="1">Sedentary (Low or Desk Job)</option>
                          <option value="2">Moderate (Exercise 3-5 days/wk)</option>
                          <option value="3">Active (Athlete / Heavy Work)</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-sm">
                          ▼
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-6 w-full py-4 bg-neutral-900 border border-neutral-900 dark:bg-white dark:border-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black active:scale-[0.98] rounded-2xl font-bold transition-all flex items-center justify-center gap-2 overflow-hidden relative group/btn text-base"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Synchronizing...
                        </>
                      ) : (
                        <>Generate Intelligence</>
                      )}
                    </button>

                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold flex justify-center text-center">
                        {error}
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* AI Chat & Conditional Calorie Banner (Right) */}
              <div className="flex flex-col justify-between gap-8 h-full">

                {/* DEFAULT VIEW: AI CHAT WINDOW */}
                <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[350px]">
                  <div>
                    <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-5">
                      <div className="h-10 w-10 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white">AI Nutrition Coach</h3>
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Powered by Gemini 2.5 Flash</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 pr-2">
                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 bg-purple-100 dark:bg-purple-500/20 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                          <Apple className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl p-4 rounded-tl-none">
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {!results
                              ? "Hello! Input your biometrics on the left, and I will strictly map your daily macros alongside a highly customized 7-day workout split."
                              : "Your intelligence mapping is complete! You can review your customized caloric baseline, daily meal routine, and weekly workout output right below."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <input type="text" placeholder="Ask your coach for a recipe adjustment..." className="flex-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 rounded-xl transition-colors shadow-sm shadow-purple-500/20">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Conditional Compact Calorie Readout Banner */}
                {results && (
                  <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3 px-6 shadow-sm flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                        <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-neutral-500 dark:text-neutral-400 font-bold tracking-widest uppercase text-[10px] mb-0.5">Target Baseline Requirement</h3>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                            {results.caloric_need}
                          </p>
                          <span className="text-xs text-emerald-700/60 dark:text-emerald-500/60 font-bold uppercase tracking-wider">kcal/day</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ====== BOTTOM ROW (Meals vs. Workouts) ====== */}
            {results && (
              <div className="grid lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">

                {/* Meal Plan List (Left) */}
                {results.meal_plan && (
                  <div className="space-y-5">
                    <h3 className="text-xl font-bold flex items-center gap-2 pl-2">
                      <Utensils className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      Daily Macros & Routine
                    </h3>
                    <div className="flex flex-col gap-4">
                      {Object.entries(results.meal_plan).map(([mealName, details]: any) => (
                        <div key={mealName} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors shadow-sm group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="capitalize font-extrabold text-neutral-900 dark:text-white text-lg">{mealName}</h4>
                              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">{details.macros}</p>
                            </div>
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20 border border-purple-100 dark:border-purple-500/30 px-3 py-1 rounded-full whitespace-nowrap">
                              {details.calories} kcal
                            </span>
                          </div>
                          <ul className="text-sm font-medium text-neutral-600 dark:text-neutral-300 list-disc list-inside space-y-1.5 ml-1 mt-3">
                            {details.items.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workout Plan Feed (Right) */}
                {results.workout_plan && (
                  <div className="space-y-5">
                    <h3 className="text-xl font-bold flex items-center gap-2 pl-2">
                      <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      Training Split
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.workout_plan.map((workout: any, idx: number) => (
                        <div key={idx} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors flex flex-col">
                          <h4 className="font-extrabold text-neutral-900 dark:text-white text-lg mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-2">{workout.day}</h4>
                          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {workout.routine}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
