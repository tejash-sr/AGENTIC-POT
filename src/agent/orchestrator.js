/**
 * Agent Orchestrator - STATE OF THE ART VERSION
 * HCL GUVI Buildathon - Competition Winning
 * 
 * Integrates the Conversation Brain for:
 * 1. Intelligent REAL vs SCAM differentiation
 * 2. Natural human-like responses to ANY message
 * 3. Contextual memory and conversation flow
 * 4. Emotional intelligence and adaptive behavior
 * 5. Strategic information extraction from scammers
 */

const { ConversationBrain } = require('./brain');

class AgentOrchestrator {
  constructor(config = {}) {
    this.brain = new ConversationBrain();
    this.sessionBrains = new Map(); // Per-session brain instances
    this.conversationContext = new Map();
    this.usedResponses = new Set();
  }

  /**
   * Get or create brain for session
   */
  getBrainForSession(sessionId) {
    if (!this.sessionBrains.has(sessionId)) {
      this.sessionBrains.set(sessionId, new ConversationBrain());
    }
    return this.sessionBrains.get(sessionId);
  }

  /**
   * Get the default persona configuration
   */
  getDefaultPersona() {
    return {
      name: 'Priya Sharma',
      age: 28,
      occupation: 'Software Engineer',
      location: 'Mumbai, Andheri',
      personality: {
        warmth: 0.75,
        skepticism: 0.55,
        curiosity: 0.85,
        patience: 0.65,
        busyness: 0.70
      }
    };
  }

  /**
   * Get the prompt for a specific state
   */
  getStatePrompt(state, context = {}) {
    return `State: ${state}, ScamType: ${context.scamType || 'unknown'}`;
  }

  /**
   * MAIN RESPONSE GENERATION - Intelligent and Contextual
   */
  async generateResponse(prompt, context) {
    const sessionId = context.sessionId || 'default';
    const brain = this.getBrainForSession(sessionId);
    
    const state = context.state || 'GREETING';
    const lastMessage = context.lastScammerMessage || '';
    const turnCount = context.turnCount || 1;
    const conversationHistory = context.conversationHistory || [];
    const detectionResult = context.detectionResult || {};
    
    // Step 1: Classify the message (REAL vs SCAM)
    const classification = brain.classifyMessage(
      lastMessage, 
      conversationHistory,
      detectionResult
    );
    
    // Step 2: Analyze emotional context
    const emotionalContext = brain.analyzeEmotionalContext(lastMessage);
    
    // Step 3: Update brain's emotional state
    brain.updateEmotionalState(classification, emotionalContext);
    
    // Step 4: Generate intelligent human response
    let response = brain.generateHumanResponse(
      lastMessage,
      classification,
      emotionalContext,
      turnCount,
      context.sessionMemory || {}
    );
    
    // Step 5: Ensure uniqueness
    response = this.ensureUnique(response, sessionId, lastMessage);
    
    // Step 6: Apply response enhancement for scam scenarios
    if (classification.isScam && classification.confidence > 0.6) {
      response = this.enhanceForExtraction(response, lastMessage, turnCount);
    }
    
    return response;
  }

  /**
   * Enhance response for better intelligence extraction
   */
  enhanceForExtraction(response, message, turnCount) {
    // If response doesn't already ask for details, add extraction
    const asksForDetails = /what's your|tell me your|give me|share your|your name|employee id|upi|account/i.test(response);
    
    if (!asksForDetails && turnCount > 1 && Math.random() > 0.5) {
      const extractionAddons = [
        " Also, what's your name for my records?",
        " And what's your employee ID?",
        " One more thing - which branch are you from?",
        " BTW what's your direct number?",
        " And your official email ID?"
      ];
      response += this.pickRandom(extractionAddons);
    }
    
    return response;
  }

  /**
   * Ensure we don't repeat exact responses in a session
   */
  ensureUnique(response, sessionId, message) {
    const key = `${sessionId}:${response}`;
    
    if (this.usedResponses.has(key)) {
      // Generate variation
      response = this.addVariation(response);
    }
    
    this.usedResponses.add(key);
    
    // Clean up old entries (keep last 50)
    if (this.usedResponses.size > 50) {
      const arr = Array.from(this.usedResponses);
      this.usedResponses = new Set(arr.slice(-30));
    }
    
    return response;
  }

  /**
   * Add variation to prevent exact duplicates
   */
  addVariation(response) {
    const prefixes = [
      "Actually, ",
      "Wait, ",
      "One thing - ",
      "Hmm, ",
      "See, ",
      "Listen, ",
      "Sorry but "
    ];
    
    const suffixes = [
      " Please clarify.",
      " I need to understand this.",
      " Tell me clearly.",
      " Just checking.",
      " Help me understand.",
      " Explain again please."
    ];
    
    if (Math.random() > 0.5) {
      const prefix = this.pickRandom(prefixes);
      return prefix + response.charAt(0).toLowerCase() + response.slice(1);
    } else {
      const suffix = this.pickRandom(suffixes);
      return response.replace(/[.!?]$/, '.') + suffix;
    }
  }

  /**
   * Handle out-of-context or unexpected messages
   */
  handleUnexpectedMessage(message, state, turnCount) {
    const lowerMsg = message.toLowerCase();
    
    // Random topics
    if (/weather|rain|hot|cold|sunny/i.test(lowerMsg)) {
      return "Haha yes, the weather has been crazy! But anyway, what were we discussing about?";
    }
    
    if (/food|eat|lunch|dinner|hungry/i.test(lowerMsg)) {
      return "Oh I just had lunch actually! But tell me, what was that thing you were explaining earlier?";
    }
    
    if (/cricket|match|india|ipl/i.test(lowerMsg)) {
      return "Arrey don't get me started on cricket! But wait, what about that important thing you mentioned?";
    }
    
    // Completely random
    const responses = [
      "Haha okay! But coming back to what you were saying earlier...",
      "That's interesting! But wait, I want to understand that other thing properly.",
      "Nice nice! But tell me more about what you called for?",
      "Accha! But let's continue with what we were discussing na?"
    ];
    
    return this.pickRandom(responses);
  }

  /**
   * Generate fallback response
   */
  getFallbackResponse(state, consecutiveFallbacks) {
    const fallbacks = [
      "Sorry, I got distracted by a work call. What were you saying?",
      "Oops, my phone lagged! Can you repeat that please?",
      "One second, someone was at the door. Okay I'm back - continue?",
      "Sorry sorry, network issue. Please say that again?",
      "Hey sorry, I was multitasking. What did you say?",
      "Arrey my internet is slow today! What were you explaining?"
    ];
    
    if (consecutiveFallbacks >= 3) {
      return "Look, I really need to go now. Can you WhatsApp me all the details? I'll check later.";
    }
    
    return fallbacks[consecutiveFallbacks % fallbacks.length];
  }

  /**
   * Get responses for a specific state (backwards compatibility)
   */
  getResponsesForState(state) {
    const brain = new ConversationBrain();
    return [brain.generateHumanResponse('', { isScam: false, confidence: 0 }, {}, 1, {})];
  }

  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Clear session brain (for cleanup)
   */
  clearSession(sessionId) {
    this.sessionBrains.delete(sessionId);
  }
}

module.exports = { AgentOrchestrator };
