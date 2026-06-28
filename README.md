# ✍️ AI Handwriting Recognition System

A modern, professional-grade AI system that recognizes handwritten digits (0–9) and alphanumeric characters (A–Z, a–z) using Convolutional Neural Networks (CNN). This project features a high-fidelity interactive drawing canvas, real-time deep learning inference, and visual probability breakdowns.

---

## 🏗️ Architecture

This project uses a decoupled, dual-layer architecture:
*   **Backend**: A FastAPI REST server hosting convolutional neural networks built using TensorFlow and Keras.
*   **Frontend**: A modern, responsive React application built with **Vite**, **Tailwind CSS**, and **Recharts**.

---

## 📁 Project Structure

```
handwritten-recognition/
├── backend/
│   ├── api.py              # FastAPI REST server (prediction engine)
│   ├── train.py            # Digit model training pipeline (MNIST)
│   ├── predict.py          # CLI-based inference & visualization tool
│   ├── model.py            # CNN Architecture definitions (MNIST & EMNIST)
│   ├── emnist_labels.py    # 47-class label mapping for alphanumeric characters
│   ├── saved_model/        # Directory containing trained models
│   │   └── digit_model.h5  # Pre-trained MNIST digit model
│   └── requirements.txt    # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── HandwritingCanvas.jsx  # Interactive HTML5 drawing canvas
│   │   ├── App.jsx         # Dashboard UI & state management
│   │   ├── main.jsx        # App entry point
│   │   └── index.css       # Tailwind configuration & global styles
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.js      # Vite settings & API reverse proxy configuration
│   └── tailwind.config.js  # Styling guidelines & color tokens
├── start_servers.sh        # Bash runner script for background execution
└── README.md               # Main project documentation
```

---

## 🚀 Setup & Execution

### 1. Backend Setup

First, navigate to the `backend` directory and set up the Python environment:

1.  **Navigate to backend**:
    ```bash
    cd backend
    ```
2.  **Create a Virtual Environment**:
    ```bash
    python -m venv .venv
    ```
3.  **Activate the Virtual Environment**:
    *   **Windows (PowerShell)**:
        ```powershell
        .venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux**:
        ```bash
        source .venv/bin/activate
        ```
4.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run/Train the Models**:
    *   To train the digit model from scratch:
        ```bash
        python train.py
        ```
    *   To run inference on a local image using the CLI tool:
        ```bash
        python predict.py images/sample_digit.png
        ```
6.  **Start the REST API Server**:
    ```bash
    python api.py
    ```
    The backend will start at `http://localhost:8000`.

### 2. Frontend Setup

Next, set up the web interface:

1.  **Navigate to frontend**:
    ```bash
    cd ../frontend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The application will run locally, usually at `http://localhost:5173`. Vite is preconfigured to proxy `/api` calls to `http://localhost:8000`.

---

## 🌟 Key Features

*   **Interactive Canvas**: High-fidelity drawing brush with custom stroke width and automated canvas reset controls.
*   **Instant Predictive Analysis**: Decodes uploaded images or drawn canvas paths and routes them through the CNN.
*   **Top-3 Probability Breakdown**: An animated horizontal bar chart visualizing the top 3 prediction candidates along with their confidence scores.
*   **Bimodal Classification**:
    *   **Digits Mode**: Utilizes a 10-class CNN trained on the MNIST dataset.
    *   **Alphanumeric Mode**: Preconfigured for a 47-class CNN based on the EMNIST Balanced dataset.

---

## 👤 Credits

Built by **Anshi Mishra**.
Core Stack: Python (FastAPI, TensorFlow, Keras) + React (Vite, Tailwind, Recharts).
Targeting: Technical Portfolio for AI/ML and Full-Stack roles.
