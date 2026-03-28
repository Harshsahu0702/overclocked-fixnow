# 🐍 FixNow AI - Intelligent Service Detection

A high-performance Python-based microservice that powers the core "Understanding" logic of FixNow. It translates messy user requests (English, Hindi, Hinglish) into structured service categories.

---

## 🛠️ Hybrid AI Stack

- **Framework**: FastAPI (High-performance ASGI framework)
- **Model Logic**: Hybrid approach combining:
  - **Semantic Similarity**: Using HuggingFace's zero-shot classification (Zero-Shot-Classification-Mobile) via a custom pipeline.
  - **Fuzzy Keyword Matching**: Optimized for common Indian service terms (e.g., "Mistry," "Bhaiya," "Mechanic").
- **Language Support**: Optimized for English, Hindi, and Hinglish.

---

## 📂 Project Structure

```text
fixnow-ai/
├── app.py              # FastAPI entry point & API definitions
├── model.py            # The "Brain" - Hybrid classification & mapping
├── requirements.txt    # Python dependencies
└── __pycache__/        # Compiled bytecode
```

---

## 🧠 Brain Logic: `classify_service`

The core function in `model.py` follows a three-stage pipeline:
1.  **Normalization**: Cleans input text (lowercase, removing noise).
2.  **Keyword Fast-Pass**: Instantly detects 20+ common services based on pre-defined high-confidence keywords.
3.  **Semantic Deep-Scan**: If keywords fail, it uses a transformer model to find the closest semantic category from our service taxonomy.
4.  **Pricing Injection**: Returns a dynamic `estimatedPrice` based on the difficulty of the detected service.

---

## 📡 API Reference

### POST `/detect-service`
The primary endpoint used by the Node.js backend to interpret user intent.

**Request:**
```json
{
  "text": "Mera AC repair kar do"
}
```

**Response:**
```json
[
  {
    "service": "AC Repair",
    "confidence": 98,
    "price": 500
  }
]
```

---

## 🚀 Setup Instructions

1.  Ensure Python 3.9+ is installed.
2.  `cd fixnow-ai`
3.  `pip install -r requirements.txt`
4.  `python app.py` (Runs on `http://localhost:8000`)

---

Built with ⚡ and 🐍 for the FixNow ecosystem.
