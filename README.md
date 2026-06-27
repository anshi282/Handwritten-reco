# ✍️ AI Handwriting Recognition System

A modern, professional-grade AI system that recognizes handwritten digits (0–9) and alphanumeric characters (A–Z, a–z) using Convolutional Neural Networks (CNN).

## 🏗️ Architecture

This project uses a modern dual-layer architecture:
- **Backend**: FastAPI REST server + CNN models logic (TensorFlow/Keras).
- **Frontend**: Modern React application built with **Vite**, **Tailwind CSS**, and **Recharts**.

---

## 📁 Project Structure

```
handwritten-recognition/
├── backend/
│   ├── api.py              # FastAPI REST server (prediction engine)
│   ├── train.py            # Model training pipeline (MNIST/EMNIST)
│   ├── predict.py          # CLI-based inference tool
│   ├── model.py            # CNN Architecture definitions
│   ├── emnist_labels.py    # Map for alphanumeric characters
│   ├── dataset/            # Training data storage
│   ├── images/             # Sample images for testing
│   ├── models/             # Experimental model files
│   ├── saved_model/        # Final trained .keras and .h5 files
│   └── requirements.txt    # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── HandwritingCanvas.jsx  # Interactive drawing tool
│   │   └── App.jsx         # Main React application & UI
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.js      # Vite settings & API proxy
│   └── tailwind.config.js  # Design system configuration
├── README.md               # Main project documentation
└── .venv/                  # Python virtual environment
```

---

## 🚀 Setup & Execution

### 1. Backend Setup

1. **Navigate to backend**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Start the API server**:
   ```bash
   python api.py
   ```
   *Note: If models are not yet trained, run `python train.py` first.*

### 2. Frontend Setup

1. **Navigate and Install**:
   ```bash
   cd frontend
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```

### 3. Alternative: CLI Prediction
You can also run predictions directly from the command line:
```bash
# Predict a digit
python backend/predict.py backend/images/my_digit.png

# Predict an alphanumeric character (needs EMNIST model)
python backend/predict.py backend/images/my_char.png --char
```

---

## 🌟 Key Features

- **Interactive Canvas**: High-fidelity drawing brush for digits and letters.
- **Instant Analysis**: Neural network processes strokes or uploads in real-time.
- **Top-3 Prediction**: View the model's confidence across the top-3 candidates with animated charts.
- **Full-Stack Logic**: Industry-standard separation between AI inference and UI.

---

## 👤 Credits

Built by Anshi Mishra. 
Core Stack: Python (TensorFlow, FastAPI) + React (Vite, Tailwind).
Targeting: Technical Portfolio for AI/ML roles.
