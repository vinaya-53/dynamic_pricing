import os
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel
from keras.saving import register_keras_serializable

# Register custom loss function
@register_keras_serializable()
def mse(y_true, y_pred):
    return tf.keras.losses.mean_squared_error(y_true, y_pred)

# Load Model & Label Encoder
model = tf.keras.models.load_model("model_checkpoint.h5", custom_objects={"mse": mse})
with open("label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

app = FastAPI()

class PredictionRequest(BaseModel):
    csv_data: str  # Base64-encoded CSV content
    category: str  # Example: "BEAUTY"

@app.post("/predict/")
def predict_sales(request: PredictionRequest):
    import base64
    from io import StringIO

    csv_string = base64.b64decode(request.csv_data).decode("utf-8")
    data = pd.read_csv(StringIO(csv_string))
    data = data[data["item"] == request.category]

    # Generate future dates
    future_dates = pd.date_range(start="2025-03-01", end="2025-09-30", freq="ME")
    
    # Dummy prediction (Replace with real model inference)
    predictions = model.predict(np.random.rand(len(future_dates), 2, 65, 1)).flatten()

    return {"forecast": [{"date": str(date), "predicted_sales": float(sales)} for date, sales in zip(future_dates, predictions)]}
