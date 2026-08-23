from flask import Flask, request, jsonify
from PIL import Image
from flask_cors import CORS
from google import genai
from google.genai import types
from groq import Groq
import pytesseract
import os
import json
import io
import hashlib

app = Flask(__name__)
CORS(app)

# --- Setup ---
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

cache = {}  # same image dobara scan ho to quota bachao


# ============================================================
# PROMPTS
# ============================================================

SYSTEM_INSTRUCTION = """You are an expert nutritionist for a common Indian buyer.
Write in everyday words and simple english, short sentences, and relatable comparisons
(e.g. itni sugar ek chai ke chammach jitni hai in english).
Avoid textbook language. Return ONLY valid JSON matching the exact requested schema.

STRICT SCORING RULES:
- Start at 100. Deduct points via score_breakdown (negative numbers only):
- Sugar >15g: -25; 5-15g: -15.
- Sodium >400mg: -25; 200-400mg: -15.
- Refined Flour/Palm Oil/Sat Fat: -15 each.
- Additives (INS, MSG, etc): -10 each (max -30).
- Clean products: [{"factor": "No Concerns", "points": 0, "reason": "Clean ingredients"}]
"""

JSON_SCHEMA = """Return JSON matching this exact structure:
{
  "product": {"name": "string", "variant": "string", "brand": "string", "category": "Chips / Soda / Noodles / Biscuit / Chocolate / Healthy Snack / Dairy / Unknown"},
  "nutrition": {"calories": number, "protein": number, "sugar": number, "fat": number, "fiber": number, "sodium": number},
  "health_score": number,
  "score_breakdown": [{"factor": "string", "points": number, "reason": "string"}],
  "recommendation": {"label": "Should Buy|Moderate|Avoid", "description": "string"},
  "health_indicators": [{"name": "string", "status": "green|yellow|red", "note": "string"}],
  "ingredients": [{"name": "string", "purpose": "string", "description": "string", "status": "Safe|Moderate|Risky"}],
  "claims_check": [{"claim": "string", "verdict": "Supported|Partially Supported|Not Supported", "reason": "string"}],
  "value_assessment": {"verdict": "Good Value|Fair|Overpriced|Cannot determine (no price on label)", "reason": "string"},
  "better_alternatives": ["string", "string"],
  "ai_summary": "string",
  "suitable_for": {"gym": true, "weight_loss": true, "heart": true, "diabetic": false}
}"""


# ============================================================
# AI CALLS
# ============================================================

def analyze_with_gemini(pil_image):
    """Pehli koshish — Gemini seedha image dekh kar analyze karta hai."""
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[pil_image, "Analyze this product label image directly. " + JSON_SCHEMA],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0,
            response_mime_type="application/json"
        )
    )
    return response.text.strip()


def analyze_with_groq(pil_image):
    """Backup — Gemini fail ho to Tesseract se text nikal ke Groq ko bhejo
    (Groq ka free tier vision support reliable nahi hai, isliye text route safe hai)."""
    ocr_text = pytesseract.image_to_string(pil_image)
    print("GROQ FALLBACK — OCR TEXT:", ocr_text)

    full_prompt = f"{SYSTEM_INSTRUCTION}\n\nProduct label OCR text:\n{ocr_text}\n\n{JSON_SCHEMA}"

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": full_prompt}],
        temperature=0
    )
    return response.choices[0].message.content.strip()


# ============================================================
# ROUTE
# ============================================================
@app.route("/")
def home():
    return "LabelLense backend is awake!"

@app.route("/analyze", methods=["POST"])
def analyze():
    # 1. Image memory me padho (disk pe save nahi karna, fast hai)
    image_bytes = request.files["image"].read()
    pil_image = Image.open(io.BytesIO(image_bytes))
    pil_image.thumbnail((400, 400))  # chhota karo, AI ko fast process karne ke liye

    # 2. Cache check — same image dobara aaye to seedha purana result do
    image_hash = hashlib.md5(image_bytes).hexdigest()
    if image_hash in cache:
        print("CACHE HIT — quota bachi!")
        return jsonify(cache[image_hash])

    # 3. Gemini try karo, fail ho to Groq pe switch
    try:
        ai_text = analyze_with_gemini(pil_image)
    except Exception as gemini_error:
        print("Gemini failed, switching to Groq backup:", gemini_error)
        try:
            ai_text = analyze_with_groq(pil_image)
        except Exception as groq_error:
            print("Groq also failed:", groq_error)
            return jsonify({"error": "Both AI services are unavailable right now."}), 500

    # 4. JSON parse karo
    ai_text = ai_text.replace("```json", "").replace("```", "")
    try:
        report = json.loads(ai_text)
    except Exception as json_err:
        print("JSON parsing error:", json_err)
        return jsonify({"error": "Failed to parse AI output."}), 500

    # 5. Result cache karo aur return karo
    result = {"ocr_text": "Processed via AI", "report": report}
    cache[image_hash] = result
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)