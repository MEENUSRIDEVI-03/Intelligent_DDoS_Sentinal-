#!/bin/bash

# DDoS Sentinel Setup Script
# This script sets up the entire project

echo "🚀 Setting up DDoS Sentinel..."

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
cd backend
npm install --legacy-peer-deps
cp .env.example .env

echo "⚠️  Please edit backend/.env with your PostgreSQL connection"
echo "   DATABASE_URL=postgresql://user:password@localhost:5432/ddos_sentinel"
read -p "Press enter when ready..."

npm run db:generate
npm run db:migrate
npm run db:seed

# Frontend Setup
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend
npm install --legacy-peer-deps

# ML Service Setup
echo ""
echo "🐍 Setting up ML Service..."
cd ../ml-service
python -m venv venv

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    venv\Scripts\activate
else
    # Unix-like (macOS, Linux)
    source venv/bin/activate
fi

pip install -r requirements.txt
deactivate

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 To start developing:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Terminal 3 - ML Service:"
echo "  cd ml-service"
echo "  # Activate venv"
echo "  python main.py"
echo ""
echo "Then visit: http://localhost:3000"
echo "Demo credentials: test@example.com / password123"
