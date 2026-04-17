<h1 align="center">
  <br>
  Nutrix
  <br>
</h1>

<h4 align="center">An AI-Driven Personalized Nutrition & Fitness Platform</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <br>
  <img src="https://img.shields.io/badge/Flask-3-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TensorFlow-2.x-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
  <img src="https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/scikit--learn-K--Means-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="scikit-learn">
</p>

<p align="center">
  <a href="#-project-overview">Overview</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation--setup">Installation</a> •
  <a href="#-usage">Usage</a>
</p>

---

## Project Overview

**Nutrix** is a full-stack, AI-driven personalized nutrition and fitness platform designed to solve one of the most persistent challenges in consumer health technology: **the inability of Large Language Models (LLMs) to perform reliable nutritional mathematics**. Standard LLMs are prone to "math hallucinations," where they confidently return caloric and macro values that are factually incorrect — a critical failure mode in a health-critical context. Nutrix eliminates this flaw entirely by separating concerns: all mathematical computation is handled by a deterministic, custom-trained **TensorFlow deep learning model** and a constraint-based **Calorie Balancing Solver**, while the Gemini API is reserved exclusively for what it excels at — natural language generation, personalized coaching, and contextual reasoning.

The system ingests a user's biometric profile (age, weight, height, activity level), auto-calculates their BMI in real-time, and feeds this data into a trained neural network to predict their precise daily caloric baseline. This caloric target is then passed through a **K-Means ML clustering engine** — trained on a categorized food database of thousands of items across five nutritional groups — to assemble a portion-scaled, mathematically-exact daily meal plan. A separate Gemini AI call generates a personalized weekly workout routine in structured JSON, with a **Last-Known-Good (LKG) Cache system** providing automatic fallback if the API is unavailable. The result is a platform that is simultaneously intelligent, mathematically correct, and fault-tolerant.

---

## Key Features

-   **Hybrid AI Pipeline:** Combines a custom TensorFlow model for deterministic calorie prediction with Google Gemini 2.5 Flash for personalized coaching — ensuring mathematical accuracy that pure LLMs cannot provide.
-   **Biometric Engine:** Real-time, client-side BMI calculation. Users simply enter age, weight, height, and activity tier; the system auto-derives their BMI before submitting.
-   **Exact Macro-Scaled Meal Plans:** A custom **K-Means Constraint Solver** (`meal_generator.py`) selects foods from an ML-categorized database and scales portions using a mathematical multiplier, guaranteeing the meal plan hits the predicted caloric target precisely.
-   **AI-Generated Weekly Training Split:** Gemini 2.5 Flash produces a structured 7-day workout routine personalized to the user's BMI and activity level, returned as a typed JSON object and rendered as a clean card-based UI.
-   **Contextual AI Coach (Chat):** A sliding chat panel powered by Gemini allows users to ask questions about their generated plan. The full plan context is injected into every prompt, enabling deeply relevant, personalized responses.
-   **LKG (Last-Known-Good) Cache System:** If the Gemini API returns a rate-limit error (HTTP 429) or any other failure, the backend automatically serves the last successfully generated workout plan from `last_workout_cache.json`, with a hard-coded generic plan as the final fallback. Zero downtime for the user.
-   **Daily Macro Distribution Visualizer:** An animated stacked progress bar displays the daily Protein / Carbs / Fat split across all meals at a glance.
-   **Hydration & Recovery Card:** Dynamically calculates the user's recommended daily water intake (0.033L × body weight) and surfaces evidence-based supplement recommendations.
-   **PDF Export & Clipboard Copy:** Users can export their full meal plan and training split to PDF via the browser's print API, or copy the formatted plan to their clipboard in one click.
-   **Glassmorphism UI with Dark Mode:** A premium, iOS-inspired floating dock navigation with a toggleable dark/light theme, backdrop-blur glass panels, and smooth animations built with Tailwind CSS v4.

---

## Architecture

Nutrix uses a **strict decoupled architecture** that separates the presentation layer from the AI/ML computation layer:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER's BROWSER                          │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │           FRONTEND  (Next.js / React 19)             │  │
│   │   • Single-Page Application on localhost:3000        │  │
│   │   • Glassmorphism UI  (Tailwind CSS v4)              │  │
│   │   • Biometric Form → Real-time BMI Calculation       │  │
│   │   • AI Chat Panel  (Sliding Overlay)                 │  │
│   │   • PDF Export via jsPDF / html2canvas               │  │
│   └──────────────────────┬───────────────────────────────┘  │
│                          │  HTTP REST (JSON)                 │
│            POST /predict │  POST /chat                       │
└──────────────────────────┼──────────────────────────────────┘
                           │ CORS-enabled
┌──────────────────────────▼──────────────────────────────────┐
│                BACKEND  (Python / Flask)                     │
│                    localhost:5000                            │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │            AI / ML PIPELINE  (/predict)              │  │
│   │                                                      │  │
│   │  [Biometrics] → [nutrition_model.keras] → [kcal]    │  │
│   │                         ↓                            │  │
│   │  [K-Means Clustered DB] → [Constraint Solver]       │  │
│   │         → [Portion-Scaled Meal Plan JSON]            │  │
│   │                         ↓                            │  │
│   │  [Gemini 2.5 Flash] → [Workout Plan JSON]           │  │
│   │         ↓ (on failure)                               │  │
│   │  [LKG Cache] → [Generic Plan Fallback]              │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │          CONVERSATIONAL AI  (/chat)                  │  │
│   │  [User Message + Plan Context] → [Gemini API]       │  │
│   │                → [Coaching Reply]                    │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

The frontend **never** performs any nutritional math — all computation is owned by the backend's deterministic ML pipeline. This ensures the UI always displays verified, arithmetically correct data.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.1.6 | React framework, App Router, SSR |
| **React** | 19.2.3 | UI component library |
| **TypeScript** | 5.x | Type safety across all components |
| **Tailwind CSS** | 4.x | Utility-first styling, glassmorphism |
| **Lucide React** | 0.577.0 | Icon library |
| **jsPDF** | 4.2.1 | PDF generation / export |
| **html2canvas** | 1.4.1 | Canvas rendering for PDF snapshots |
| **Geist Font** | (Next.js built-in) | Typography (Sans + Mono) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Flask** | Latest | REST API web framework |
| **flask-cors** | Latest | Cross-Origin Resource Sharing |
| **python-dotenv** | Latest | Environment variable management |
| **NumPy** | Latest | Numerical array operations |
| **pandas** | Latest | Food database loading & querying |
| **joblib** | Latest | Model scaler serialization (`.pkl`) |

### AI / Machine Learning
| Technology | Purpose |
|---|---|
| **TensorFlow / Keras** | Custom deep learning model (`nutrition_model.keras`) for caloric need prediction |
| **scikit-learn (K-Means)** | Food item clustering into nutritional categories for the meal generator |
| **Custom Constraint Solver** | Portion-scaling algorithm that guarantees exact calorie targets per meal |
| **Google Gemini 2.5 Flash** | LLM for workout plan generation and conversational AI coaching |
| **LKG Cache System** | `last_workout_cache.json` — file-based fault-tolerant fallback for API failures |

### ML Datasets
| Dataset | Description |
|---|---|
| `FOOD-DATA-GROUP1-5.csv` | Raw food nutritional data across 5 food groups |
| `ML_Categorized_Food_Database.csv` | K-Means post-processed database with `Category` labels (High Protein, High Carb, Low-Cal Carb/Veggie) |
| `dataset.csv` | Training dataset used to fit the TensorFlow biometric model |

---

## Prerequisites

Ensure you have the following installed on your machine before proceeding:

| Prerequisite | Recommended Version | Check Command |
|---|---|---|
| **Node.js** | v18.x or later (LTS) | `node --version` |
| **npm** | v9.x or later | `npm --version` |
| **Python** | 3.10 or 3.11 (TensorFlow compatibility) | `python3 --version` |
| **pip** | Latest | `pip --version` |
| **Git** | Any recent version | `git --version` |

> **TensorFlow Note:** TensorFlow 2.x has specific Python version requirements. Python **3.10** or **3.11** is strongly recommended. Python 3.12+ may have compatibility issues.

---

## Environment Variables

The backend requires a single environment variable file to function. Create a file named **`.env`** inside the `backend/` directory:

```
backend/.env
```

Populate it with the following:

| Variable | Description | Where to Get It |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |

**Example `backend/.env`:**
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **Security:** The `backend/.env` file is listed in `.gitignore` and must **never** be committed to version control. The frontend makes no external API calls and requires no environment variables.

---

## Installation & Setup

Follow these steps to run Nutrix locally. You will need **two terminal sessions** running simultaneously — one for the backend, one for the frontend.

### 1. Clone the Repository

```bash
git clone https://github.com/sassni/AI-Nutrition-Planner.git
cd AI-Nutrition-Planner
```

---

### 2. Backend Setup (Flask API)

Open your **first terminal** and run the following:

```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment
python3 -m venv .venv

# Activate the virtual environment
# On macOS / Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install all Python dependencies
pip install -r requirements.txt

# Install the additional packages not yet in requirements.txt
pip install flask python-dotenv google-generativeai pandas
```

> **Note:** Ensure your `backend/.env` file with your `GEMINI_API_KEY` is created before starting the server (see [Environment Variables](#-environment-variables) above).

```bash
# Start the Flask development server
python app.py
```

The Flask API will be available at: **`http://127.0.0.1:5000`**

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

### 3. Frontend Setup (Next.js)

Open your **second terminal** and run the following:

```bash
# Navigate to the frontend directory (from the project root)
cd frontend

# Install all Node.js dependencies
npm install

# Start the Next.js development server
npm run dev
```

The application will be available at: **`http://localhost:3000`**

---

### 4. Verify Both Servers Are Running

| Service | URL | Status Check |
|---|---|---|
| **Frontend** (Next.js) | `http://localhost:3000` | Should render the Nutrix dashboard |
| **Backend** (Flask API) | `http://127.0.0.1:5000` | Should be accepting POST requests |

---

## Usage

Once both servers are running, navigate to **`http://localhost:3000`** in your browser.

### Step-by-Step Guide

1.  **Enter Your Biometrics**
    Fill in the **Biometric Engine** form on the left panel:
    - **Age** — your age in years (e.g., `25`)
    - **Weight (kg)** — your body weight in kilograms (e.g., `75`)
    - **Height (cm)** — your height in centimetres (e.g., `178`)
    - **Activity Tier** — select from the dropdown: Sedentary / Moderate / Active

2.  **Watch the Live BMI**
    As soon as you enter your weight and height, the **Est. BMI** field calculates your Body Mass Index in real-time — no submission required.

3.  **Generate Your Plan**
    Click the **Generate** button. The system will:
    - `POST /predict` to the Flask backend with your biometrics
    - Run your data through the TensorFlow model to predict your daily caloric need
    - Use the K-Means Constraint Solver to build your portion-scaled meal plan
    - Call Gemini 2.5 Flash to generate your personalized 7-day workout split

4.  **Review Your Results**
    The dashboard will expand to show:
    - **Target Calorie Banner** — your precise daily kcal requirement
    - **Meal Plan Cards** — Breakfast / Lunch / Dinner with items, grams, and macros
    - **Macro Distribution Bar** — animated Protein / Carbs / Fat breakdown
    - **Hydration & Recovery Card** — personalized water intake target
    - **Training Split Cards** — 7-day workout routine with exercise lists

5.  **Chat With Your AI Coach**
    Click the **chat icon** in the floating navigation dock to open the AI Coach panel. Ask questions like:
    - *"Can I swap the lunch protein for salmon?"*
    - *"How should I modify my plan if I travel on Wednesday?"*
    - *"Explain why my protein target is this high."*

6.  **Export Your Plan**
    Use the **Plan Actions** card to:
    - **Copy Plan** — copies the full meal plan and training split to your clipboard as formatted text
    - **Save PDF** — triggers a browser print dialog; select "Save as PDF" for a clean export

7.  **Toggle Dark Mode**
    Click the 🌙 / ☀️ icon in the navigation dock to switch between light and dark glassmorphism themes.

---

## Project Structure

```
AI-Nutrition-Planner/
│
├── backend/                        # Python / Flask REST API
│   ├── Nutrix_Datasets/            # Raw & processed food nutritional CSVs
│   │   ├── FOOD-DATA-GROUP1-5.csv  # Raw source data across 5 food groups
│   │   ├── ML_Categorized_Food_Database.csv  # K-Means post-processed DB
│   │   └── dataset.csv             # Biometric training dataset
│   ├── Nutrix_Model/               # Jupyter notebooks for model training
│   │   ├── IPD.ipynb               # TensorFlow model training notebook
│   │   └── Meal Generator.ipynb    # K-Means clustering notebook
│   ├── app.py                      # Flask application (routes: /predict, /chat)
│   ├── meal_generator.py           # K-Means constraint solver & meal planner
│   ├── nutrition_model.keras       # Trained TensorFlow model (gitignored)
│   ├── scaler.pkl                  # Fitted MinMaxScaler for model input
│   ├── food_clustering_model.pkl   # Trained K-Means model
│   ├── food_scaler.pkl             # Scaler for food clustering features
│   ├── last_workout_cache.json     # LKG Cache — last valid Gemini response
│   ├── requirements.txt            # Python dependencies
│   └── .env                        # API keys (gitignored — DO NOT COMMIT)
│
└── frontend/                       # Next.js / React application
    ├── src/
    │   └── app/
    │       ├── page.tsx            # Main dashboard (single-page application)
    │       ├── layout.tsx          # Root layout, metadata, Google Fonts
    │       ├── globals.css         # Global base styles
    │       └── icon.tsx            # App icon component
    ├── package.json                # Node.js dependencies & npm scripts
    ├── next.config.ts              # Next.js configuration
    └── tsconfig.json               # TypeScript configuration
```

---

## License / Academic Disclaimer

This software is developed for **academic and educational purposes only**. It is not intended to be used as a substitute for professional medical or dietary advice. The caloric and nutritional recommendations generated by Nutrix are estimates produced by machine learning models trained on publicly available datasets and should not be followed without consulting a qualified healthcare or nutrition professional.

**Author:** Sasni M.  
**GitHub:** [@sassni](https://github.com/sassni)  
**Repository:** [sassni/AI-Nutrition-Planner](https://github.com/sassni/AI-Nutrition-Planner)

---

<p align="center">
  Built with and a lot of <code>kcal</code> by Sasni M. — Final Year Project, 2026
</p>
