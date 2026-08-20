from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
from flask_cors import CORS
from google import genai
import os, json

app = Flask(__name__)
CORS(app)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

@app.route("/analyze", methods=["POST"])
def analyze():
    image = request.files["image"]
    filepath = "uploads/" + image.filename
    image.save(filepath)

    text = pytesseract.image_to_string(Image.open(filepath))
    print("OCR TEXT:", text)
    
    prompt = f"""Write for a common Indian buyer — someone with no nutrition background. Use everyday words, short sentences, and relatable comparisons (e.g. "itni sugar ek chai ke chammach jitni hai"). Avoid textbook language.

Product Label Text:
{text}

Return ONLY valid JSON:
{{
  "product": {{"name": "most prominent product/brand text, else 'Product Label'", "variant": "string or empty", "brand": "string or 'Not specified'", "category": "Identify if it is: Chips / Soda / Noodles / Biscuit / Chocolate / Healthy Snack / Dairy / Unknown"}},
  "nutrition": {{"calories": number, "protein": number, "sugar": number, "fat": number, "fiber": number, "sodium": number}},
  "health_score": number (0-100),
  "score_breakdown": [{{"factor": "string", "points": number (ALWAYS negative e.g. -15, -25), "reason": "specific reason with the exact number from the label"}}],
  "recommendation": {{"label": "Should Buy|Moderate|Avoid", "description": "one sentence, simple language"}},
  "health_indicators": [{{"name": "string", "status": "green|yellow|red", "note": "Good|Moderate|High"}}],
  "ingredients": [{{"name": "string", "purpose": "why it's added, simple words", "description": "clear benefit OR harm explained simply", "status": "Safe|Moderate|Risky"}}],
  "claims_check": [{{"claim": "exact marketing claim text found on label", "verdict": "Supported|Partially Supported|Not Supported", "reason": "explain using actual numbers"}}],
  "value_assessment": {{"verdict": "Good Value|Fair|Overpriced|Cannot determine (no price on label)", "reason": "simple explanation comparing nutrition given vs typical products"}},
  "better_alternatives": ["general suggestion 1 e.g. 'Look for products with under 5g sugar'", "general suggestion 2"],
  "ai_summary": "2-3 sentences, simple language, specific to this product",
  "suitable_for": {{"gym": true, "weight_loss": true, "heart": true, "diabetic": false}}
}}

STRICT SCORING RULES FOR FRONTEND UI (0-50: Red/Avoid, 51-80: Yellow/Moderate, 81-100: Green/Good):
- Start at 100 points. The score_breakdown array MUST ONLY contain DEDUCTIONS (negative points). NEVER give positive/bonus points.
- ULTRA-PROCESSED PENALTY: If the product category is Chips, Soda, Instant Noodles, Biscuits, or Chocolates, MANDATORY deduct -25 points immediately (Factor: "Ultra-Processed Food").
- SUGAR PENALTY: >15g deduct -25. 5-15g deduct -15.
- SODIUM PENALTY: >400mg deduct -25. 140-400mg deduct -15.
- FAT/REFINED PENALTY: If Maida (Refined Flour), Palm Oil, or high Saturated Fat is present, deduct -15 each.
- ADDITIVES PENALTY: Artificial colors, flavours, or preservatives (INS numbers, MSG) found: deduct -10 per item (max -30).
- Unhealthy junk food MUST mathematically drop to 50 or below based on these deductions. DO NOT be lenient.
- If the product is genuinely clean (no sugar, healthy ingredients), score_breakdown can just be [{{"factor": "No Concerns", "points": 0, "reason": "Clean ingredients"}}]

Rules:
- If no price is visible on label, value_assessment.verdict = "Cannot determine (no price on label)".
- better_alternatives should be general category advice (not fake brand names).
- ALWAYS return exactly 5 ingredients in the ingredients array (derive from prominent nutrients/additives if fewer exist on label).
- Order ingredients by importance: main ingredient first, then any preservatives/additives (flag these as Risky/Moderate), then remaining nutrients.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash", # Upgraded to 2.5 for better JSON math & logic
        contents=prompt,
        config={"temperature": 0}
    )
    
    ai_text = response.text.strip().replace("```json", "").replace("```", "")
    
    try:
        report = json.loads(ai_text)
        
        # Python side logic to guarantee the score matches your JS Ring colors
        base_score = 100
        total_deduction = sum(item["points"] for item in report.get("score_breakdown", []))
        final_score = max(0, min(100, base_score + total_deduction))
        
        report["health_score"] = final_score
        
        # Override the text label so it always matches the ring color
        if final_score <= 50:
            report["recommendation"]["label"] = "Avoid"
        elif final_score <= 80:
            report["recommendation"]["label"] = "Moderate"
        else:
            report["recommendation"]["label"] = "Should Buy"

    except Exception as e:
        print("Error parsing JSON:", e)
        return jsonify({"error": "Failed to parse data."}), 500

    return jsonify({"ocr_text": text, "report": report})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)