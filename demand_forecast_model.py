'''
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import tensorflow as tf
from keras.models import Model
from keras.layers import Input, Conv1D, TimeDistributed, AveragePooling1D

app = Flask(__name__)
CORS(app)

# Load trained model at startup
def load_model_with_custom_mse(model_path):
    base_model = tf.keras.models.load_model(model_path, custom_objects={'mse': tf.keras.metrics.MeanSquaredError()})
    
    inputs = Input(shape=(2, 65, 1))
    x = TimeDistributed(Conv1D(filters=128, kernel_size=2, strides=1, padding="same"))(inputs)
    x = TimeDistributed(AveragePooling1D(pool_size=2, strides=1, padding="same"))(x)
    x = TimeDistributed(Conv1D(filters=1, kernel_size=1, strides=1, padding="same"))(x)

    outputs = base_model(x)
    model = Model(inputs, outputs)
    model.compile(loss='mse', metrics=['mse'])
    return model

# Update with the correct model path
model_path = "C:\\Users\\vinuu\\Downloads\\project-bolt-sb1-x2aequj4\\project\\model_checkpoint.h5"
model = load_model_with_custom_mse(model_path)

# Load historical data
data_csv = "formatted_data.csv"
historical_data = pd.read_csv(data_csv, parse_dates=["date"])

def prepare_data_for_prediction(start_date, end_date, item):
    future_dates = pd.date_range(start=start_date, end=end_date, freq='D')
    future_df = pd.DataFrame({'date': future_dates, 'item_name': item})

    # Extract features: (year, month, day)
    x_future = np.array([
        future_df["date"].dt.year.values,
        future_df["date"].dt.month.values,
        future_df["date"].dt.day.values
    ]).T
    
    if x_future.shape[1] < 2:
        x_future = np.hstack([x_future, np.zeros((x_future.shape[0], 1))])  

    # Reshape to match model input
    x_future = np.expand_dims(x_future, axis=-1)  
    x_future = np.expand_dims(x_future, axis=1)  
    x_future = np.pad(x_future, ((0, 0), (0, 1), (0, 62), (0, 0)), mode='constant')

    return future_df, x_future

def forecast_sales(x_future):
    print(f"📊 Input shape for prediction: {x_future.shape}")
    predictions = model.predict(x_future)
    return predictions.flatten()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        start_date = data["startDate"]
        end_date = data["endDate"]
        item = data["item"]

        # Ensure historical data is considered
        global historical_data
        item_data = historical_data[historical_data["item"] == item]

        future_df, x_future = prepare_data_for_prediction(start_date, end_date, item)
        predictions = forecast_sales(x_future)
        future_df["Predicted Sales"] = predictions
        print("Columns in historical_data:", historical_data.columns)
        print("🔍 Requested item:", repr(item))
        print("🔍 Unique items in historical_data:", historical_data["item"].unique())

        return jsonify({
            "predictions": future_df.to_dict(orient="records"),
        }), 200

    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
'''
import requests

url = "http://127.0.0.1:8000/predict/"
payload = {
    "category": "SEAFOOD",
    "date": "2025-03-18",
    "features": [0.1] * 63
}

response = requests.post(url, json=payload)
print(response.json())
