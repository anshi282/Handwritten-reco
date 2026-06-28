from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
import cv2
import os
import sys
import io
import base64
import fitz  # PyMuPDF
from PIL import Image
import threading

# Resolve root and add backend to path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'backend'))

from emnist_labels import EMNIST_LABELS

app = FastAPI(title="Handwritten Recognition API")

# ─────────────────────────────────────────────────────────────────────────────
# Security: Restrict CORS to known frontend origin only.
# In production, replace with your deployed frontend URL.
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Security: File size and type constraints
# ─────────────────────────────────────────────────────────────────────────────
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB for images
MAX_PDF_SIZE_BYTES   = 100 * 1024 * 1024  # 100 MB for PDFs
ALLOWED_IMAGE_TYPES  = {"image/png", "image/jpeg", "image/jpg", "image/webp"}

# Load Models at startup
MODELS = {
    "digit": None,
    "character": None
}

# digit_model.keras is the format saved by train.py (Keras 3.x native format).
# The legacy digit_model.h5 was built with Keras 2.x and cannot be loaded by Keras 3.x.
DIGIT_MODEL_PATH = os.path.join(ROOT, 'backend', 'saved_model', 'digit_model.keras')
CHAR_MODEL_PATH  = os.path.join(ROOT, 'backend', 'saved_model', 'character_model.keras')


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


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def validate_image_upload(file: UploadFile, contents: bytes):
    """Validate image file size and MIME type."""
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max allowed: {MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB."
        )
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}."
        )


def preprocess_image_bytes(image_bytes: bytes, is_character: bool) -> np.ndarray:
    """Decode raw image bytes, resize, normalize, and shape for model input."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Invalid image — could not decode.")

    # Invert if background is light (MNIST expects white strokes on black)
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


def run_prediction(image_bytes: bytes, mode: str) -> dict:
    """Run digit or character prediction on raw image bytes."""
    is_char = (mode == "character")
    model   = MODELS["character"] if is_char else MODELS["digit"]

    if model is None:
        raise HTTPException(
            status_code=503,
            detail=f"{'Character' if is_char else 'Digit'} model not loaded."
        )

    img_array  = preprocess_image_bytes(image_bytes, is_character=is_char)
    preds      = model.predict(img_array, verbose=0)
    class_idx  = int(np.argmax(preds))
    confidence = float(preds[0][class_idx] * 100)
    top3_idx   = np.argsort(preds[0])[::-1][:3]

    if is_char:
        label = EMNIST_LABELS[class_idx]
        top3  = [{"label": EMNIST_LABELS[idx], "confidence": float(preds[0][idx] * 100)} for idx in top3_idx]
    else:
        label = str(class_idx)
        top3  = [{"label": str(idx), "confidence": float(preds[0][idx] * 100)} for idx in top3_idx]

    return {"prediction": label, "confidence": confidence, "top3": top3}


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# FIX: Changed `async def` → `def` so FastAPI runs them in a thread pool,
# preventing TensorFlow CPU inference from blocking the asyncio event loop.
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/predict/digit")
def predict_digit(file: UploadFile = File(...)):
    contents = file.file.read()
    validate_image_upload(file, contents)
    try:
        return run_prediction(contents, mode="digit")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict/character")
def predict_character(file: UploadFile = File(...)):
    contents = file.file.read()
    validate_image_upload(file, contents)
    try:
        return run_prediction(contents, mode="character")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict/pdf")
def predict_pdf(
    file: UploadFile = File(...),
    mode: str = Query(default="digit", enum=["digit", "character"])
):
    """
    Accept a PDF, render each page to an image at 150 DPI, run prediction
    on every page, and return results with a base64-encoded page preview.
    """
    contents = file.file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")

    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"PDF too large. Max allowed: {MAX_PDF_SIZE_BYTES // (1024*1024)} MB."
        )

    # Validate it's actually a PDF by checking magic bytes (%PDF header)
    if not contents.startswith(b'%PDF'):
        raise HTTPException(status_code=400, detail="File does not appear to be a valid PDF (missing %PDF header).")

    try:
        pdf = fitz.open(stream=contents, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not open PDF: {e}")

    model_loaded = MODELS["character"] if mode == "character" else MODELS["digit"]
    if model_loaded is None:
        raise HTTPException(
            status_code=503,
            detail=f"{'Character' if mode == 'character' else 'Digit'} model not loaded."
        )

    results = []
    for page_num in range(len(pdf)):
        page = pdf[page_num]

        # Render page at 150 DPI for a clear preview
        mat          = fitz.Matrix(150 / 72, 150 / 72)
        pix          = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        page_png_bytes = pix.tobytes("png")

        try:
            pred = run_prediction(page_png_bytes, mode=mode)
        except Exception as e:
            pred = {"prediction": "?", "confidence": 0.0, "top3": [], "error": str(e)}

        results.append({
            "page":       page_num + 1,
            "prediction": pred.get("prediction", "?"),
            "confidence": pred.get("confidence", 0.0),
            "top3":       pred.get("top3", []),
            "preview":    base64.b64encode(page_png_bytes).decode("utf-8"),
        })

    pdf.close()
    return {
        "total_pages": len(results),
        "mode":        mode,
        "results":     results,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": {
            "digit":     MODELS["digit"] is not None,
            "character": MODELS["character"] is not None,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# EasyOCR — lazy singleton so it doesn't slow down startup.
# The reader is created once on first use and reused for all subsequent calls.
# ─────────────────────────────────────────────────────────────────────────────
_ocr_reader = None
_ocr_lock   = threading.Lock()

def get_ocr_reader():
    """Return a cached EasyOCR reader, creating it on first call."""
    global _ocr_reader
    if _ocr_reader is None:
        with _ocr_lock:
            if _ocr_reader is None:  # double-checked locking
                try:
                    import easyocr
                    # gpu=False — works on any machine without CUDA
                    _ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                    print("[OCR] EasyOCR reader initialised (English, CPU).")
                except ImportError:
                    raise HTTPException(
                        status_code=500,
                        detail="EasyOCR is not installed. Run: pip install easyocr"
                    )
    return _ocr_reader


@app.post("/extract/pdf")
def extract_pdf_text(file: UploadFile = File(...)):
    """
    Upload a PDF containing handwritten (or printed) text.
    Each page is rendered at 200 DPI and processed with EasyOCR.
    Returns per-page extracted lines + a full combined transcript.
    """
    contents = file.file.read()

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")

    if len(contents) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"PDF too large. Max allowed: {MAX_PDF_SIZE_BYTES // (1024*1024)} MB."
        )

    if not contents.startswith(b'%PDF'):
        raise HTTPException(
            status_code=400,
            detail="File does not appear to be a valid PDF."
        )

    try:
        pdf = fitz.open(stream=contents, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not open PDF: {e}")

    reader = get_ocr_reader()  # initialises EasyOCR (may take ~10s on first call)

    pages = []
    full_text_parts = []

    for page_num in range(len(pdf)):
        page = pdf[page_num]

        # Render at 200 DPI — higher resolution gives better OCR accuracy
        mat = fitz.Matrix(200 / 72, 200 / 72)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        img_bytes = pix.tobytes("png")

        # Convert to numpy array for EasyOCR
        nparr  = np.frombuffer(img_bytes, np.uint8)
        img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run OCR — paragraph=True groups nearby words into lines
        try:
            ocr_results = reader.readtext(img_np, detail=1, paragraph=False)
        except Exception as e:
            ocr_results = []

        # Sort results top-to-bottom by bounding box y-coordinate
        ocr_results.sort(key=lambda r: r[0][0][1])  # r[0] = bbox, [0][1] = top-y

        lines = []
        for (bbox, text, confidence) in ocr_results:
            text = text.strip()
            if text:
                lines.append({
                    "text":       text,
                    "confidence": round(confidence * 100, 1),
                })

        page_text = "\n".join(item["text"] for item in lines)
        preview   = base64.b64encode(img_bytes).decode("utf-8")

        pages.append({
            "page":      page_num + 1,
            "lines":     lines,
            "text":      page_text,
            "preview":   preview,
        })

        full_text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")

    pdf.close()

    return {
        "total_pages": len(pages),
        "full_text":   "\n\n".join(full_text_parts),
        "pages":       pages,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
