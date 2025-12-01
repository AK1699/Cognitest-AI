#!/bin/bash

echo "=== Google SSO Troubleshooting ==="
echo ""

# Test 1: Backend health
echo "1. Testing backend health..."
if curl -s http://localhost:8000/api/docs > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    echo "   Run: cd backend && uvicorn app.main:app --reload"
    exit 1
fi

# Test 2: Google client ID endpoint
echo ""
echo "2. Testing Google client ID endpoint..."
RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/google/client-id 2>&1)
if echo "$RESPONSE" | grep -q "client_id"; then
    echo "   ✅ Google client ID endpoint working"
else
    echo "   ❌ Google client ID endpoint failed"
    echo "   Response: $RESPONSE"
fi

# Test 3: Google authorize endpoint
echo ""
echo "3. Testing Google authorize endpoint..."
RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/google/authorize 2>&1)
if echo "$RESPONSE" | grep -q "authorization_url"; then
    echo "   ✅ Google authorize endpoint working"
else
    echo "   ❌ Google authorize endpoint failed"
fi

# Test 4: Frontend health
echo ""
echo "4. Testing frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running"
else
    echo "   ⚠️  Frontend might not be running"
    echo "   Run: cd frontend && npm run dev"
fi

echo ""
echo "=== Test Complete ==="
