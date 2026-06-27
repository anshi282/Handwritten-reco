"""
backend/emnist_labels.py — 47-class label mapping for EMNIST Balanced dataset
Class index → character (digit, uppercase letter, or merged lowercase)

EMNIST Balanced merges visually similar lowercase letters with their
uppercase counterparts, resulting in 47 unique classes.
"""

# 47 EMNIST Balanced class labels in order
EMNIST_LABELS = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',  # 0–9  → digits
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',  # 10–19
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',  # 20–29
    'U', 'V', 'W', 'X', 'Y', 'Z',                        # 30–35 → uppercase A-Z
    'a', 'b', 'd', 'e', 'f', 'g', 'h', 'n', 'q', 'r', 't'  # 36–46 → distinct lowercase
]

NUM_CLASSES = len(EMNIST_LABELS)  # 47


def index_to_char(index: int) -> str:
    """Convert model output index to readable character."""
    return EMNIST_LABELS[index]


def char_to_index(char: str) -> int:
    """Convert character to class index."""
    return EMNIST_LABELS.index(char)


if __name__ == '__main__':
    print(f"Total EMNIST classes: {NUM_CLASSES}\n")
    for i, label in enumerate(EMNIST_LABELS):
        print(f"  [{i:2d}] → '{label}'")
