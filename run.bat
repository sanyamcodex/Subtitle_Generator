@echo off
echo Starting Subtitle Generator...

echo Installing backend dependencies...
cd server
pip install -r requirements.txt
cd ..

echo Installing frontend dependencies...
cd client
npm install
cd ..

echo Starting backend server...
start cmd /k "cd server && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting frontend server...
start cmd /k "cd client && npm run dev"

echo.
echo Servers are starting up...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul