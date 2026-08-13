from google import genai
import os

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

for m in client.models.list():
    print(m.name, "-", m.supported_actions)