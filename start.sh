#!/bin/bash

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:$port)
    if [ -n "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)..."
        kill -9 $pid
    fi
}

echo "=== DASHBOARD CENTRAL STARTUP ==="

# 1. Cleanup
echo "[1/4] Cleaning up ports..."
kill_port 3000
kill_port 3001

# 2. Reset Database (Interactive check could be added, but per plan we force it for now or make it a separate step. 
# For now, let's run it to ensure clean slate as requested)
echo "[2/4] Resetting Database..."
node backend/reset_db.js

# 3. Start Backend
echo "[3/4] Starting Backend..."
cd backend
# Use nohup, redirect both stdout and stderr, and detach
nohup node_modules/.bin/ts-node src/index.ts > backend.log 2>&1 &
BACKEND_PID=$!
disown $BACKEND_PID
echo "Backend started (PID: $BACKEND_PID). Logs in backend/backend.log"
cd ..

# Wait for Backend to be ready (simple sleep for now)
echo "Waiting for backend to initialize..."
sleep 5

# 4. Start Frontend
echo "[4/4] Starting Frontend..."
cd frontend
npm run dev
