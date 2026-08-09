from flask import Flask, request
import pytesseract
from PIL import Image
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

@app.route("/")
def home():
    return "LabelLense Backend is Working!"

@app.route("/analyze", methods=["POST"])
def analyze():
    image = request.files["image"]
    # image.save("uploads/" + image.filename)

    text = pytesseract.image_to_string(
        Image.open("uploads/" + image.filename)
    )

    print(text)
    return text

app.run(debug=True, use_reloader=False)