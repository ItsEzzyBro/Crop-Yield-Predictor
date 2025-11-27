import os
# Set environment variables for libomp (required for LightGBM on macOS)
os.environ['LDFLAGS'] = '-L/opt/homebrew/opt/libomp/lib'
os.environ['CPPFLAGS'] = '-I/opt/homebrew/opt/libomp/include'

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import warnings
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Enable CORS to allow frontend to communicate with backend

# Suppress version warnings when loading the pipeline
warnings.filterwarnings('ignore', category=UserWarning)

# Load the pipeline
try:
    pipeline = joblib.load('crop_yield_pipeline.pkl')
    print("✓ Pipeline loaded successfully!")
except ImportError as e:
    if 'lightgbm' in str(e).lower() or 'libomp' in str(e).lower():
        print("✗ Error: LightGBM requires libomp library.")
        print("  Please run: ./install_dependencies.sh")
        print("  Or manually install: brew install libomp")
    else:
        print(f"✗ Import error: {e}")
    pipeline = None
except Exception as e:
    error_msg = str(e)
    if 'libomp' in error_msg.lower():
        print("✗ Error: LightGBM requires libomp library.")
        print("  Please run: ./install_dependencies.sh")
        print("  Or manually install: brew install libomp")
    else:
        print(f"✗ Error loading pipeline: {e}")
    pipeline = None

# Define encoders for categorical features
encoders = {
    'Region': {
        'East': 0, 'North': 1, 'South': 2, 'West': 3
    },
    'Soil_Type': {
        'Chalky': 0, 'Clay': 1, 'Loam': 2, 'Peaty': 3, 'Sandy': 4, 'Silt': 5
    },
    'Crop': {
        'Barley': 0, 'Cotton': 1, 'Maize': 2, 'Rice': 3, 'Soybean': 4, 'Wheat': 5
    },
    'Fertilizer_Used': {
        'False': 0, 'True': 1
    },
    'Irrigation_Used': {
        'False': 0, 'True': 1
    },
    'Weather_Condition': {
        'Cloudy': 0, 'Rainy': 1, 'Sunny': 2
    }
}

# Categorical features
cate_feat = ['Region', 'Soil_Type', 'Crop', 'Fertilizer_Used', 'Irrigation_Used', 'Weather_Condition']

# Expected column order (based on training data)
expected_columns = ['Region', 'Soil_Type', 'Crop', 'Rainfall_mm', 'Temperature_Celsius', 
                    'Fertilizer_Used', 'Irrigation_Used', 'Weather_Condition', 'Days_to_Harvest']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if pipeline is None:
            return jsonify({
                'success': False,
                'error': 'Pipeline not loaded. Please check the server logs.'
            }), 500
        
        # Get data from request
        data = request.json
        
        # Create DataFrame
        data_point = {
            "Region": data['Region'],
            "Soil_Type": data['Soil_Type'],
            "Crop": data['Crop'],
            "Rainfall_mm": float(data['Rainfall_mm']),
            "Temperature_Celsius": float(data['Temperature_Celsius']),
            "Fertilizer_Used": data['Fertilizer_Used'],
            "Irrigation_Used": data['Irrigation_Used'],
            "Weather_Condition": data['Weather_Condition'],
            "Days_to_Harvest": int(data['Days_to_Harvest'])
        }
        
        true_x = pd.DataFrame([data_point])
        
        # Encode categorical features manually
        for col in cate_feat:
            if col in true_x.columns:
                true_x[col] = true_x[col].map(encoders[col])
        
        # Reorder columns to match training data (if needed)
        # Ensure all expected columns are present
        for col in expected_columns:
            if col not in true_x.columns:
                raise ValueError(f"Missing column: {col}")
        
        # Reorder columns to match training data
        true_x = true_x[expected_columns]
        
        # Make prediction
        y_pred = pipeline.predict(true_x)
        
        return jsonify({
            'success': True,
            'prediction': float(y_pred[0]),
            'message': f'Predicted yield: {y_pred[0]:.2f} tons per hectare'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    # Use port from environment variable or default to 5001
    # Port 5001 avoids conflict with macOS AirPlay on port 5000
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port, host='127.0.0.1')

