@echo off
echo ========================================
echo Starting Event Invite Development Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Docker...
docker ps -q -f name=event-invite-db >nul 2>&1
if errorlevel 1 (
    echo Starting Docker containers...
    docker-compose up -d mysql adminer
    echo Waiting for MySQL to be ready...
    timeout /t 10
) else (
    echo Docker MySQL is already running.
)

echo.
echo ========================================
echo Starting Server (Port 10001)
echo ========================================
start "Event Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3

echo.
echo ========================================
echo Starting Client (Port 10000)
echo ========================================
start "Event Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Server: http://localhost:10001
echo Client: http://localhost:10000
echo Adminer: http://localhost:10003
echo.
echo Press any key to exit...
pause >nul
