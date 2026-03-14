from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from model import predict_crop
import requests
import random
import string
import time
import json
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

load_dotenv()  # loads variables from backend/.env
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

if HAS_GEMINI and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# ---------------------------
# File-based OTP store (survives --reload restarts)
# ---------------------------
_STORE_FILE = os.path.join(os.path.dirname(__file__), ".otp_store.json")

def _load_store():
    try:
        with open(_STORE_FILE, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def _save_store(store):
    with open(_STORE_FILE, "w") as f:
        json.dump(store, f)

valid_tokens = set()  # issued auth tokens (session only is fine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Data Models
# ---------------------------

class FarmInput(BaseModel):
    temperature: float
    humidity: float
    ph: float
    rainfall: float


class PriceInput(BaseModel):
    crop: str
    mandi_price: float
    msp_price: float

class ChatInput(BaseModel):
    message: str
    userName: str | None = None
    cropName: str | None = None
    weatherTemp: str | None = None
    soilMoisture: str | None = None


# ---------------------------
# Home Route
# ---------------------------

@app.get("/")
def home():
    return {"message": "Agri Fair Price System Running 🚜"}


# ---------------------------
# Crop + Fertilizer Recommendation
# ---------------------------

@app.post("/recommend")
def recommend(data: FarmInput):

    if data.rainfall > 100 and data.temperature > 25:
        crop = "Rice"
        fertilizer = "Urea"
    elif data.soil_type.lower() == "black":
        crop = "Cotton"
        fertilizer = "DAP"
    else:
        crop = "Wheat"
        fertilizer = "NPK"

    return {
        "recommended_crop": crop,
        "fertilizer": fertilizer
    }


# ---------------------------
# Fair Price Check
# ---------------------------

@app.post("/check-price")
def check_price(data: PriceInput):

    if data.mandi_price < data.msp_price:
        status = "Unfair Price ❌ Farmer at Loss"
        suggestion = "Wait or sell at MSP center"
    else:
        status = "Fair Price ✅"
        suggestion = "You can sell in mandi"

    return {
        "crop": data.crop,
        "mandi_price": data.mandi_price,
        "msp_price": data.msp_price,
        "status": status,
        "suggestion": suggestion
    }

@app.get("/market-prices")
def get_market_prices():
    # Deprecated mock endpoint - kept for backward compatibility if needed elsewhere
    return [
        {"crop": "Wheat (Kanak)", "mandi": "KARNAL MANDI", "price": "₹2,125 / qtl", "change": "+ ₹15.00", "up": True, "neutral": False, "iconType": "wheat"},
        {"crop": "Basmati Rice", "mandi": "PANIPAT MANDI", "price": "₹3,450 / qtl", "change": "- ₹42.00", "up": False, "neutral": False, "iconType": "rice"},
        {"crop": "Mustard (Sarson)", "mandi": "REGIONAL AVG", "price": "₹5,200 / qtl", "change": "NO CHANGE", "up": False, "neutral": True, "iconType": "mustard"}
    ]

@app.get("/mandi-prices")
def get_mandi_prices():
    fallback = [
        {"crop": "Wheat",          "market": "Karnal Mandi",       "state": "Haryana",        "price": "2125", "min_price": "2050", "max_price": "2200"},
        {"crop": "Wheat",          "market": "Amritsar Mandi",     "state": "Punjab",         "price": "2085", "min_price": "2000", "max_price": "2150"},
        {"crop": "Paddy (Dhan)",   "market": "Panipat Mandi",      "state": "Haryana",        "price": "3450", "min_price": "3200", "max_price": "3500"},
        {"crop": "Paddy (Dhan)",   "market": "Ludhiana Mandi",     "state": "Punjab",         "price": "3520", "min_price": "3300", "max_price": "3600"},
        {"crop": "Mustard",        "market": "Rohtak Mandi",       "state": "Haryana",        "price": "5200", "min_price": "5000", "max_price": "5400"},
        {"crop": "Mustard",        "market": "Jaipur Mandi",       "state": "Rajasthan",      "price": "5350", "min_price": "5100", "max_price": "5500"},
        {"crop": "Cotton",         "market": "Sirsa Mandi",        "state": "Haryana",        "price": "7100", "min_price": "6800", "max_price": "7300"},
        {"crop": "Cotton",         "market": "Akola Mandi",        "state": "Maharashtra",    "price": "6980", "min_price": "6700", "max_price": "7200"},
        {"crop": "Maize",          "market": "Ambala Mandi",       "state": "Haryana",        "price": "1800", "min_price": "1700", "max_price": "1900"},
        {"crop": "Sugarcane",      "market": "Muzaffarnagar",      "state": "Uttar Pradesh",  "price": "3150", "min_price": "3000", "max_price": "3300"},
        {"crop": "Soybean",        "market": "Indore Mandi",       "state": "Madhya Pradesh", "price": "4600", "min_price": "4400", "max_price": "4800"},
        {"crop": "Bajra",          "market": "Hisar Mandi",        "state": "Haryana",        "price": "2050", "min_price": "1900", "max_price": "2100"},
        {"crop": "Gram (Chana)",   "market": "Bikaner Mandi",      "state": "Rajasthan",      "price": "5800", "min_price": "5600", "max_price": "6000"},
        {"crop": "Turmeric",       "market": "Nizamabad Mandi",    "state": "Telangana",      "price": "9200", "min_price": "8800", "max_price": "9600"},
        {"crop": "Onion",          "market": "Nashik Mandi",       "state": "Maharashtra",    "price": "1450", "min_price": "1200", "max_price": "1700"},
        {"crop": "Potato",         "market": "Agra Mandi",         "state": "Uttar Pradesh",  "price": "1200", "min_price": "1000", "max_price": "1400"},
        {"crop": "Tomato",         "market": "Kolar Mandi",        "state": "Karnataka",      "price": "2800", "min_price": "2500", "max_price": "3200"},
        {"crop": "Arhar (Tur)",    "market": "Latur Mandi",        "state": "Maharashtra",    "price": "6500", "min_price": "6200", "max_price": "6800"},
        {"crop": "Moong (Green Gram)", "market": "Jaipur Mandi",   "state": "Rajasthan",      "price": "7200", "min_price": "6900", "max_price": "7500"},
        {"crop": "Urad (Black Gram)", "market": "Indore Mandi",    "state": "Madhya Pradesh", "price": "6800", "min_price": "6500", "max_price": "7100"},
    ]
    try:
        url = (
            "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
            "?api-key=579b464db66ec23bdd000001859666c5db6149177a28e7d23a4fd18c"
            "&format=json&limit=100"
        )
        response = requests.get(url, timeout=8)
        data = response.json()

        results = []
        for item in data.get('records', []):
            modal = item.get("modal_price", "0")
            if not modal or modal == "0":
                continue
            results.append({
                "crop":      item.get("commodity", ""),
                "market":    item.get("market", ""),
                "state":     item.get("state", ""),
                "price":     modal,
                "min_price": item.get("min_price", "0"),
                "max_price": item.get("max_price", "0"),
            })

        return results if results else fallback
    except Exception as e:
        print(f"Mandi API error: {e}")
        return fallback


# ---------------------------
# Dynamic Mock Dashboard Data
# ---------------------------

@app.get("/weather")
def get_weather():
    return {
        "temp": "28°C",
        "condition": "Partly Cloudy",
        "season": "Rabi Season",
        "subtext": "Best time to sow Wheat",
        "icon": "SUN"
    }

@app.get("/recommendation")
def get_dashboard_recommendation():
    """Returns the contextual AI recommendation for the active crop"""
    return {
        "text": "Apply Urea fertilizer within next 48 hours for optimal yield based on recent moisture levels."
    }

class SoilAnalysisInput(BaseModel):
    nitrogen: int
    phosphorus: int
    potassium: int
    ph_level: float

@app.post("/soil-analysis")
def analyze_soil(data: SoilAnalysisInput):
    """Mocks a complex ML soil breakdown"""
    score = (data.nitrogen + data.phosphorus + data.potassium) / 3
    health = "Excellent" if score > 50 else "Average" if score > 30 else "Poor"
    
    return {
        "health_status": health,
        "score": round(score, 1),
        "suggestion": "Increase nitrogen content by 15% before next sowing cycle." if score < 40 else "Soil balance is optimal."
    }

class CropAIInput(BaseModel):
    temperature: float
    humidity: float
    soil_health: str

@app.post("/crop-recommendation")
def mock_predict_crop(data: CropAIInput):
    """Mocks AI prediction based on environmental data"""
    best_match = "Cotton" if data.temperature > 30 else "Wheat"
    return {
        "recommended_crop": best_match,
        "confidence": 89.4,
        "reasoning": f"Ideal conditions for {best_match} due to {data.temperature}C temp and {data.soil_health} soil."
    }

class CropInput(BaseModel):
    temperature: float
    humidity: float
    ph: float
    rainfall: float

@app.post("/predict-crop")
def predict(data: CropInput):
    result = predict_crop(
        data.temperature,
        data.humidity,
        data.ph,
        data.rainfall
    )

    return {
        "crop": result,
        "confidence": 90
    }


# ---------------------------
# OTP Authentication
# ---------------------------

class PhoneInput(BaseModel):
    phone: str

class EmailInput(BaseModel):
    email: str

class OTPInput(BaseModel):
    otp: str

def _generate_otp():
    return str(random.randint(100000, 999999))

def _generate_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

@app.post("/send-otp")
def send_otp(data: PhoneInput):
    otp = _generate_otp()
    store = _load_store()
    store[data.phone] = {"otp": otp, "expires_at": time.time() + 1800}
    _save_store(store)

    number_10 = data.phone.replace("+91", "").replace(" ", "").strip()
    print(f"\n📱 OTP for {data.phone}: {otp}\n")

    # ------ 1. Try Twilio (most reliable, free trial works) ------
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER:
        try:
            from twilio.rest import Client as TwilioClient
            client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=f"Your Agri AI OTP is: {otp}. Valid for 30 minutes. Do not share.",
                from_=TWILIO_FROM_NUMBER,
                to=data.phone  # e.g. +917480814697
            )
            print(f"✅ Twilio SMS sent: {message.sid}")
            return {"success": True, "message": "OTP sent via SMS"}
        except Exception as e:
            print(f"Twilio error: {e}")
            # fall through to Fast2SMS

    # ------ 2. Try Fast2SMS (needs DLT registration for OTP route) ------
    if FAST2SMS_API_KEY and FAST2SMS_API_KEY != "YOUR_FAST2SMS_API_KEY_HERE":
        try:
            response = requests.get(
                "https://www.fast2sms.com/dev/bulkV2",
                params={
                    "authorization": FAST2SMS_API_KEY,
                    "route": "otp",
                    "variables_values": otp,
                    "flash": 0,
                    "numbers": number_10
                },
                timeout=10
            )
            result = response.json()
            if result.get("return"):
                return {"success": True, "message": "OTP sent via SMS"}
            else:
                print(f"Fast2SMS error: {result}")
        except Exception as e:
            print(f"Fast2SMS exception: {e}")

    # ------ 3. Dev fallback — OTP printed to terminal ------
    print(f"⚠️  No SMS provider worked. Use OTP above from terminal.")
    return {"success": True, "message": "OTP ready (check backend terminal)"}


@app.post("/send-email-otp")
def send_email_otp(data: EmailInput):
    otp = _generate_otp()
    store = _load_store()
    store[data.email] = {"otp": otp, "expires_at": time.time() + 1800}
    _save_store(store)
    
    print(f"\n📧 OTP for {data.email}: {otp}\n")
    
    if SMTP_EMAIL and SMTP_PASSWORD:
        try:
            msg = EmailMessage()
            msg.set_content(f"Your Agri AI verification OTP is: {otp}\n\nValid for 30 minutes. Do not share this code with anyone.")
            msg['Subject'] = 'Agri AI Login OTP'
            msg['From'] = SMTP_EMAIL
            msg['To'] = data.email

            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"✅ OTP Email sent to {data.email}")
            return {"success": True, "message": "OTP sent to email"}
        except Exception as e:
            print(f"SMTP Error: {e}")
            return {"success": False, "message": "Failed to send email. Check SMTP configuration."}
    
    # Dev Fallback
    print("⚠️  SMTP not configured. Use OTP above from terminal.")
    return {"success": True, "message": "OTP ready (check backend terminal)"}

@app.post("/verify-otp")
def verify_otp(data: OTPInput):
    # DEV BYPASS: "000000" always works in development
    if data.otp == "000000":
        token = _generate_token()
        valid_tokens.add(token)
        return {"success": True, "token": token}

    now = time.time()
    store = _load_store()
    for key, val in list(store.items()):
        if val["otp"] == data.otp and val["expires_at"] > now:
            del store[key]  # one-time use
            _save_store(store)
            token = _generate_token()
            valid_tokens.add(token)
            return {"success": True, "token": token}
    return {"success": False, "message": "Invalid or expired OTP"}

@app.get("/dev-otp")
def get_dev_otp():
    """DEV ONLY: Returns current OTPs from store for testing"""
    store = _load_store()
    return {k: v["otp"] for k, v in store.items()}

# ---------------------------
# AI Chatbot Endpoint
# ---------------------------

@app.post("/chat")
def chat_endpoint(data: ChatInput):
    if not HAS_GEMINI:
        return {"reply": "⚙️ System Error: Please install 'google-generativeai' in your backend using 'pip install google-generativeai' to enable Real AI responses."}
        
    if not GEMINI_API_KEY:
        return {"reply": "🔑 Configuration Missing: Please add 'GEMINI_API_KEY=your_key_here' to your backend/.env file to activate the Real AI Farming Assistant."}

    try:
        user_name = data.userName or "Farmer"
        crop = data.cropName or "Unknown Crop"
        temp = data.weatherTemp or "Unknown Temp"
        moisture = data.soilMoisture or "Unknown Moisture"

        # Ensure the key is clean
        clean_key = GEMINI_API_KEY.strip().strip('"').strip("'")
        
        system_prompt = f"""You are an advanced AI Farming Assistant speaking to a farmer named {user_name}.
Current Context:
- Active Crop: {crop}
- Local Weather: {temp}
- Soil Moisture Status: {moisture}
        
The farmer just asked: "{data.message}"

Please respond intelligently to their specific question using the data provided above. 
Keep your response concise, friendly, and actionable inside agriculture.
        """

        # Try verified model identifiers for this specific key
        model_names = ["gemini-2.5-flash", "gemini-2.0-flash"]
        
        for model_name in model_names:
            # v1beta is required for newer models like 2.5-flash
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"
            
            # Re-create payload fresh for each attempt
            curr_payload = {
                "contents": [{"parts": [{"text": system_prompt}]}]
            }
            
            try:
                response = requests.post(url, headers={'Content-Type': 'application/json'}, json=curr_payload, timeout=12)
                print(f"DEBUG: v1/{model_name} -> {response.status_code}")
                
                if response.status_code == 200:
                    response_data = response.json()
                    candidates = response_data.get('candidates', [])
                    if candidates and candidates[0].get('content'):
                        reply = candidates[0]['content']['parts'][0]['text']
                        print(f"DEBUG {model_name} SUCCESS!")
                        return {"reply": reply.replace('*', '').strip()}
                
                last_resp = response
                if response.status_code != 404:
                    print(f"DEBUG ERROR: {response.text}")
            except Exception as e:
                print(f"DEBUG EX: {model_name} -> {e}")
                continue

        if last_resp is not None:
            return {"reply": f"Sorry {user_name}, I'm having trouble. (Error {last_resp.status_code}: {last_resp.text[:80]}...)"}
        return {"reply": f"Sorry {user_name}, I couldn't connect to the AI server."}
        
    except Exception as e:
        print(f"Gemini AI Fatal Error: {e}")
        return {"reply": f"Sorry, my AI brain just hit a major wall. Please try again in a moment. (Error: {str(e)[:50]})"}


