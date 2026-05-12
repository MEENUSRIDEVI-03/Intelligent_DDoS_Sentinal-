from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os

app = FastAPI(title="DDoS ML Service", version="1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TrafficData(BaseModel):
    sourceIp: str
    packetCount: int
    byteCount: int
    protocol: str
    port: int = 80

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float

# Global model
model = None
scaler = StandardScaler()
class_mapping = {0: "normal", 1: "suspicious", 2: "high_risk", 3: "ddos_attack"}

def train_model():
    """Train a simple Random Forest model with mock data"""
    global model, scaler
    
    # Generate mock training data
    n_samples = 1000
    X = np.random.rand(n_samples, 4)  # 4 features: normalized packet count, byte count, protocol, port
    
    # Create labels: 70% normal, 15% suspicious, 10% high_risk, 5% ddos_attack
    y = np.random.choice([0, 1, 2, 3], n_samples, p=[0.7, 0.15, 0.1, 0.05])
    
    # Scale data
    X_scaled = scaler.fit_transform(X)
    
    # Train model
    model = RandomForestClassifier(n_estimators=10, random_state=42, max_depth=10)
    model.fit(X_scaled, y)
    
    print("✅ ML Model trained successfully")

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    train_model()

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "model": "Ready" if model is not None else "Not ready",
        "timestamp": str(np.datetime64('now'))
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: TrafficData):
    """Make a prediction on traffic data"""
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not ready")
        
        # Extract protocol number
        protocol_map = {"TCP": 1, "UDP": 2, "ICMP": 3}
        protocol_num = protocol_map.get(data.protocol, 1)
        
        # Normalize features
        packet_normalized = min(data.packetCount / 1000, 1.0)  # Normalize to 0-1
        byte_normalized = min(data.byteCount / 100000, 1.0)    # Normalize to 0-1
        protocol_normalized = protocol_num / 3.0
        port_normalized = min(data.port / 65535, 1.0)
        
        features = np.array([[packet_normalized, byte_normalized, protocol_normalized, port_normalized]])
        features_scaled = scaler.transform(features)
        
        # Get prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = float(max(probabilities))
        
        return PredictionResponse(
            prediction=class_mapping[prediction],
            confidence=confidence
        )
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train():
    """Retrain the model"""
    try:
        train_model()
        return {"message": "Model retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
