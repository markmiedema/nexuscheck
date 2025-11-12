#!/bin/bash
# Script to cleanly restart the backend server with VDA fixes

echo "=== Restarting Backend Server ==="
echo ""

# Kill all Python/uvicorn processes
echo "1. Killing all existing backend servers..."
pkill -9 -f "uvicorn app.main" 2>/dev/null
pkill -9 -f "python.*uvicorn" 2>/dev/null
sleep 2

# Verify they're dead
REMAINING=$(ps aux | grep -E "uvicorn|python.*app.main" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo "   WARNING: $REMAINING backend processes still running"
    ps aux | grep -E "uvicorn|python.*app.main" | grep -v grep
else
    echo "   ✓ All backend servers stopped"
fi

echo ""
echo "2. Starting fresh backend server..."
cd "/mnt/d/01 - Projects/SALT-Tax-Tool-Clean/backend"

# Start backend in background
venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "   ✓ Backend started (PID: $BACKEND_PID)"
echo ""
echo "3. Waiting for server to start..."
sleep 5

# Check if it's running
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "   ✓ Backend is running"
    echo ""
    echo "=== Backend Ready ==="
    echo ""
    echo "Server running on: http://localhost:8000"
    echo "API docs: http://localhost:8000/docs"
    echo "Process ID: $BACKEND_PID"
    echo ""
    echo "VDA fixes applied:"
    echo "  - Fixed 3 bugs in backend/app/api/v1/vda.py"
    echo "  - Fixed 2 bugs in backend/app/services/vda_calculator.py"
    echo "  - All queries now use .eq('id', analysis_id)"
    echo ""
    echo "To view logs:"
    echo "  tail -f backend.log"
    echo ""
    echo "To stop backend:"
    echo "  pkill -9 -f 'uvicorn app.main'"
else
    echo "   ✗ Backend failed to start!"
    echo ""
    echo "Check for errors in the backend directory"
    exit 1
fi
