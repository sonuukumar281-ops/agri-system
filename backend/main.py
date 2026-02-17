from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
    rainfall: float
    temperature: float
    soil_type: str
    location: str
    n: int  # Nitrogen
    p: int  # Phosphorus
    k: int  # Potassium


class PriceInput(BaseModel):
    crop: str
    mandi_price: float
    msp_price: float


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
    return [
        {"crop": "Wheat", "mandi_price": 2100, "msp_price": 2275, "status": "Below MSP"},
        {"crop": "Rice", "mandi_price": 3200, "msp_price": 2183, "status": "Above MSP"},
        {"crop": "Cotton", "mandi_price": 6800, "msp_price": 6620, "status": "Above MSP"},
        {"crop": "Maize", "mandi_price": 1900, "msp_price": 2090, "status": "Below MSP"},
    ]
