import requests
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GEMINI_API_KEY').strip().strip('"').strip("'")
print(f"DEBUG: Key starts with {key[:10]}...")

def list_models_for(version):
    url = f"https://generativelanguage.googleapis.com/{version}/models?key={key}"
    try:
        r = requests.get(url)
        print(f"--- {version} ---")
        if r.status_code == 200:
            data = r.json()
            for m in data.get('models', []):
                print(f"{version}_MODEL: {m['name']}")
        else:
            print(f"Error {r.status_code}")
    except Exception as e:
        print(f"Ex: {e}")

list_models_for('v1')
list_models_for('v1beta')
