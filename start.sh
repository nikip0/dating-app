#!/bin/bash

# AI Dating Agent - Quick Start Script
# This script starts both backend and frontend servers

echo "🚀 Starting AI Dating Agent..."
echo ""

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

echo ""
echo "✅ Starting servers..."
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers using a process manager or tmux
# For simplicity, we'll use background processes with trap to kill on exit

trap 'kill $(jobs -p)' EXIT

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
