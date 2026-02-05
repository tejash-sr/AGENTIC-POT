# 🍯 Agentic Honey-Pot for Scam Detection & Intelligence Extraction

**HCL GUVI Buildathon Submission**

An AI-powered autonomous agent system that detects scam messages, engages scammers in believable conversations, and extracts actionable intelligence without revealing detection.

---

## 🎯 Problem Statement

Online scams (bank fraud, UPI fraud, phishing, fake offers) are becoming increasingly adaptive. This system acts as an intelligent honeypot that:

1. **Detects** scam intent in incoming messages
2. **Engages** scammers autonomously with a believable human persona
3. **Extracts** valuable intelligence (UPI IDs, bank accounts, phone numbers, URLs)
4. **Reports** findings to the GUVI evaluation endpoint

---

## ✨ Key Features

### 🔍 Advanced Scam Detection
- **70+ scam patterns** optimized for Indian market scams
- KYC fraud, UPI scams, OTP theft, bank impersonation, lottery scams
- Urgency detection and escalation tracking
- Multi-turn conversation analysis

### 🎭 Believable Human Persona
- Natural Indian English with Hindi words (arrey, accha, theek hai)
- Context-aware responses based on conversation state
- Appropriate skepticism without revealing detection
- Work/life distractions for natural stalling

### 📊 Intelligence Extraction
- UPI IDs (all major Indian banks)
- Phone numbers (+91 format)
- Bank account numbers with IFSC
- Phishing URLs and shortened links
- Cryptocurrency addresses
- Names and organization details

### 🔐 Security & Safety
- API key authentication
- Response validation to prevent AI detection
- Forbidden phrase filtering
- Graceful error handling

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Clone or download the project
cd "agentic pot"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set your API_KEY

# Start the server
npm start
```

### Environment Variables

Create a `.env` file:

```env
# Required: Set your own secret API key
API_KEY=your-secret-api-key-here

# Optional
PORT=3000
LOG_LEVEL=info
```

---

## 📡 API Documentation

### Authentication

All API requests must include the `x-api-key` header:

```
x-api-key: YOUR_SECRET_API_KEY
Content-Type: application/json
```

### Main Endpoint

**POST** `/api/honeypot`

Process incoming scam messages and generate intelligent responses.

#### Request Format

```json
{
  "sessionId": "unique-session-id",
  "message": {
    "sender": "scammer",
    "text": "Your bank account will be blocked today. Verify immediately.",
    "timestamp": 1770005528731
  },
  "conversationHistory": [],
  "metadata": {
    "channel": "SMS",
    "language": "English",
    "locale": "IN"
  }
}
```

#### Response Format

```json
{
  "status": "success",
  "reply": "Wait, what's happening to my account? Which bank is this?"
}
```

### Multi-Turn Conversations

For follow-up messages, include the conversation history:

```json
{
  "sessionId": "same-session-id",
  "message": {
    "sender": "scammer",
    "text": "Share your UPI ID to avoid suspension",
    "timestamp": 1770005530000
  },
  "conversationHistory": [
    {
      "sender": "scammer",
      "text": "Your bank account will be blocked today.",
      "timestamp": 1770005528731
    },
    {
      "sender": "user",
      "text": "Wait, what's happening to my account?",
      "timestamp": 1770005529000
    }
  ]
}
```

### Health Check

**GET** `/health`

```json
{
  "status": "healthy",
  "timestamp": "2026-02-05T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Metrics

**GET** `/metrics`

Returns system performance metrics.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│  (Express.js + Authentication + Request Validation)             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   Scam Detection Engine                          │
│  • Rule-based patterns (70+)                                     │
│  • Keyword matching                                              │
│  • Behavioral analysis                                           │
│  • Context phrase detection                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   State Machine                                  │
│  INITIAL → GREETING → RAPPORT → FINANCIAL → REQUEST → EXTRACTION│
│                                          ↓                       │
│                                    CLOSING → ENDED               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                 Agent Orchestrator                               │
│  • Persona management (Priya Sharma)                            │
│  • Context-aware response generation                            │
│  • Natural language variations                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│              Intelligence Extraction                             │
│  • UPI IDs, Phone numbers, Bank accounts                        │
│  • URLs, Crypto addresses, Names                                │
│  • PAN, Aadhaar (with context validation)                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                Response Validation                               │
│  • Forbidden phrase filtering                                    │
│  • AI detection prevention                                       │
│  • Length constraints                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
agentic-honeypot/
├── src/
│   ├── index.js                 # Main entry point & API
│   ├── agent/
│   │   └── orchestrator.js      # Persona & response generation
│   ├── detection/
│   │   └── scam-detector.js     # Scam detection engine
│   ├── extraction/
│   │   └── extractor.js         # Intelligence extraction
│   ├── state/
│   │   └── machine.js           # Conversation state machine
│   ├── validation/
│   │   └── safety.js            # Response validation
│   └── utils/
│       └── metrics.js           # Metrics tracking
├── tests/
│   └── test-runner.js           # Test suite
├── docs/
│   └── DESIGN_DOCUMENT.md       # Detailed design specs
├── .env.example                 # Environment template
├── .env                         # Your configuration
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Test the API manually
curl -X POST http://localhost:3000/api/honeypot \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key" \
  -d '{
    "sessionId": "test-123",
    "message": {
      "sender": "scammer",
      "text": "Your KYC is expired. Update immediately or account will be blocked.",
      "timestamp": 1770005528731
    },
    "conversationHistory": []
  }'
```

---

## 🌐 Deployment

### Option 1: Railway / Render / Heroku

1. Push code to GitHub
2. Connect repository to platform
3. Set environment variables:
   - `API_KEY`: Your secret key
   - `PORT`: Usually auto-set
4. Deploy

### Option 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: VPS (Ubuntu)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd agentic-honeypot
npm install --production
cp .env.example .env
nano .env  # Set your API_KEY

# Run with PM2
npm install -g pm2
pm2 start src/index.js --name honeypot
pm2 save
pm2 startup
```

---

## 📊 GUVI Evaluation Callback

The system automatically sends intelligence to GUVI when:
- Scam is confirmed
- Conversation reaches CLOSING state
- Session times out with detected scam

Payload sent to `https://hackathon.guvi.in/api/updateHoneyPotFinalResult`:

```json
{
  "sessionId": "abc123-session-id",
  "scamDetected": true,
  "totalMessagesExchanged": 18,
  "extractedIntelligence": {
    "bankAccounts": ["XXXX-XXXX-XXXX"],
    "upiIds": ["scammer@upi"],
    "phishingLinks": ["http://malicious.example"],
    "phoneNumbers": ["+91XXXXXXXXXX"],
    "suspiciousKeywords": ["urgent", "verify now", "account blocked"]
  },
  "agentNotes": "Scam type: bank_fraud. Tactics: urgency, kyc. High confidence."
}
```

---

## 🏆 Scoring Optimization

The system is optimized for:

| Criteria | Optimization |
|----------|--------------|
| **Scam Detection Accuracy** | 70+ patterns, multi-signal detection |
| **Agentic Engagement Quality** | Natural persona, context-aware responses |
| **Intelligence Extraction** | Comprehensive patterns for Indian data |
| **API Stability** | Error handling, validation, fallbacks |
| **Ethical Behavior** | Safety filters, no real data exposure |

---

## 🔒 Security Considerations

- API key authentication required
- No real personal data stored
- Session cleanup after 30 minutes
- Response validation prevents AI detection
- No actual financial transactions

---

## 📝 License

MIT License - Built for HCL GUVI Buildathon 2026

---

## 👥 Team

Built with ❤️ for the HCL GUVI Buildathon

---

## 🆘 Troubleshooting

### API returns 401 Unauthorized
- Check `x-api-key` header is present
- Verify API key matches `.env` file

### API returns 400 Bad Request
- Ensure `sessionId` and `message.text` are provided
- Check JSON format is valid

### No response generated
- Check server logs for errors
- Verify all dependencies installed

### GUVI callback fails
- Non-blocking - doesn't affect main API
- Check network connectivity
- Callback URL may not be active yet
