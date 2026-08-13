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
    image.save("uploads/" + image.filename)

    text = pytesseract.image_to_string(Image.open("uploads/" + image.filename))
    print("OCR TEXT:", text)
    
    prompt = f"""Write for a common Indian buyer — someone with no nutrition background. Use everyday words, short sentences, and relatable comparisons (e.g. "itni sugar ek chai ke chammach jitni hai" style comparisons in English are also fine). Avoid textbook language.:
{text}
Return ONLY valid JSON:
{{
"product": {{"name": "most prominent product/brand text, else 'Product Label'", "variant": "string or empty", "brand": "string or 'Not specified'"}},
  "nutrition": {{"calories": number, "protein": number, "sugar": number, "fat": number, "fiber": number, "sodium": number}},
  "health_score": number (0-100),
  "score_breakdown": [{{"factor": "string", "points": number (ALWAYS negative or zero, e.g. -10, -5), "reason": "specific reason with the exact number from the label that caused this deduction"}}],
  "recommendation": {{"label": "Should Buy|Moderate|Avoid", "description": "one sentence, simple language"}},
  "health_indicators": [{{"name": "string", "status": "green|yellow|red", "note": "Good|Moderate|High"}}],
  "ingredients": [{{"name": "string", "purpose": "why it's added, simple words", "description": "clear benefit OR harm explained simply, mention long-term effect if relevant", "status": "Safe|Moderate|Risky"}}],
  "claims_check": [{{"claim": "exact marketing claim text found on label", "verdict": "Supported|Partially Supported|Not Supported", "reason": "explain using actual numbers, simple language"}}],
  "value_assessment": {{"verdict": "Good Value|Fair|Overpriced|Cannot determine (no price on label)", "reason": "simple explanation comparing nutrition given vs typical products in this category"}},
  "better_alternatives": ["general suggestion 1 e.g. 'Look for products with under 5g sugar per serving in same category'", "general suggestion 2"],
  "ai_summary": "2-3 sentences, simple language, specific to this product",
  "suitable_for": {{"gym": true, "weight_loss": true, "heart": true, "diabetic": false}}
}}
Scoring rules (strict):
- Score starts at 100. The score_breakdown array should ONLY contain deductions (negative points) — never positive/bonus points.
- If the product is genuinely excellent with nothing to deduct, score_breakdown can have a single entry like {{"factor": "No Concerns Found", "points": 0, "reason": "This product has no sugar, low fat, and clean ingredients — no health concerns identified."}}
- Deduct points ONLY for: high sugar (>15g deduct 15, 5-15g deduct 8), high sodium (>400mg deduct 15, 140-400mg deduct 8), low fiber for a food product (deduct 5), artificial preservatives/additives (deduct 10 each, max -30), unclear/vague ingredient sourcing (deduct 5).
- The sum of all "points" in score_breakdown, added to 100, MUST equal health_score exactly. Double check your math before responding.
Scoring rules (follow strictly, always same logic):
- Start at 100 points.
- Sugar: 0-5g no deduction, 5-15g deduct 10, 15g+ deduct 20.
- Sodium: 0-140mg no deduction, 140-400mg deduct 10, 400mg+ deduct 20.
- Fiber: 5g+ add 10, below 5g no bonus.
- Protein: 10g+ add 10, below 10g no bonus.
- Saturated/unhealthy fat mentioned: deduct 10.
- Artificial preservatives/additives found: deduct 15 per item (max -30).
Rules:
- If no price is visible on label, value_assessment.verdict = "Cannot determine (no price on label)" and explain what info WOULD be needed.
- better_alternatives should be general category advice (not fake brand names), since you cannot browse real prices.
- If no ingredient list is printed, derive ingredients from nutrients shown.
- ALWAYS return exactly 5 ingredients in the ingredients array (or all available if fewer than 5 exist on the label — but try hard to find 5 by including major nutrients as ingredients if the ingredient list is short).
- Order ingredients by importance: main ingredient first, then any preservatives/additives (flag these even if minor), then remaining nutrients.
- claims_check: scan OCR text for ANY promotional phrases (e.g. "supports muscle growth", "low fat", "no added sugar") and verify each against actual numbers. If truly none found, return empty array."""

    response = client.models.generate_content(
    model="gemini-flash-lite-latest",
    contents=prompt,
    config={"temperature": 0}
)
    ai_text = response.text.strip().replace("```json", "").replace("```", "")
    report = json.loads(ai_text)
    base_score = 100
    total_deduction = sum(item["points"] for item in report["score_breakdown"])
    report["health_score"] = max(0, min(100, base_score + total_deduction))

    return jsonify({"ocr_text": text, "report": report})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)