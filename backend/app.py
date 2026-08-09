from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
def analyze():
    image = request.files["image"]
    image.save("uploads/" + image.filename)

    print(image.filename)
    return "Image saved!"

app.run(debug=True)