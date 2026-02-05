/**
 * Agentic Honey-Pot for Scam Detection & Intelligence Extraction
 * HCL GUVI Buildathon - Competition Ready
 * 
 * This system receives incoming text messages from suspected scammers,
 * detects scam intent, maintains a believable human persona, extracts
 * actionable intelligence, and reports to GUVI evaluation endpoint.
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Import core components
const { ScamDetector } = require('./detection/scam-detector');
const { StateMachine, STATES } = require('./state/machine');
const { AgentOrchestrator } = require('./agent/orchestrator');
const { IntelligenceExtractor } = require('./extraction/extractor');
const { ResponseValidator } = require('./validation/safety');
const { MetricsTracker } = require('./utils/metrics');

// Configuration
const API_KEY = process.env.API_KEY || 'your-secret-api-key';
const GUVI_CALLBACK_URL = 'https://hackathon.guvi.in/api/updateHoneyPotFinalResult';
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize core components
const scamDetector = new ScamDetector();
const stateMachine = new StateMachine();
const agentOrchestrator = new AgentOrchestrator();
const intelligenceExtractor = new IntelligenceExtractor();
const responseValidator = new ResponseValidator();
const metricsTracker = new MetricsTracker();

// Session memory storage (in-memory for demo, use Redis in production)
const sessionMemory = new Map();

// Initialize Express app
const app = express();
app.use(express.json({ limit: '1mb' }));

// CORS support for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  logger.info('Incoming request', { 
    requestId, 
    method: req.method, 
    path: req.path,
    ip: req.ip
  });
  next();
});

/**
 * API Key Authentication Middleware
 */
const authenticateApiKey = (req, res, next) => {
  const providedApiKey = req.headers['x-api-key'];
  
  if (!providedApiKey) {
    logger.warn('Missing API key', { requestId: req.requestId });
    return res.status(401).json({
      status: 'error',
      message: 'Missing x-api-key header'
    });
  }
  
  if (providedApiKey !== API_KEY) {
    logger.warn('Invalid API key', { requestId: req.requestId });
    return res.status(403).json({
      status: 'error',
      message: 'Invalid API key'
    });
  }
  
  next();
};

/**
 * Root endpoint - Welcome page
 * GET /
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Agentic Honey-Pot API</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; color: #fff; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        h1 { font-size: 2.5rem; margin-bottom: 10px; }
        h1 span { color: #e94560; }
        .subtitle { color: #a0a0a0; margin-bottom: 40px; font-size: 1.1rem; }
        .status { background: #0f3460; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #00d9ff; }
        .status h2 { color: #00d9ff; margin-bottom: 15px; }
        .status-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1a4a7a; }
        .status-item:last-child { border-bottom: none; }
        .badge { background: #00ff88; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .endpoints { background: #0f3460; border-radius: 12px; padding: 25px; margin-bottom: 30px; }
        .endpoints h2 { color: #e94560; margin-bottom: 20px; }
        .endpoint { background: #16213e; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .endpoint:last-child { margin-bottom: 0; }
        .method { display: inline-block; background: #e94560; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; margin-right: 10px; }
        .method.get { background: #00d9ff; }
        .path { font-family: 'Courier New', monospace; color: #fff; }
        .desc { color: #a0a0a0; margin-top: 8px; font-size: 0.9rem; }
        .test-section { background: #0f3460; border-radius: 12px; padding: 25px; }
        .test-section h2 { color: #00ff88; margin-bottom: 15px; }
        pre { background: #16213e; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; }
        code { color: #00d9ff; }
        .note { background: #2a1a4a; border-left: 4px solid #e94560; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍯 Agentic <span>Honey-Pot</span></h1>
        <p class="subtitle">Scam Detection & Intelligence Extraction API - HCL GUVI Buildathon</p>
        
        <div class="status">
          <h2>📊 System Status</h2>
          <div class="status-item">
            <span>Server Status</span>
            <span class="badge">● Online</span>
          </div>
          <div class="status-item">
            <span>API Version</span>
            <span>1.0.0</span>
          </div>
          <div class="status-item">
            <span>Authentication</span>
            <span>x-api-key header required</span>
          </div>
          <div class="status-item">
            <span>Started At</span>
            <span>${new Date().toISOString()}</span>
          </div>
        </div>

        <div class="endpoints">
          <h2>🔌 API Endpoints</h2>
          <div class="endpoint">
            <span class="method">POST</span>
            <span class="path">/api/honeypot</span>
            <p class="desc">Main endpoint - Process incoming scam messages and generate intelligent responses</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/health</span>
            <p class="desc">Health check endpoint</p>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/metrics</span>
            <p class="desc">View system metrics and statistics</p>
          </div>
        </div>

        <div class="note">
          <strong>⚠️ Authentication Required:</strong> All API requests must include the <code>x-api-key</code> header.
        </div>

        <div class="test-section">
          <h2>🧪 API Request Format</h2>
          <p style="color: #a0a0a0; margin-bottom: 15px;">Send a POST request to /api/honeypot with:</p>
          <pre><code>{
  "sessionId": "wertyu-dfghj-ertyui",
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
}</code></pre>
          <p style="color: #a0a0a0; margin-top: 20px;">Response format:</p>
          <pre><code>{
  "status": "success",
  "reply": "Why is my account being suspended?"
}</code></pre>
        </div>
      </div>
    </body>
    </html>
  `);
});

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * Metrics endpoint
 * GET /metrics
 */
app.get('/metrics', (req, res) => {
  const metrics = metricsTracker.getMetrics();
  res.json(metrics);
});

/**
 * Main Honeypot API Endpoint
 * POST /api/honeypot
 * 
 * Accepts scam messages as per GUVI Buildathon specification
 */
app.post('/api/honeypot', authenticateApiKey, async (req, res) => {
  const startTime = Date.now();
  const requestId = req.requestId;
  
  try {
    // Validate request structure as per problem statement format
    const { sessionId, message, conversationHistory, metadata } = req.body;
    
    if (!sessionId || !message || !message.text) {
      logger.warn('Invalid request format', { requestId, body: req.body });
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request: sessionId and message.text are required'
      });
    }

    // Load or create session memory
    let session = sessionMemory.get(sessionId);
    if (!session) {
      session = createNewSession(sessionId, metadata);
      sessionMemory.set(sessionId, session);
      logger.info('New session created', { requestId, sessionId });
    }

    // Add incoming message to session
    const incomingMessage = {
      sender: message.sender || 'scammer',
      text: message.text,
      timestamp: message.timestamp || Date.now(),
      turn: session.messages.length + 1
    };
    session.messages.push(incomingMessage);
    session.totalMessagesExchanged++;

    // Include conversation history if provided (for multi-turn context)
    if (conversationHistory && conversationHistory.length > 0) {
      for (const histMsg of conversationHistory) {
        if (!session.conversationHistory.find(m => m.timestamp === histMsg.timestamp)) {
          session.conversationHistory.push(histMsg);
        }
      }
    }

    // Step 1: Scam Detection
    const previousMessages = session.messages
      .filter(m => m.sender === 'scammer')
      .map(m => m.text);
    
    const detectionResult = scamDetector.analyze(message.text, previousMessages);
    
    // Update session with detection results
    session.scamDetected = detectionResult.is_scam || session.scamDetected;
    session.scamConfidence = Math.max(session.scamConfidence, detectionResult.confidence);
    session.scamType = detectionResult.scam_type || session.scamType;

    // Step 2: Intelligence Extraction
    const extractionResult = intelligenceExtractor.extract(message.text, session.messages);
    updateIntelligence(session.extractedIntelligence, extractionResult, message.text);

    // Step 3: State Transition
    const stateContext = {
      scamConfidence: session.scamConfidence,
      turnCount: session.messages.length,
      hasFinancialContext: detectionResult.has_financial_context,
      hasDirectRequest: detectionResult.has_direct_request,
      extractionProgress: calculateExtractionProgress(session.extractedIntelligence),
      consecutiveDelays: session.consecutiveDelays,
      scammerTerminated: false
    };
    
    const stateTransition = stateMachine.transition(session.currentState, stateContext);
    session.previousState = session.currentState;
    session.currentState = stateTransition.next_state;

    // Step 4: Generate Agent Response
    let replyText;
    
    if (stateTransition.should_end) {
      // Conversation ending - send final callback to GUVI
      replyText = generateClosingMessage(session);
      session.ended = true;
      
      // Send mandatory callback to GUVI (non-blocking)
      sendGuviCallback(session).catch(err => {
        logger.error('Failed to send GUVI callback', { sessionId, error: err.message });
      });
    } else {
      // Generate contextual response
      replyText = await generateAgentResponse(session, detectionResult, stateTransition);
    }

    // Step 5: Validate Response Safety
    const validationResult = responseValidator.validate(replyText, session.currentState);
    if (!validationResult.is_valid) {
      logger.warn('Response blocked by safety filter', { requestId, sessionId });
      replyText = responseValidator.getFallbackResponse(session.currentState, session.consecutiveFallbacks);
      session.consecutiveFallbacks++;
    } else {
      replyText = validationResult.cleaned_response;
      session.consecutiveFallbacks = 0;
    }

    // Add agent response to session
    const agentMessage = {
      sender: 'user',
      text: replyText,
      timestamp: Date.now(),
      turn: session.messages.length + 1
    };
    session.messages.push(agentMessage);
    session.totalMessagesExchanged++;

    // Track stalling
    if (isStallingMessage(replyText)) {
      session.consecutiveDelays++;
    } else {
      session.consecutiveDelays = 0;
    }

    // Update metrics
    session.lastActivity = Date.now();
    session.engagementDurationMs += (Date.now() - startTime);

    // Record for metrics tracking
    metricsTracker.recordConversation({
      conversation_id: sessionId,
      metrics: {
        turn_count: session.messages.length,
        engagement_duration_ms: session.engagementDurationMs,
        extraction_score: calculateExtractionScore(session.extractedIntelligence),
        persona_consistency: 1.0
      },
      intelligence: {
        extracted: extractionResult.items,
        is_scam: session.scamDetected,
        scam_confidence: session.scamConfidence
      },
      state: { current: session.currentState }
    });

    // Log response details
    logger.info('Response generated', {
      requestId,
      sessionId,
      state: session.currentState,
      turnCount: session.messages.length,
      scamDetected: session.scamDetected,
      scamConfidence: session.scamConfidence.toFixed(2),
      latencyMs: Date.now() - startTime
    });

    // Return response in required format
    res.json({
      status: 'success',
      reply: replyText
    });

  } catch (error) {
    logger.error('Error processing request', {
      requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Also support /api/conversation for backward compatibility
app.post('/api/conversation', authenticateApiKey, async (req, res) => {
  // Transform the old format to new format if needed
  const { conversation_id, message: oldMessage, history } = req.body;
  
  if (conversation_id && oldMessage && oldMessage.content) {
    // Transform old format to new format
    req.body = {
      sessionId: conversation_id,
      message: {
        sender: oldMessage.sender || 'scammer',
        text: oldMessage.content,
        timestamp: Date.now()
      },
      conversationHistory: history || [],
      metadata: req.body.metadata || {}
    };
  }
  
  // Forward to main endpoint handler
  return app._router.handle(req, res, () => {});
});

/**
 * Create new session object
 */
function createNewSession(sessionId, metadata = {}) {
  return {
    sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: Date.now(),
    currentState: STATES.INITIAL,
    previousState: null,
    messages: [],
    conversationHistory: [],
    totalMessagesExchanged: 0,
    scamDetected: false,
    scamConfidence: 0,
    scamType: null,
    extractedIntelligence: {
      bankAccounts: [],
      upiIds: [],
      phishingLinks: [],
      phoneNumbers: [],
      suspiciousKeywords: [],
      names: [],
      organizations: []
    },
    metadata: {
      channel: metadata?.channel || 'Unknown',
      language: metadata?.language || 'English',
      locale: metadata?.locale || 'IN'
    },
    engagementDurationMs: 0,
    consecutiveDelays: 0,
    consecutiveFallbacks: 0,
    ended: false,
    agentNotes: ''
  };
}

/**
 * Update intelligence storage with extracted items
 */
function updateIntelligence(intelligence, extractionResult, messageText) {
  for (const item of extractionResult.items) {
    switch (item.type) {
      case 'upi':
        if (!intelligence.upiIds.includes(item.value)) {
          intelligence.upiIds.push(item.value);
        }
        break;
      case 'bank_account':
        if (!intelligence.bankAccounts.includes(item.value)) {
          intelligence.bankAccounts.push(item.value);
        }
        break;
      case 'url':
        if (!intelligence.phishingLinks.includes(item.value)) {
          intelligence.phishingLinks.push(item.value);
        }
        break;
      case 'phone':
        if (!intelligence.phoneNumbers.includes(item.value)) {
          intelligence.phoneNumbers.push(item.value);
        }
        break;
      case 'name':
        if (!intelligence.names.includes(item.value)) {
          intelligence.names.push(item.value);
        }
        break;
      case 'organization':
        if (!intelligence.organizations.includes(item.value)) {
          intelligence.organizations.push(item.value);
        }
        break;
    }
  }

  // Extract suspicious keywords
  const suspiciousPatterns = [
    /urgent/i, /immediately/i, /verify now/i, /account blocked/i,
    /suspended/i, /prize/i, /lottery/i, /winner/i, /kyc/i,
    /otp/i, /password/i, /click here/i, /limited time/i,
    /act now/i, /final warning/i, /last chance/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    const match = messageText.match(pattern);
    if (match && !intelligence.suspiciousKeywords.includes(match[0].toLowerCase())) {
      intelligence.suspiciousKeywords.push(match[0].toLowerCase());
    }
  }
}

/**
 * Calculate extraction progress
 */
function calculateExtractionProgress(intelligence) {
  const totalItems = 
    intelligence.bankAccounts.length +
    intelligence.upiIds.length +
    intelligence.phishingLinks.length +
    intelligence.phoneNumbers.length;
  return Math.min(totalItems / 5, 1.0);
}

/**
 * Calculate extraction score
 */
function calculateExtractionScore(intelligence) {
  let score = 0;
  score += intelligence.upiIds.length * 15;
  score += intelligence.bankAccounts.length * 20;
  score += intelligence.phishingLinks.length * 10;
  score += intelligence.phoneNumbers.length * 8;
  score += intelligence.suspiciousKeywords.length * 2;
  return Math.min(score / 100, 1.0);
}

/**
 * Generate contextual agent response
 */
async function generateAgentResponse(session, detectionResult, stateTransition) {
  const context = {
    state: stateTransition.next_state,
    scamType: detectionResult.scam_type,
    turnCount: session.messages.length,
    lastScammerMessage: session.messages.filter(m => m.sender === 'scammer').slice(-1)[0]?.text || '',
    extractedItems: Object.values(session.extractedIntelligence).flat().length,
    hasFinancialContext: detectionResult.has_financial_context,
    hasDirectRequest: detectionResult.has_direct_request
  };

  // Get state-specific prompt and generate response
  const prompt = agentOrchestrator.getStatePrompt(context.state, {
    scamType: context.scamType,
    extractionTargets: getExtractionTargets(session.extractedIntelligence),
    conversationContext: context
  });

  // Generate response based on state and context
  const response = await agentOrchestrator.generateResponse(prompt, context);
  return response;
}

/**
 * Get extraction targets (what intelligence we still need)
 */
function getExtractionTargets(intelligence) {
  const targets = [];
  if (intelligence.upiIds.length === 0) targets.push('UPI ID');
  if (intelligence.bankAccounts.length === 0) targets.push('Bank Account');
  if (intelligence.phoneNumbers.length === 0) targets.push('Phone Number');
  if (intelligence.phishingLinks.length === 0) targets.push('Website/URL');
  if (intelligence.names.length === 0) targets.push('Name');
  return targets;
}

/**
 * Generate closing message
 */
function generateClosingMessage(session) {
  const closingMessages = [
    "Thanks for all the information! I need to step away now but I'm really interested. Can we continue this later?",
    "This sounds great! I have a meeting soon but let me think about it and get back to you. Thanks for explaining everything!",
    "I appreciate you taking the time to explain this. I need to check with my family first. Can I reach out to you later?",
    "Wow, this is a lot to process! Let me do some research and get back to you. Thanks so much!",
    "I'm definitely interested but I need some time to think. Can we continue this conversation tomorrow?"
  ];
  return closingMessages[Math.floor(Math.random() * closingMessages.length)];
}

/**
 * Check if message is a stalling tactic
 */
function isStallingMessage(content) {
  const stallingPatterns = [
    /sorry.*busy/i,
    /let me (check|think|ask)/i,
    /need to (talk|discuss|ask)/i,
    /later|tomorrow/i,
    /work.*crazy/i,
    /meeting soon/i
  ];
  return stallingPatterns.some(p => p.test(content));
}

/**
 * Send mandatory callback to GUVI evaluation endpoint
 */
async function sendGuviCallback(session) {
  // Build agent notes based on session analysis
  const agentNotes = buildAgentNotes(session);
  
  const payload = {
    sessionId: session.sessionId,
    scamDetected: session.scamDetected,
    totalMessagesExchanged: session.totalMessagesExchanged,
    extractedIntelligence: {
      bankAccounts: session.extractedIntelligence.bankAccounts,
      upiIds: session.extractedIntelligence.upiIds,
      phishingLinks: session.extractedIntelligence.phishingLinks,
      phoneNumbers: session.extractedIntelligence.phoneNumbers,
      suspiciousKeywords: session.extractedIntelligence.suspiciousKeywords
    },
    agentNotes: agentNotes
  };

  logger.info('Sending GUVI callback', { 
    sessionId: session.sessionId, 
    scamDetected: session.scamDetected,
    totalMessages: session.totalMessagesExchanged,
    intelligenceCount: Object.values(session.extractedIntelligence).flat().length
  });

  try {
    const response = await axios.post(GUVI_CALLBACK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    logger.info('GUVI callback successful', { 
      sessionId: session.sessionId, 
      status: response.status 
    });
    
    return response.data;
  } catch (error) {
    logger.error('GUVI callback failed', { 
      sessionId: session.sessionId, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Build agent notes summarizing scammer behavior
 */
function buildAgentNotes(session) {
  const notes = [];
  
  if (session.scamType) {
    notes.push(`Scam type: ${session.scamType}`);
  }
  
  if (session.extractedIntelligence.suspiciousKeywords.length > 0) {
    notes.push(`Tactics used: ${session.extractedIntelligence.suspiciousKeywords.join(', ')}`);
  }
  
  if (session.scamConfidence > 0.8) {
    notes.push('High confidence scam detection');
  }
  
  const intelligence = session.extractedIntelligence;
  if (intelligence.upiIds.length > 0) {
    notes.push(`UPI IDs collected: ${intelligence.upiIds.length}`);
  }
  if (intelligence.phoneNumbers.length > 0) {
    notes.push(`Phone numbers collected: ${intelligence.phoneNumbers.length}`);
  }
  if (intelligence.phishingLinks.length > 0) {
    notes.push(`Phishing links detected: ${intelligence.phishingLinks.length}`);
  }
  
  notes.push(`Total engagement: ${session.totalMessagesExchanged} messages`);
  
  return notes.join('. ') || 'Scammer engaged in multi-turn conversation';
}

/**
 * Cleanup old sessions periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of sessionMemory) {
    if (now - session.lastActivity > maxAge) {
      // Send callback before cleanup if scam detected and not already ended
      if (session.scamDetected && !session.ended) {
        session.ended = true;
        sendGuviCallback(session).catch(() => {});
      }
      sessionMemory.delete(sessionId);
      logger.info('Session cleaned up', { sessionId });
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Agentic Honey-Pot started on port ${PORT}`);
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🍯 Agentic Honey-Pot API - HCL GUVI Buildathon             ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   API Endpoint: POST /api/honeypot                            ║
║   Health Check: GET /health                                   ║
║                                                               ║
║   Authentication: x-api-key header required                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
