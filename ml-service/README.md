# DDoS ML Service

Simple machine learning microservice for DDoS detection using FastAPI.

## Setup

```bash
cd ml-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

## Running

```bash
python main.py
```

The service will start on `http://localhost:8000`

## Endpoints

- `GET /health` - Health check
- `POST /predict` - Make a prediction on traffic data
- `POST /train` - Retrain the model

## Example Usage

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceIp": "192.168.1.100",
    "packetCount": 500,
    "byteCount": 50000,
    "protocol": "TCP",
    "port": 80
  }'
```

## Model

Uses a Random Forest classifier with mock training data. The model classifies traffic as:
- `normal` - Normal traffic
- `suspicious` - Potentially suspicious traffic
- `high_risk` - High-risk traffic requiring attention
- `ddos_attack` - DDoS attack traffic
