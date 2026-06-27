"""
backend/model.py — Reusable CNN Architecture Definitions
---------------------------------------------------------
Provides build functions for:
  - build_digit_model()      : Phase 1 — MNIST (10 classes, digits 0–9)
  - build_character_model()  : Phase 3 — EMNIST Balanced (47 classes)
"""

import tensorflow as tf


def build_digit_model(num_classes: int = 10) -> tf.keras.Model:
    """
    Lightweight CNN for MNIST digit recognition.
    Input : (28, 28, 1) — grayscale
    Output: softmax over num_classes
    """
    model = tf.keras.Sequential([
        tf.keras.Input(shape=(28, 28, 1)),

        # Conv Block 1
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D((2, 2)),

        # Conv Block 2
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D((2, 2)),

        # Dense Head
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation='softmax'),
    ], name="digit_cnn")

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def build_character_model(num_classes: int = 47) -> tf.keras.Model:
    """
    Deeper CNN for EMNIST character recognition (digits + letters).
    Input : (28, 28) — channel added via Reshape layer
    Output: softmax over num_classes (default 47)
    """
    model = tf.keras.Sequential([
        tf.keras.Input(shape=(28, 28)),

        # Channel dimension for EMNIST
        tf.keras.layers.Reshape((28, 28, 1)),

        # Conv Block 1
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D((2, 2)),

        # Conv Block 2
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        tf.keras.layers.MaxPooling2D((2, 2)),

        # Conv Block 3 — extra depth for harder task
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu', padding='same'),

        # Dense Head
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(num_classes, activation='softmax'),
    ], name="character_cnn")

    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


if __name__ == "__main__":
    print("── Digit Model (MNIST) ─────────────────────────────")
    build_digit_model().summary()
    print("\n── Character Model (EMNIST Balanced) ──────────────")
    build_character_model().summary()
