"""
backend/predict.py — CLI Prediction Tool
-----------------------------------------
Run from project root:
  python backend/predict.py <image>           # digit model
  python backend/predict.py <image> --char    # character model

Example:
  python backend/predict.py images/my_5.png
  python backend/predict.py images/my_A.png --char
"""

import sys
import os
import argparse
import numpy as np
import tensorflow as tf
import cv2
import matplotlib.pyplot as plt

# Resolve project root and add backend to path
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'backend'))

from emnist_labels import EMNIST_LABELS

DIGIT_LABELS = [str(i) for i in range(10)]


def index_to_char(idx: int, is_character: bool = False) -> str:
    if is_character:
        return EMNIST_LABELS[idx] if idx < len(EMNIST_LABELS) else str(idx)
    return str(idx)


# ─────────────────────────────────────────────────────────
# Image Preprocessing
# ─────────────────────────────────────────────────────────
def preprocess_image(filepath: str, is_character: bool) -> np.ndarray:
    img = cv2.imread(filepath, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {filepath}")

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


# ─────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Handwritten Character Predictor")
    parser.add_argument("image", help="Path to image file (PNG/JPG)")
    parser.add_argument("--char", action="store_true",
                        help="Use EMNIST character model instead of MNIST digit model")
    args = parser.parse_args()

    # Resolve image path relative to project root or backend folder
    image_path = args.image if os.path.isabs(args.image) else os.path.join(ROOT, args.image)
    if not os.path.exists(image_path):
        image_path = os.path.join(ROOT, 'backend', args.image)

    if not os.path.exists(image_path):
        print(f"❌ Image not found: {args.image}")
        sys.exit(1)

    # Load model
    if args.char:
        model_path = os.path.join(ROOT, 'backend', 'saved_model', 'character_model.h5')
        labels = EMNIST_LABELS
        print("📦 Loading EMNIST character model...")
    else:
        model_path = os.path.join(ROOT, 'backend', 'saved_model', 'digit_model.keras')
        labels = DIGIT_LABELS
        print("📦 Loading MNIST digit model...")

    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        print("   Run: python backend/train.py")
        sys.exit(1)

    model = tf.keras.models.load_model(model_path)
    print(f"✅ Model loaded\n")

    # Preprocess & predict
    print(f"🖼️  Processing: {image_path}")
    img_array  = preprocess_image(image_path, is_character=args.char)
    preds      = model.predict(img_array, verbose=0)
    class_idx  = int(np.argmax(preds))
    confidence = float(preds[0][class_idx] * 100)
    predicted  = index_to_char(class_idx, is_character=args.char)

    print("=" * 40)
    print(f"  Predicted : '{predicted}'")
    print(f"  Confidence: {confidence:.2f}%")
    print("=" * 40)

    # Top-3
    top3_idx = np.argsort(preds[0])[::-1][:3]
    print("\n📊 Top-3 predictions:")
    for rank, idx in enumerate(top3_idx, 1):
        char  = index_to_char(int(idx), is_character=args.char)
        score = preds[0][idx] * 100
        bar   = "█" * int(score / 5)
        print(f"  #{rank}  '{char}'  {score:5.1f}%  {bar}")

    # Show image
    display_img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    plt.figure(figsize=(4, 4))
    plt.imshow(display_img, cmap='gray')
    plt.title(f"Predicted: '{predicted}'  ({confidence:.1f}%)",
              fontsize=14, fontweight='bold', color='green')
    plt.axis('off')
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()
