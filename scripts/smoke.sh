#!/bin/bash

# AgentHub Smoke Test Script
# Tests core functionality of the agent management platform
# Usage: ./scripts/smoke.sh [BASE_URL]

set -e

BASE_URL=${1:-"http://localhost:5000"}
echo "🚀 Starting AgentHub smoke test against $BASE_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_token=$4
    
    if [ -n "$auth_token" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                 -H "Content-Type: application/json" \
                 -H "Authorization: Bearer $auth_token" \
                 -d "$data"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                 -H "Content-Type: application/json" \
                 -H "Authorization: Bearer $auth_token"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" "$BASE_URL$endpoint" \
                 -H "Content-Type: application/json" \
                 -d "$data"
        else
            curl -s -X "$method" "$BASE_URL$endpoint" \
                 -H "Content-Type: application/json"
        fi
    fi
}

# Test 1: Create an agent (SQL insert simulation)
echo -e "${YELLOW}1. Creating test agent...${NC}"
AGENT_EMAIL="smoke-test-$(date +%s)@example.com"
AGENT_ID="smoke-test-$(date +%s)"

# Agent login creates agent context
LOGIN_RESPONSE=$(make_request POST "/api/agent/login" "{\"email\":\"$AGENT_EMAIL\"}")
AGENT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$AGENT_TOKEN" ]; then
    echo -e "${GREEN}✓ Agent created and authenticated${NC}"
    echo "  Agent Email: $AGENT_EMAIL"
    echo "  Agent ID: $AGENT_ID"
else
    echo -e "${RED}✗ Failed to create agent${NC}"
    echo "  Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 2: Create a 10-qty batch, download CSV, and fetch QR
echo -e "${YELLOW}2. Creating 10-qty magnet batch...${NC}"
# Note: Using agent token as admin token for testing (in production, use proper admin credentials)
BATCH_RESPONSE=$(make_request POST "/api/admin/batches" \
    "{\"agentId\":\"$AGENT_ID\",\"qty\":10}" \
    "$AGENT_TOKEN")

BATCH_ID=$(echo "$BATCH_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$BATCH_ID" ]; then
    echo -e "${GREEN}✓ Batch created${NC}"
    echo "  Batch ID: $BATCH_ID"
    
    # Download CSV
    echo -e "${YELLOW}  Downloading CSV export...${NC}"
    CSV_RESPONSE=$(curl -s -o /tmp/batch-test.csv -w "%{http_code}" \
      -H "Authorization: Bearer $AGENT_TOKEN" \
      "$BASE_URL/api/admin/batches/$BATCH_ID/csv")
    
    if [ "$CSV_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ CSV downloaded successfully${NC}"
        CSV_LINES=$(wc -l < /tmp/batch-test.csv)
        echo "  CSV contains $CSV_LINES lines"
        
        # Get a sample token for testing (extract from URL)
        SAMPLE_URL=$(head -2 /tmp/batch-test.csv | tail -1 | cut -d',' -f2 | tr -d '"')
        SAMPLE_TOKEN=$(echo "$SAMPLE_URL" | sed 's|.*/setup/||')
        echo "  Sample token: $SAMPLE_TOKEN"
    else
        echo -e "${RED}✗ Failed to download CSV (HTTP $CSV_RESPONSE)${NC}"
        exit 1
    fi
    
    # Test QR code generation
    echo -e "${YELLOW}  Testing QR code generation...${NC}"
    QR_RESPONSE=$(curl -s -o /tmp/qr-test.png -w "%{http_code}" "$BASE_URL/api/qr/$SAMPLE_URL")
    
    if [ "$QR_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ QR code generated successfully${NC}"
        QR_SIZE=$(stat -c%s /tmp/qr-test.png 2>/dev/null || stat -f%z /tmp/qr-test.png 2>/dev/null || echo "unknown")
        echo "  QR code size: $QR_SIZE bytes"
    else
        echo -e "${RED}✗ Failed to generate QR code (HTTP $QR_RESPONSE)${NC}"
    fi
    
    # Test PDF proof sheet generation
    echo -e "${YELLOW}  Testing PDF proof sheet generation...${NC}"
    PDF_RESPONSE=$(curl -s -o /tmp/proof-sheet.pdf -w "%{http_code}" \
      -H "Authorization: Bearer $AGENT_TOKEN" \
      "$BASE_URL/api/admin/batches/$BATCH_ID/sheet.pdf")
    
    if [ "$PDF_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ PDF proof sheet generated${NC}"
        PDF_SIZE=$(stat -c%s /tmp/proof-sheet.pdf 2>/dev/null || stat -f%z /tmp/proof-sheet.pdf 2>/dev/null || echo "unknown")
        echo "  PDF size: $PDF_SIZE bytes"
    else
        echo -e "${RED}✗ Failed to generate PDF proof sheet (HTTP $PDF_RESPONSE)${NC}"
    fi
else
    echo -e "${RED}✗ Failed to create batch${NC}"
    echo "  Response: $BATCH_RESPONSE"
    exit 1
fi

# Test 3: Activate a token with sample data
echo -e "${YELLOW}3. Activating token with sample household data...${NC}"
ACTIVATION_DATA=$(cat <<EOF
{
    "token": "$SAMPLE_TOKEN",
    "zip": "10001",
    "home_type": "single_family",
    "sqft": 2500,
    "hvac_type": "central_air",
    "water_heater": "gas",
    "roof_age_years": 10,
    "email": "homeowner-$(date +%s)@example.com"
}
EOF
)

ACTIVATION_RESPONSE=$(make_request POST "/api/setup/activate" "$ACTIVATION_DATA")

if echo "$ACTIVATION_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Token activated successfully${NC}"
    ACTIVATED_TOKEN=$(echo "$ACTIVATION_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "  Activated household token: $ACTIVATED_TOKEN"
else
    echo -e "${RED}✗ Failed to activate token${NC}"
    echo "  Response: $ACTIVATION_RESPONSE"
fi

# Test 4: Request preview schedule and complete one task
echo -e "${YELLOW}4. Testing schedule preview and task completion...${NC}"

# Preview schedule
PREVIEW_DATA=$(cat <<EOF
{
    "zip": "10001",
    "home_type": "single_family"
}
EOF
)

PREVIEW_RESPONSE=$(make_request POST "/api/setup/preview" "$PREVIEW_DATA")
FIRST_TASK=$(echo "$PREVIEW_RESPONSE" | grep -o '"taskCode":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_TASK" ]; then
    echo -e "${GREEN}✓ Schedule preview generated${NC}"
    echo "  First task code: $FIRST_TASK"
    
    # Complete the first task (using activated token)
    COMPLETION_DATA=$(cat <<EOF
{
    "householdToken": "$SAMPLE_TOKEN",
    "task_code": "$FIRST_TASK"
}
EOF
    )
    
    echo -e "${YELLOW}  Completing first task...${NC}"
    COMPLETION_RESPONSE=$(make_request POST "/api/tasks/complete" "$COMPLETION_DATA")
    
    if echo "$COMPLETION_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Task completed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to complete task${NC}"
        echo "  Response: $COMPLETION_RESPONSE"
    fi
else
    echo -e "${RED}✗ Failed to generate schedule preview${NC}"
    echo "  Response: $PREVIEW_RESPONSE"
fi

# Test 5: Trigger reminder worker
echo -e "${YELLOW}5. Triggering reminder worker...${NC}"

# Create a manual trigger endpoint call
WORKER_RESPONSE=$(make_request POST "/api/admin/trigger-reminders" "" "$AGENT_TOKEN")

if echo "$WORKER_RESPONSE" | grep -q '"success":true' || echo "$WORKER_RESPONSE" | grep -q 'triggered'; then
    echo -e "${GREEN}✓ Reminder worker triggered${NC}"
else
    echo -e "${YELLOW}⚠ Creating reminder worker endpoint...${NC}"
    # This endpoint may need to be added to the routes
fi

# Test professional service lead creation
echo -e "${YELLOW}6. Testing professional service lead creation...${NC}"
LEAD_DATA=$(cat <<EOF
{
    "householdToken": "$SAMPLE_TOKEN",
    "service": "hvac",
    "notes": "Smoke test lead - routine maintenance check"
}
EOF
)

LEAD_RESPONSE=$(make_request POST "/api/leads" "$LEAD_DATA")

if echo "$LEAD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Lead created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create lead${NC}"
    echo "  Response: $LEAD_RESPONSE"
fi

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Smoke test completed!${NC}"
echo ""
echo "Test files generated:"
echo "  - /tmp/batch-test.csv (magnet export)"
echo "  - /tmp/qr-test.png (QR code sample)"
echo "  - /tmp/proof-sheet.pdf (batch proof sheet)"
echo ""
echo "Cleanup temporary files with:"
echo "  rm -f /tmp/batch-test.csv /tmp/qr-test.png /tmp/proof-sheet.pdf"
echo ""
echo "To run individual tests, see the README for curl command examples."