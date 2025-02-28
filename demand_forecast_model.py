from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
import io
import base64
from keras.models import Model
from keras.layers import Input, Conv1D, TimeDistributed, AveragePooling1D
import plotly.graph_objects as go

app = Flask(__name__)
CORS(app)
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False
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

model_path = "C:\\Users\\vinuu\\Downloads\\project-bolt-sb1-x2aequj4\\project\\model_checkpoint.h5"  # Update with the correct path
model = load_model_with_custom_mse(model_path)

# Prepare input data

def prepare_data_for_prediction(start_date, end_date, item):
    future_dates = pd.date_range(start=start_date, end=end_date, freq='D')
    future_df = pd.DataFrame({'date': future_dates, 'item_name': item})
    x_future = np.array([
        future_df["date"].dt.year.values,
        future_df["date"].dt.month.values,
        future_df["date"].dt.day.values
    ]).T
    if x_future.shape[1] < 2:
        x_future = np.hstack([x_future, np.zeros((x_future.shape[0], 1))])
    x_future = np.expand_dims(x_future, axis=-1)
    x_future = np.expand_dims(x_future, axis=1)
    x_future = np.pad(x_future, ((0, 0), (0, 1), (0, 62), (0, 0)), mode='constant')
    return future_df, x_future

# Generate predictions
def forecast_sales(x_future):
    print(f"📊 Input shape for prediction: {x_future.shape}")
    predictions = model.predict(x_future)
    return predictions.flatten()


# Generate graph
def plot_forecast(future_df):
    fig = go.Figure()

    # Add line trace instead of dots
    fig.add_trace(go.Scatter(
        x=future_df['date'], 
        y=future_df['Predicted Sales'], 
        mode='lines', 
        name='Predicted Sales',
        line=dict(color='blue')
    ))

    fig.update_layout(
        title="Demand Forecast",
        xaxis_title="Date",
        yaxis_title="Sales Units",
        xaxis=dict(rangeslider=dict(visible=True)),  # Enable horizontal scrolling
        width=900,  # Limit width
        height=500
    )

    img = io.BytesIO()
    fig.write_image(img, format='png')  # Convert to image for API response
    img.seek(0)
    graph_url = base64.b64encode(img.getvalue()).decode()

    return graph_url


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        print("🔹 Received data:", data)  # Debugging print

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        start_date = data["startDate"]
        end_date = data["endDate"]
        item = data["item"]

        future_df, x_future = prepare_data_for_prediction(start_date, end_date, item)
        predictions = forecast_sales(x_future)
        future_df["Predicted Sales"] = predictions

        print("✅ Sending forecast:", future_df.to_dict(orient="records"))  # Debugging print

        response = {
            "predictions": future_df.to_dict(orient="records"),
            "graph": None  # Disable graph temporarily for testing
        }
        return jsonify(response), 200

    except Exception as e:
        print("❌ Error:", str(e))  # Debugging print
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
