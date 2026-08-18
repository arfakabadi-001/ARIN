from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
from flask_cors import CORS
from google import genai
import os, json

app = Flask(__name__)
CORS(app)

# --- Setup ---
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
os.makedirs("uploads", exist_ok=True)  # folder na ho to crash na ho


def build_prompt(ocr_text):
    """AI ko bhejne wala prompt - clean, strict aur hallucination-resistant."""
    return f"""You are analyzing a product label for a common Indian buyer with no nutrition background.

Use everyday words, short sentences, and relatable comparisons.
Avoid textbook language, unnecessary medical jargon, and generic filler.

IMPORTANT DATA RULES:
- Use ONLY information that is clearly present in the OCR text.
- NEVER invent, guess, assume, or hallucinate a nutrient, ingredient, serving size, price, claim, or product detail.
- If information is missing or unclear, use null, empty string, "Unknown", or "Not available" as appropriate.
- OCR may contain mistakes. Do not confidently treat obviously corrupted OCR text as fact.
- Do not reconstruct unclear ingredient names or marketing claims.
- Do not create fake brand names or product names.

OCR TEXT FROM LABEL:
{ocr_text}

Return ONLY valid JSON in this exact structure.
No markdown. No ```json. No extra text.

{{
  "product": {{
    "name": "most prominent clearly identifiable product/brand text, else 'Product Label'",
    "variant": "clearly identifiable variant/flavour/type, else empty string",
    "brand": "clearly identifiable brand, else 'Not specified'"
  }},

  "nutrition": {{
    "basis": "per 100g|per 100ml|per serving|per package|unknown",
    "serving_size": "exact serving size from label, else 'Unknown'",
    "calories": null,
    "protein": null,
    "sugar": null,
    "fat": null,
    "saturated_fat": null,
    "trans_fat": null,
    "fiber": null,
    "sodium": null
  }},

  "score_breakdown": [
    {{
      "factor": "string",
      "points": 0,
      "reason": "specific reason using an exact number from this label when applicable"
    }}
  ],

  "recommendation": {{
    "label": "Should Buy|Moderate|Avoid",
    "description": "MUST reference at least 2 actual numbers from this product when enough numerical information is available. If insufficient data exists, clearly say that."
  }},

  "health_indicators": [
    {{
      "name": "string",
      "status": "green|yellow|red",
      "note": "Good|Moderate|High"
    }}
  ],

  "ingredients": [
    {{
      "name": "exact ingredient name clearly found on label",
      "purpose": "why it is added, in simple words",
      "description": "clear benefit, function, or concern explained simply",
      "status": "Safe|Moderate|Risky"
    }}
  ],

  "claims_check": [
    {{
      "claim": "exact promotional/marketing claim clearly found on label",
      "verdict": "Supported|Partially Supported|Not Supported",
      "reason": "explain using actual numbers or clearly available label information"
    }}
  ],

  "value_assessment": {{
    "verdict": "Good Value|Fair|Overpriced|Cannot determine (no price on label)",
    "reason": "simple explanation. Do not claim exact market comparison unless sufficient information is available."
  }},

  "better_alternatives": [
    "general category advice 1",
    "general category advice 2"
  ],

  "ai_summary": "3-4 short sentences. MUST mention specific numbers from THIS product when numerical information is available. Mention one specific strength and one specific limitation/watch-out when supported by the label. Do not use generic filler.",

  "suitable_for": {{
    "gym": false,
    "weight_loss": false,
    "heart": false,
    "diabetic": false
  }}
}}

SCORING RULES:

- Score always starts at 100.
- score_breakdown must ONLY contain deductions.
- points must always be zero or negative.
- NEVER give positive/bonus points.
- The final score will be calculated separately by the application.

CATEGORY-AWARE RULE:
Before deducting anything, ask:
"Is this actually a problem for THIS TYPE of product, or is it simply normal for this category?"

Examples:
- Whey protein naturally having very little fiber is NOT automatically a flaw.
- Cooking oil naturally having very high fat is NOT automatically a flaw.
- A protein product naturally having high protein is NOT a reason for deduction.
Only deduct for genuine concerns relative to the product's category.

NUTRITION BASIS RULE:
- Always check whether nutrition values are given per 100g, per 100ml, per serving, or per package.
- Do NOT compare values as though they use the same basis when they do not.
- If the nutrition basis is unknown, do not make strong threshold-based conclusions.
- Never invent a serving size.

SUGAR RULE:
- If the relevant sugar value is clearly comparable and relevant to the product category:
  - >15g: deduct 15 points
  - 5g-15g: deduct 8 points
- Do not automatically penalize products where naturally occurring sugar is expected for the category.
- If the basis is unclear, avoid applying the threshold.

SODIUM RULE:
- If sodium is clearly available on a comparable basis:
  - >400mg: deduct 15 points
  - 140mg-400mg: deduct 8 points
- Apply this only when relevant to the product category and nutrition basis.
- Do not invent sodium values.

ARTIFICIAL ADDITIVES/PRESERVATIVES:
- Deduct 10 points for each clearly identifiable artificial preservative/additive that is a genuine concern.
- Maximum deduction from this category: -30.
- Do not label an ingredient as artificial or risky unless the label clearly identifies it or this classification is reliable.

UNCLEAR INGREDIENT SOURCING:
- Deduct 5 points only when the label genuinely contains vague/unclear ingredient information.
- Do not deduct simply because an ingredient has a technical name.

MISLEADING CLAIM:
- Deduct 10 points only when a clearly identifiable marketing claim is contradicted or poorly supported by the actual label numbers.

NO CONCERNS:
- If there are no genuine concerns for THIS product category, return:
  {{
    "factor": "No Concerns Found",
    "points": 0,
    "reason": "No significant concerns were identified from the available label information."
  }}

INGREDIENT RULES:
- Return up to 5 ingredients when clearly identifiable.
- NEVER invent ingredients.
- NEVER derive specific ingredients from calories, protein, fat, sugar, or other nutrient values.
- If the ingredient list is missing, return fewer ingredients or an empty array.
- If only a few ingredients are clearly visible, return only those ingredients.
- Order ingredients by importance when possible: main ingredients, additives/preservatives, then remaining identifiable components.
- Do not pretend that nutrients are ingredients.

CLAIMS RULES:
- Scan the OCR text for promotional/marketing phrases such as:
  "supports muscle growth", "low fat", "high protein", "no added sugar", "natural", "healthy", etc.
- Include ONLY claims that are reasonably clear in the OCR text.
- Preserve the claim wording as closely as possible.
- If the wording is unclear because of OCR corruption, do not invent or reconstruct it.
- Verify claims using actual label information when possible.
- If there are no clearly identifiable promotional claims, return an empty array.

HEALTH INDICATOR RULES:
- green = information supports a favorable interpretation
- yellow = moderate/caution
- red = clearly concerning based on available information
- Do not assign red/yellow merely because information is missing.
- If there is insufficient information, use a neutral indicator or omit that indicator rather than guessing.

SUITABILITY RULES:
- gym=true only when the available protein information is meaningfully high for the product/category.
- weight_loss=true only when available calories/sugar information supports it.
- heart=true only when sodium and relevant unhealthy fats (especially saturated/trans fat, if available) support it.
- diabetic=true only when available sugar/carbohydrate information supports it.
- Set false when the available numbers do not support the claim.
- Do NOT default everything to true.
- If information is insufficient, do not pretend certainty.

VALUE ASSESSMENT:
- If no price is clearly visible on the label:
  verdict = "Cannot determine (no price on label)"
- Do not claim a product is overpriced or good value without enough information.
- Do not invent prices.
- Do not use fake brand comparisons.
- better_alternatives must contain general category advice, not invented brand names.

AI SUMMARY:
- Keep it to 3-4 short sentences.
- Mention specific numbers from THIS product whenever available.
- Mention one specific strength.
- Mention one specific limitation/watch-out when supported.
- Never say "great choice", "healthy product", "clean product", etc. without explaining why using available label information.

OCR TEXT MAY BE INCOMPLETE:
If the OCR text does not contain enough information for a reliable conclusion, be transparent in the JSON rather than guessing.

"""


@app.route("/analyze", methods=["POST"])
def analyze():
    # 1. Image save karo
    image = request.files["image"]
    image_path = os.path.join("uploads", image.filename)
    image.save(image_path)

    # 2. OCR se text nikalo
    text = pytesseract.image_to_string(Image.open(image_path))
    print("OCR TEXT:", text)

    # 3. AI se structured report mangwao
    response = client.models.generate_content(
        model="gemini-flash-lite-latest",
        contents=build_prompt(text),
        config={"temperature": 0}  # consistent results ke liye
    )

    ai_text = response.text.strip().replace("```json", "").replace("```", "")

    try:
        report = json.loads(ai_text)
    except json.JSONDecodeError:
        return jsonify({"error": "AI response could not be understood. Please try again."}), 500

    # 4. Score ko khud calculate karo (AI ke math pe bharosa mat karo)
    deductions = report.get("score_breakdown", [])
    total_deduction = sum(item.get("points", 0) for item in deductions)
    report["health_score"] = max(0, min(100, 100 + total_deduction))

    return jsonify({"ocr_text": text, "report": report})


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)