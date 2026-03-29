"use client";

import React, { useState, useEffect } from "react";
import { Activity, Apple, Scale, Calculator, Loader2, Utensils, Move, Home, Sun, Moon, MessageCircle, Flame, Dumbbell, X, Send, Leaf, ChevronDown, Droplets, CheckCircle2, Copy, Printer } from "lucide-react";

export default function Dashboard() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    activityLevel: "0",
  });
  const [bmi, setBmi] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [macroTotals, setMacroTotals] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.custom-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [openDropdown]);

  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !results) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, context: results }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || "Chat request failed.";
        throw new Error(errorMsg.includes("429") ? "Gemini Rate Limit Hit. I'm taking a 60-second cooldown!" : errorMsg);
      }

      setChatMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", content: err.message || "I'm having trouble connecting to the server. Please try again later." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

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
    setFormData({ age: "", weight: "", height: "", activityLevel: "0" });
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
          age: parseInt(formData.age, 10),
          bmi: parseFloat(bmi),
          activity_level: parseInt(formData.activityLevel, 10),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.error || "Failed to communicate with endpoint.";
        throw new Error(errorMsg.includes("429") ? "Gemini AI Rate Limit Exceeded. Please wait 60 seconds before generating." : errorMsg);
      }

      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      if (data.meal_plan) {
        Object.values(data.meal_plan).forEach((meal: any) => {
          if (meal.macros) {
            const parts = meal.macros.split('|');
            if (parts.length === 3) {
              const pStr = parts[0].replace(/\D/g, '');
              const cStr = parts[1].replace(/\D/g, '');
              const fStr = parts[2].replace(/\D/g, '');
              totalProtein += parseInt(pStr) || 0;
              totalCarbs += parseInt(cStr) || 0;
              totalFat += parseInt(fStr) || 0;
            }
          }
        });
      }
      setMacroTotals({ protein: totalProtein, carbs: totalCarbs, fat: totalFat });

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

  const formatRoutine = (routineStr: string) => {
    if (!routineStr.includes('| Exercises:')) {
      return { title: routineStr, exercises: [] };
    }
    const [titlePart, exercisePart] = routineStr.split('| Exercises:');
    const title = titlePart.trim() + ' | Exercises:';
    const rawExercises = exercisePart.split(',').map((ex: string) => ex.trim());
    
    const formattedExercises = rawExercises.map((ex: string) => {
      const lastSpace = ex.lastIndexOf(' ');
      if (lastSpace !== -1 && !ex.toLowerCase().includes('stretching')) {
        return ex.substring(0, lastSpace) + ' - ' + ex.substring(lastSpace + 1);
      }
      return ex;
    });
    return { title, exercises: formattedExercises };
  };

  const handleCopyPlan = () => {
    let formattedString = 'NUTRIX MEAL PLAN\n\n';

    if (results?.meal_plan) {
      Object.entries(results.meal_plan).forEach(([mealName, details]: any) => {
        formattedString += `${mealName.toUpperCase()}\n`;
        formattedString += `Calories: ${details.calories}kcal\n`;
        formattedString += `Macros: ${details.macros}\n`;
        details.items.forEach((item: string) => {
          formattedString += `• ${item}\n`;
        });
        formattedString += '\n';
      });
    }

    formattedString += 'NUTRIX TRAINING SPLIT\n\n';

    if (results?.workout_plan) {
      results.workout_plan.forEach((workout: any) => {
        const { title, exercises } = formatRoutine(workout.routine);
        formattedString += `${workout.day.toUpperCase()}\n`;
        formattedString += `${title}\n`;
        exercises.forEach((ex: string) => {
          formattedString += `• ${ex}\n`;
        });
        formattedString += '\n';
      });
    }

    navigator.clipboard.writeText(formattedString);
    showToast('Plan copied to clipboard!');
  };

  const handleSavePDF = async () => {
    window.print();
    showToast('PDF downloaded successfully!');
  };

  const waterIntakeLiters = formData.weight ? (Number(formData.weight) * 0.033).toFixed(1) : '2.5';

  return (
    <div className={`${isDark ? "dark" : ""}`}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-500 overflow-x-hidden p-6 pt-24">

        {/* Floating iOS Glassmorphism Dock */}
        <nav className="print:hidden fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center p-2 rounded-full border border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 gap-2">
          <button
            onClick={handleReset}
            className="p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
            title="Toggle AI Chat"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </nav>

        <div className="max-w-6xl mx-auto space-y-10">

          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-3xl mb-2 backdrop-blur-sm border border-emerald-500/20 shadow-sm">
              <Leaf className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent pb-1">
              Nutrix
            </h1>
          </header>

          {/* Main Content Layout Grid */}
          <div className="space-y-8">

            {/* ====== MAIN CONTENT LAYOUT ====== */}
            <div id="nutrix-export-area" className={`transition-all duration-700 ease-in-out ${!results ? "flex justify-center mt-12 mb-32" : "grid lg:grid-cols-12 gap-8 items-start"}`}>

              {/* Left Column Wrapper */}
              <div className={`flex flex-col w-full transition-all duration-700 ${!results ? "max-w-lg" : "lg:col-span-4"}`}>
                
                {/* Input Form Column */}
                <div className="print:hidden relative group w-full">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>

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
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-semibold text-base"
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
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-semibold text-base"
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
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-semibold text-base"
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
                          className="w-full bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 text-green-500 rounded-2xl px-5 py-4 pointer-events-none font-black text-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold flex items-center gap-1 uppercase tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">
                        <Move className="w-4 h-4" /> Activity Tier
                      </label>
                      <div className="relative custom-dropdown-container">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === 'activityLevel' ? null : 'activityLevel')}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors appearance-none cursor-pointer text-left font-semibold text-base"
                        >
                          {formData.activityLevel === "0" ? "Sedentary (Low or Desk Job)" : 
                           formData.activityLevel === "1" ? "Moderate (Exercise 3-5 days/wk)" : 
                           "Active (Athlete / Heavy Work)"}
                        </button>
                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none w-5 h-5 transition-transform ${openDropdown === 'activityLevel' ? 'rotate-180' : ''}`} />
                        
                        {openDropdown === 'activityLevel' && (
                          <div className="absolute z-50 w-full mt-2 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl">
                            {[
                              { value: "0", label: "Sedentary (Low or Desk Job)" },
                              { value: "1", label: "Moderate (Exercise 3-5 days/wk)" },
                              { value: "2", label: "Active (Athlete / Heavy Work)" }
                            ].map((option) => (
                              <div
                                key={option.value}
                                onClick={() => {
                                  setFormData({ ...formData, activityLevel: option.value });
                                  setOpenDropdown(null);
                                }}
                                className="px-4 py-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors font-semibold text-neutral-900 dark:text-white"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
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
                        <>Generate</>
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

                {/* Macro Visualizer Card */}
                {results && macroTotals.protein > 0 && (
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-neutral-900 dark:text-white">
                        <Leaf className="w-5 h-5 text-green-500" />
                        Daily Macro Distribution
                      </h3>
                      
                      {(() => {
                        const totalMacros = macroTotals.protein + macroTotals.carbs + macroTotals.fat;
                        const pPercentage = totalMacros > 0 ? (macroTotals.protein / totalMacros) * 100 : 0;
                        const cPercentage = totalMacros > 0 ? (macroTotals.carbs / totalMacros) * 100 : 0;
                        const fPercentage = totalMacros > 0 ? (macroTotals.fat / totalMacros) * 100 : 0;

                        return (
                          <div className="space-y-6">
                            {/* Stacked Progress Bar */}
                            <div className="w-full h-8 flex rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/5">
                              <div style={{ width: `${pPercentage}%` }} className="bg-green-500 transition-all duration-1000 ease-out" title={`Protein: ${macroTotals.protein}g`} />
                              <div style={{ width: `${cPercentage}%` }} className="bg-amber-400 transition-all duration-1000 ease-out" title={`Carbs: ${macroTotals.carbs}g`} />
                              <div style={{ width: `${fPercentage}%` }} className="bg-rose-500 transition-all duration-1000 ease-out" title={`Fat: ${macroTotals.fat}g`} />
                            </div>

                            {/* Legend Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center pt-2">
                              <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">{macroTotals.protein}g</div>
                                <div className="text-xs font-bold text-green-600 dark:text-green-500 uppercase tracking-widest mt-1">Protein</div>
                                <div className="text-[10px] font-semibold text-neutral-400">{pPercentage.toFixed(0)}%</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">{macroTotals.carbs}g</div>
                                <div className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">Carbs</div>
                                <div className="text-[10px] font-semibold text-neutral-400">{cPercentage.toFixed(0)}%</div>
                              </div>
                              <div>
                                <div className="text-xl font-black text-neutral-900 dark:text-white">{macroTotals.fat}g</div>
                                <div className="text-xs font-bold text-rose-600 dark:text-rose-500 uppercase tracking-widest mt-1">Fat</div>
                                <div className="text-[10px] font-semibold text-neutral-400">{fPercentage.toFixed(0)}%</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Hydration & Recovery Card */}
                {results && (
                  <div className="mt-6 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-neutral-900 dark:text-white">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        Hydration & Recovery
                      </h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-black text-neutral-900 dark:text-white">{waterIntakeLiters}</span>
                        <span className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Liters / day</span>
                      </div>
                      <hr className="border-neutral-100 dark:border-neutral-800 mb-4" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Whey Protein</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Creatine Monohydrate</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Multivitamin</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Actions Card */}
                {results && (
                  <div className="print:hidden mt-6 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl shadow-sm">
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Plan Actions</h3>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                          onClick={handleCopyPlan}
                          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors text-sm font-semibold text-neutral-900 dark:text-white"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Plan
                        </button>
                        <button
                          onClick={handleSavePDF}
                          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors text-sm font-semibold text-neutral-900 dark:text-white"
                        >
                          <Printer className="w-4 h-4" />
                          Save PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Column (Right - 8 columns) */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {results && (
                  <>
                    {/* Calorie Readout Banner */}
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

                    {/* Meals and Workouts Stacking */}
                    <div className="flex flex-col space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">

                      {/* Meal Plan Layout (2-Column Grid) */}
                      {results.meal_plan && (
                        <div className="space-y-5">
                          <h3 className="text-xl font-bold flex items-center gap-2 pl-2">
                            <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" />
                            Daily Macros & Routine
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(results.meal_plan).map(([mealName, details]: any) => (
                              <div key={mealName} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl hover:border-green-300 dark:hover:border-green-500/50 transition-colors shadow-sm group">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="capitalize font-extrabold text-neutral-900 dark:text-white text-lg">{mealName}</h4>
                                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-1">{details.macros}</p>
                                  </div>
                                  <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/20 border border-green-100 dark:border-green-500/30 px-3 py-1 rounded-full whitespace-nowrap">
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

                      {/* Workout Plan Feed (Full Width Below Meals) */}
                      {results.workout_plan && (
                        <div className="space-y-5 w-full">
                          <h3 className="text-xl font-bold flex items-center gap-2 pl-2">
                            <Dumbbell className="w-6 h-6 text-green-600 dark:text-green-400" />
                            Training Split
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.workout_plan.map((workout: any, idx: number) => {
                              const { title, exercises } = formatRoutine(workout.routine);
                              return (
                                <div key={idx} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm hover:border-green-300 dark:hover:border-green-500/50 transition-colors flex flex-col">
                                  <h4 className="font-extrabold text-neutral-900 dark:text-white text-lg mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-2">{workout.day}</h4>
                                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                    {title}
                                  </span>
                                  {exercises.length > 0 && (
                                    <ul className="list-inside list-disc mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                                      {exercises.map((ex: string, i: number) => (
                                        <li key={i} className="marker:text-green-500">{ex}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sliding AI Chat UI Panel (Modern Overhaul) */}
        <div
          className={`fixed right-6 top-24 bottom-24 w-full max-w-[400px] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl z-50 transition-all duration-500 ease-in-out flex flex-col rounded-3xl ${isChatOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-200/50 dark:border-neutral-800/50 relative">
            <h3 className="font-extrabold text-neutral-900 dark:text-white absolute left-1/2 -translate-x-1/2">AI Coach</h3>
            <div className="h-8 w-8"></div> {/* spacer for centering */}
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/50 dark:bg-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-full text-white mb-2 shadow-lg shadow-emerald-500/20">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold px-6">Generate your plan to unlock deep coaching insights.</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-gray-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tl-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl p-4 rounded-tl-sm flex items-center justify-center shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-transparent border-t border-neutral-200/50 dark:border-neutral-800/50 relative">
            <form onSubmit={handleSendMessage} className="flex gap-2 relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!results || isChatLoading}
                placeholder={results ? "Message your coach..." : "Generate plan first..."}
                className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/50 shadow-inner disabled:opacity-50 transition-all pr-12 text-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!results || isChatLoading || !chatInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-green-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 hover:bg-green-500 text-white w-10 h-10 rounded-full transition-all shadow-sm disabled:shadow-none flex items-center justify-center p-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
        </div>

      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-neutral-800 dark:border-neutral-200">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
