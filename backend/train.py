"""
backend/train.py — Phase 1: Train CNN on MNIST Digits (0–9)
------------------------------------------------------------
Run from project root:
  python backend/train.py

Output:
  saved_model/digit_model.keras   — trained model
  training_plot.png               — accuracy & loss curves
"""

import os
import sys
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

# Resolve project root (one level up from this file)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'backend'))

from model import build_digit_model

SAVE_DIR  = os.path.join(ROOT, 'backend', 'saved_model')
PLOT_PATH = os.path.join(ROOT, 'backend', 'training_plot.png')

# ─────────────────────────────────────────────────────────
# 1. Load MNIST Dataset
# ─────────────────────────────────────────────────────────
print("[INFO] Loading MNIST dataset...")
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

print(f"   Training samples : {len(x_train)}")
print(f"   Testing  samples : {len(x_test)}")

# ─────────────────────────────────────────────────────────
# 2. Preprocess
# ─────────────────────────────────────────────────────────
x_train = x_train.astype("float32") / 255.0
x_test  = x_test.astype("float32")  / 255.0

# CNN expects (batch, height, width, channels)
x_train = x_train.reshape(-1, 28, 28, 1)
x_test  = x_test.reshape(-1, 28, 28, 1)

print("[OK] Preprocessing complete: normalized + reshaped to (28, 28, 1)")

# ─────────────────────────────────────────────────────────
# 3. Build & Train
# ─────────────────────────────────────────────────────────
print("\n[INFO] Building CNN model...")
model = build_digit_model()
model.summary()

print("\n[INFO] Training model (5 epochs)...")
history = model.fit(
    x_train, y_train,
    epochs=5,
    batch_size=64,
    validation_split=0.1,
    verbose=1
)

# ─────────────────────────────────────────────────────────
# 4. Evaluate
# ─────────────────────────────────────────────────────────
print("\n[INFO] Evaluating on test set...")
test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
print(f"\n{'='*40}")
print(f"  Test Accuracy : {test_acc * 100:.2f}%")
print(f"  Test Loss     : {test_loss:.4f}")
print(f"{'='*40}")

# ─────────────────────────────────────────────────────────
# 5. Plot & Save
# ─────────────────────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

ax1.plot(history.history['accuracy'],     label='Train', color='royalblue')
ax1.plot(history.history['val_accuracy'], label='Val',   color='orange')
ax1.set_title('Model Accuracy')
ax1.set_xlabel('Epoch'); ax1.set_ylabel('Accuracy')
ax1.legend(); ax1.grid(True, alpha=0.3)

ax2.plot(history.history['loss'],     label='Train', color='royalblue')
ax2.plot(history.history['val_loss'], label='Val',   color='orange')
ax2.set_title('Model Loss')
ax2.set_xlabel('Epoch'); ax2.set_ylabel('Loss')
ax2.legend(); ax2.grid(True, alpha=0.3)

plt.suptitle('CNN Training on MNIST', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(PLOT_PATH, dpi=150, bbox_inches='tight')
print(f"\n[INFO] Training plot saved -> {PLOT_PATH}")

os.makedirs(SAVE_DIR, exist_ok=True)
save_path = os.path.join(SAVE_DIR, 'digit_model.keras')
model.save(save_path)
print(f"[OK] Model saved -> {save_path}")
print("\n[DONE] Training complete! Run: python backend/api.py")
