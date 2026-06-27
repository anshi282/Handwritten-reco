from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
import cv2
import os
import sys
import io
from PIL import Image

# Resolve root and add backend to path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'backend'))

from emnist_labels import EMNIST_LABELS

app = FastAPI(title="Handwritten Recognition API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models at startup
MODELS = {
    "digit": None,
    "character": None
}

DIGIT_MODEL_PATH = os.path.join(ROOT, 'backend', 'saved_model', 'digit_model.keras')
CHAR_MODEL_PATH = os.path.join(ROOT, 'backend', 'saved_model', 'character_model.h5')

@app.on_event("startup")
def load_models():
    if os.path.exists(DIGIT_MODEL_PATH):
        MODELS["digit"] = tf.keras.models.load_model(DIGIT_MODEL_PATH)
        print(f"✅ Digit model loaded from {DIGIT_MODEL_PATH}")
    else:
        print(f"⚠️ Digit model not found at {DIGIT_MODEL_PATH}")

    if os.path.exists(CHAR_MODEL_PATH):
        MODELS["character"] = tf.keras.models.load_model(CHAR_MODEL_PATH)
        print(f"✅ Character model loaded from {CHAR_MODEL_PATH}")
    else:
        print(f"⚠️ Character model not found at {CHAR_MODEL_PATH}")

def preprocess_image_bytes(image_bytes: bytes, is_character: bool) -> np.ndarray:
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    
    if img is None:
        raise ValueError("Invalid image format")

    # Invert if background is light
    if np.mean(img) > 127:
        img = cv2.bitwise_not(img)

    img = cv2.resize(img, (28, 28), interpolation=cv2.INTER_AREA)
    img = img.astype("float32") / 255.0

    if is_character:
        img = np.transpose(img)
        img = img[:, ::-1]
        return img.reshape(1, 28, 28)
    else:
        return img.reshape(1, 28, 28, 1)

@app.post("/predict/digit")
async def predict_digit(file: UploadFile = File(...)):
    if MODELS["digit"] is None:
        raise HTTPException(status_code=503, detail="Digit model not loaded")
    
    contents = await file.read()
    try:
        img_array = preprocess_image_bytes(contents, is_character=False)
        preds = MODELS["digit"].predict(img_array, verbose=0)
        class_idx = int(np.argmax(preds))
        confidence = float(preds[0][class_idx] * 100)
        
        top3_idx = np.argsort(preds[0])[::-1][:3]
        top3 = [
            {"label": str(idx), "confidence": float(preds[0][idx] * 100)}
            for idx in top3_idx
        ]
        
        return {
            "prediction": str(class_idx),
            "confidence": confidence,
            "top3": top3
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/predict/character")
async def predict_character(file: UploadFile = File(...)):
    if MODELS["character"] is None:
        raise HTTPException(status_code=503, detail="Character model not loaded")
    
    contents = await file.read()
    try:
        img_array = preprocess_image_bytes(contents, is_character=True)
        preds = MODELS["character"].predict(img_array, verbose=0)
        class_idx = int(np.argmax(preds))
        confidence = float(preds[0][class_idx] * 100)
        
        top3_idx = np.argsort(preds[0])[::-1][:3]
        top3 = [
            {"label": EMNIST_LABELS[idx], "confidence": float(preds[0][idx] * 100)}
            for idx in top3_idx
        ]
        
        return {
            "prediction": EMNIST_LABELS[class_idx],
            "confidence": confidence,
            "top3": top3
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": {
            "digit": MODELS["digit"] is not None,
            "character": MODELS["character"] is not None
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
