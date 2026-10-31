# MATCHDAY IQ - Watch. Understand. Make the Call.

**MATCHDAY IQ** is an AI-powered cricket intelligence companion that helps fans understand live-match situations, discover why crucial moments matter, explore tactical decisions, and interpret ML win-probability predictions with transparent SHAP explanations.

---

## 1. System Architecture

```
[ Cricket Data API ] (CricAPI / CricketData.org / Demo)
         │
         ▼
[ FastAPI Backend ] (Python 3.10+)
  ├── ml/features.py        -> Cricket Feature Engineering & Normalization
  ├── ml/model.py           -> Scikit-Learn Calibrated Logistic Regression + SHAP Explainer
  └── Groq LLM Orchestrator -> Structured, Grounded Fan Explanations (Llama 3.3 70B)
         │  REST API (Port 3001)
         ▼
[ Neo-Brutalist Frontend ] (React 19 + Vite)
  ├──  Live Match Centre  -> Scores, required rate equation, full scorecard
  ├──  Matchmate           -> "Catch Me Up" context-aware instant recap
  ├── Overthink          -> "Decode the Match" Q&A with data grounding
  ├── 12th Player        -> "Captain's Challenge" tactical scenario trade-offs
  └── AI Match Report    -> Executive match dossier & Turning points
```

---

## 2. Machine Learning & SHAP Explainability (Python)

All ML processing runs in Python:
- **Prediction Target:** T20 second-innings chase win probability for the batting team.
- **Model:** Scikit-Learn `LogisticRegression` calibrated on historical T20 distributions.
- **Engineered Features:**
  1. `RRR to CRR Ratio` (Required Run Rate vs Current Run Rate ratio)
  2. `Wickets in Hand` (Remaining wickets, 1–10)
  3. `Balls Remaining` (Overs/balls remaining in innings)
  4. `Runs Needed` (Target minus current runs)
  5. `Batting Resource Factor` (Duckworth-Lewis inspired wicket & ball decay metric)
- **Evaluation Metrics (Holdout Test Set):**
  - **Accuracy:** `84.3%` (`0.843`)
  - **Brier Score:** `0.114`
  - **Log Loss:** `0.362`
  - **Test Samples:** 800 match states
- **SHAP Integration:**
  - Employs `shap.LinearExplainer` directly on the fitted scikit-learn model.
  - Computes exact local feature attributions for any live situation.
  - Visualized on the frontend with bidirectional impact bars showing feature pushes away from the baseline.

---

## 3. Quickstart & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Install Dependencies
```bash
# Python dependencies (FastAPI, Scikit-learn, SHAP, Groq, Pandas, Uvicorn)
pip install -r requirements.txt

# Frontend dependencies
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# CricAPI / CricketData.org API Key (Optional: fallback demo data is active)
VITE_CRICAPI_KEY=your_cricapi_key_here

# Groq API Key for Llama 3.3 70B LLM (Optional: fallback explanations active)
VITE_GROQ_API_KEY=your_groq_api_key_here

# Server Port
PORT=3001
```

### 3. Run the Application

**Run Python Backend (FastAPI):**
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 3001 --reload
```

**Run Frontend (Vite):**
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 4. Key Capabilities

1. **Live Match Centre**: Live scores, overs, required run rate, chase difficulty index, full scorecard, and model win probability.
2. **Matchmate ("Catch Me Up")**: Grounded 3-paragraph executive summary of match progress and momentum swings for fans joining mid-game.
3. **Overthink ("Decode the Match")**: Answers fan questions regarding wickets, required rates, and momentum changes using verified data.
4. **12th Player ("Captain's Challenge")**: Explores strategic decisions (yorkers vs slower balls, field setups, bowling rotations) as qualitative scenario analyses.
5. **AI Match Report**: Compiles a comprehensive match report synthesizing facts, model state, SHAP drivers, and limitations.

---

## 5. Limitations & Ethical Guardrails
- **Demo Mode**: If API keys are missing or provider quota is exceeded, the system automatically falls back to sample match states clearly labelled as Demo.
- **Scenario Analysis**: Tactical "what if" simulations are explicitly labelled as qualitative analysis, not deterministic guarantees.
- **No Hallucinated Scores**: LLM prompts strictly receive structured factual context, preventing invented scores or players.
