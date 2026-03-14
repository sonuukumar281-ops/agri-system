import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Load dataset
import os
import pandas as pd

BASE_DIR = os.path.dirname(__file__)
file_path = os.path.join(BASE_DIR, "crop_recommendation .csv")

df = pd.read_csv(file_path)

# Features & target
X = df[["temperature", "humidity", "ph", "rainfall"]]
y = df["label"]

# Train model
model = RandomForestClassifier()
model.fit(X, y)

# Prediction function
def predict_crop(temp, humidity, ph, rainfall):
    input_df = pd.DataFrame([[temp, humidity, ph, rainfall]], columns=["temperature", "humidity", "ph", "rainfall"])
    prediction = model.predict(input_df)
    return prediction[0]