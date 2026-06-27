#!/bin/bash
# start_servers.sh

# Get absolute path to this script's directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
NODE_BIN="$ROOT_DIR/node-tmp/bin"

# Add local node to PATH
export PATH="$NODE_BIN:$PATH"

echo "Using Node from: $NODE_BIN"
node -v
npm -v

# Start Backend
echo "🚀 Starting Backend (FastAPI)..."
nohup "$ROOT_DIR/.venv/bin/python" "$ROOT_DIR/backend/api.py" > "$ROOT_DIR/backend_server.log" 2>&1 &
echo $! > "$ROOT_DIR/backend.pid"

# Start Frontend
echo "🚀 Starting Frontend (React/Vite)..."
cd "$ROOT_DIR/frontend"
nohup "$NODE_BIN/npm" run dev -- --host 0.0.0.0 > "$ROOT_DIR/frontend/frontend_server.log" 2>&1 &
echo $! > "$ROOT_DIR/frontend.pid"

echo "✅ Servers triggered in background."
echo "   Backend Log: backend_server.log"
echo "   Frontend Log: frontend/frontend_server.log"
