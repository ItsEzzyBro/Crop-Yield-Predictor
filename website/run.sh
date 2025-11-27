#!/bin/bash

# Crop Yield Predictor - Web Server Startup Script
# This script starts the Flask web server

echo "🌾 Starting Crop Yield Predictor Web Server..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if the pipeline file exists
if [ ! -f "crop_yield_pipeline.pkl" ]; then
    echo "❌ Error: crop_yield_pipeline.pkl not found in the website directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to find an available port
find_available_port() {
    local port=$1
    while check_port $port; do
        port=$((port + 1))
    done
    echo $port
}

# Check if port 5001 is in use
PORT=5001
if check_port $PORT; then
    echo "⚠️  Port $PORT is already in use"
    
    # Try to find and kill Flask/app.py processes using this port
    echo "🔍 Looking for existing Flask server processes..."
    PID=$(lsof -ti:$PORT 2>/dev/null)
    
    if [ ! -z "$PID" ]; then
        # Check if it's a Python/Flask process
        if ps -p $PID -o comm= | grep -q python; then
            echo "🛑 Stopping existing Flask server (PID: $PID)..."
            kill $PID 2>/dev/null
            sleep 2
            
            # Check if port is now free
            if ! check_port $PORT; then
                echo "✓ Port $PORT is now available"
            else
                echo "⚠️  Port still in use, trying to find another port..."
                PORT=$(find_available_port $PORT)
                echo "✓ Using port $PORT instead"
            fi
        else
            echo "⚠️  Port is used by a non-Python process, finding another port..."
            PORT=$(find_available_port $PORT)
            echo "✓ Using port $PORT instead"
        fi
    else
        PORT=$(find_available_port $PORT)
        echo "✓ Using port $PORT instead"
    fi
else
    echo "✓ Port $PORT is available"
fi

echo ""
echo "✓ Starting Flask server on http://127.0.0.1:$PORT"
echo "✓ Press CTRL+C to stop the server"
echo ""

# Run the Flask app with the selected port
export PORT=$PORT
python3 app.py

