#!/bin/bash
# Script to generate a testing invite token (Requires Backend running on port 3001)

# 1. Login as Admin to get Token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Error: Failed to login as Admin. Check backend status."
  exit 1
fi

echo "Admin Logged In. Generating Invite..."

# 2. Generate Invite
INVITE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/invite/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"novo_usuario@teste.com","role":"VIEWER"}')

LINK=$(echo $INVITE_RESPONSE | grep -o '"link":"[^"]*' | cut -d'"' -f4)

if [ -z "$LINK" ]; then
    echo "Error generating invite. Response: $INVITE_RESPONSE"
else
    echo ""
    echo "✅ CONVITE GERADO COM SUCESSO!"
    echo "---------------------------------------------------"
    echo "Acesse este link no navegador para testar o cadastro:"
    echo "$LINK"
    echo "---------------------------------------------------"
fi
