import os
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import sys

from src.load_data import read_data, series_to_supervised, prepare_data
from sklearn.preprocessing import LabelEncoder
from keras.saving import register_keras_serializable

# ✅ Enable Logging
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

# ✅ Register 'mse' as a serializable function
@register_keras_serializable()
def mse(y_true, y_pred):
    return tf.keras.losses.mean_squared_error(y_true, y_pred)

# ✅ Ensure model checkpoint exists
model_path = "model_checkpoint.h5"
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model checkpoint not found: {model_path}")

# ✅ Load trained model with custom loss function
model = tf.keras.models.load_model(model_path, custom_objects={"mse": mse})
logging.info("✅ Model loaded successfully!")

# ✅ Load test dataset
test_csv = "output.csv"
if not os.path.exists(test_csv):
    raise FileNotFoundError(f"Test data file not found: {test_csv}")

# ✅ Load Data using `read_data`
data = read_data(test_csv)

# ✅ Load label encoder
encoder_path = "label_encoder.pkl"
if not os.path.exists(encoder_path):
    raise FileNotFoundError("Label encoder file not found. Did you run training first?")
with open(encoder_path, "rb") as f:
    label_encoder = pickle.load(f)

# ✅ Normalize categories in the dataset
data["item"] = data["item"].astype(str).str.strip().str.upper()

# ✅ Initialize FastAPI
app = FastAPI(debug=True)

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Define request model
class PredictionInput(BaseModel):
    category: str

@app.post("/predict/")
async def predict_sales(input_data: PredictionInput):
    category = input_data.category.strip().upper()
    logging.info(f"🔍 Received category: {category}")

    # ✅ Check if category exists in label encoder
    if category not in label_encoder.classes_:
        logging.warning(f"⚠️ Category '{category}' not found in label encoder. Assigning 'UNKNOWN'.")
        category = "UNKNOWN"

    # ✅ Filter Data for the Requested Category
    category_data = data[data["item"] == category]
    if category_data.empty:
        raise HTTPException(status_code=404, detail=f"No data found for category: {category}")

    # ✅ Ensure No Missing Values in Dataset
    if category_data.isnull().values.any():
        logging.warning("⚠️ Missing values detected in category data. Filling with 0.")
        category_data.fillna(0, inplace=True)

    # ✅ Prepare Data for Prediction
    window = 129
    lag_size = 1
    series, labels = series_to_supervised(category_data, window=window, lag=lag_size)

    # ✅ Handle unseen labels
    known_labels = set(label_encoder.classes_)
    labels = [label if label in known_labels else "UNKNOWN" for label in labels]

    # ✅ Ensure "UNKNOWN" is in label encoder
    if "UNKNOWN" not in label_encoder.classes_:
        label_encoder.classes_ = np.append(label_encoder.classes_, "UNKNOWN")

    # ✅ Encode labels
    labels_encoded = label_encoder.transform(labels)

    # ✅ Drop Non-Numeric Columns and Ensure Correct Shape
    x_test, _ = prepare_data(series.drop(columns=["date", "item"]), labels_encoded, 2)

    # ✅ Ensure x_test has 65 features
    if x_test.shape[-2] > 65:
        x_test = x_test[:, :, :65, :]
    elif x_test.shape[-2] < 65:
        raise ValueError(f"Expected 65 features, got {x_test.shape[-2]}")

    # ✅ Reshape Correctly for Model Input
    x_test_reshaped = x_test.reshape((-1, 2, 65, 1))

    # ✅ Check Input Shape
    model_input_shape = model.input_shape
    if x_test_reshaped.shape[1:] != model_input_shape[1:]:
        raise ValueError(f"Shape mismatch! Expected {model_input_shape[1:]}, but got {x_test_reshaped.shape[1:]}")

    # ✅ Make Predictions
    future_dates = pd.date_range(start="2013-03-01", end="2014-09-30", freq="2W")  # 2-week intervals
    predictions = model.predict(x_test_reshaped[:len(future_dates)]).flatten().tolist()

    return {
        "category": category,
        "future_dates": future_dates.strftime("%Y-%m-%d").tolist(),
        "predictions": predictions
    }
