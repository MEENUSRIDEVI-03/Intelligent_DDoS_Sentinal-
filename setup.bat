@echo off
REM DDoS Sentinel Setup Script for Windows

echo.
echo Updating frontend package.json to use tailwindcss-animate...
cd frontend
npm install --save-dev tailwindcss-animate@latest
cd ..

echo.
echo ✅ Setup initialization complete!
echo.
echo 🎉 To start developing:
echo.
echo Terminal 1 - Backend:
echo   cd backend && npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend && npm run dev  
echo.
echo Terminal 3 - ML Service:
echo   cd ml-service
echo   python -m venv venv
echo   venv\Scripts\activate
echo   pip install -r requirements.txt
echo   python main.py
echo.
echo Then visit: http://localhost:3000
echo Demo credentials: test@example.com / password123
