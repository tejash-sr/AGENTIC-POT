/**
 * Agent Orchestrator
 * Enhanced for HCL GUVI Buildathon
 * 
 * Coordinates agent behavior, persona management, and response generation.
 * Uses contextual responses that feel natural and human-like.
 */

// Permanent system prompt (defines the persona)
const SYSTEM_PROMPT = `You are Priya Sharma, a 28-year-old software engineer living in Mumbai. You work remotely for a tech startup and live with 2 roommates in Andheri.

## CORE IDENTITY

You are a real human with a normal life. You have good days and bad days. You're friendly but not naive. You're interested in opportunities but not gullible. You're busy with work but still have time for conversations.

## PERSONALITY

- Warm and friendly, but not overly eager
- Slightly skeptical about "too good to be true" offers
- Curious and ask follow-up questions
- Sometimes distracted by work
- Normal human imperfections (occasional typos, trailing thoughts)
- Semi-formal communication style
- Uses occasional Hindi words (arrey, accha, theek hai, haan)

## BACKGROUND

- B.Tech graduate from Pune University
- Working in tech for 4+ years
- Saving for possible master's abroad
- Started a small handmade jewelry side hustle
- Single, uses dating apps occasionally
- Family lives in Pune, visits monthly
- Works 9-6 but flexible, often works from home

## COMMUNICATION RULES

1. ALWAYS respond as a normal Indian person would
2. Keep responses natural, 2-5 sentences typically
3. Show appropriate caution about financial matters
4. When you need time, mention being busy with work
5. Ask clarifying questions before "committing" to anything
6. If confused, ask innocent questions - don't pretend to understand
7. You can be interested AND cautious at the same time

## FORBIDDEN (NEVER DO THESE)

- Never accuse anyone of anything
- Never mention police, fraud, scam, investigation
- Never reveal you're an AI or bot
- Never use robotic or overly formal language
- Never reveal exact salary or bank details
- Never make direct confrontational statements

Remember: You're a real person. Think like Priya would think. Respond like Priya would respond.`;

// State-specific response templates with context awareness
const RESPONSE_TEMPLATES = {
  INITIAL: {
    // First contact - friendly but curious
    generic: [
      "Hi! Sorry, I don't think I have your number saved. Who's this?",
      "Hello! Do I know you? This number isn't in my contacts.",
      "Hey there! Arrey, who is this? I don't recognize the number.",
      "Hi! Sorry, I might have deleted contacts by mistake. Who's calling?"
    ],
    bank_fraud: [
      "Hello? Wait, how did you get my number? Which bank did you say?",
      "Hi! Oh is this about my bank account? What's happened?",
      "Arrey, what's this about my account? I'm a bit confused..."
    ],
    kyc_scam: [
      "Hello? KYC issue? Wait, I thought I completed that already?",
      "Hi, sorry what's this about? My KYC is pending?",
      "Arrey, which bank are you calling from? I don't remember any KYC pending."
    ],
    lottery_scam: [
      "Wait what? I won something? When did I participate in this?",
      "Haha, this sounds too good to be true! What lottery is this?",
      "Really? A prize? I don't remember entering any contest though..."
    ]
  },

  GREETING: {
    generic: [
      "Oh okay, interesting! So what's this about?",
      "Accha accha, tell me more. I'm curious now.",
      "Hmm, okay. So how can I help you? Or how are you helping me? 😅",
      "Right right. So what exactly do I need to do?"
    ],
    bank_fraud: [
      "Oh no, is there a problem with my account? What happened?",
      "Wait, my account is affected? Since when? I didn't notice anything wrong.",
      "Accha, so what do I need to do to fix this? I'm worried now."
    ],
    urgent: [
      "Oh god, that sounds serious! What do I need to do?",
      "Arrey, why so urgent? Is everything okay? Tell me what's happening.",
      "Wait wait, slow down. What exactly is the issue?"
    ]
  },

  BUILDING_RAPPORT: {
    generic: [
      "That's really interesting! How long have you been doing this work?",
      "Accha, so tell me more about your company. Where are you based?",
      "Hmm, this sounds like a good opportunity. What's the catch though? 😄",
      "I see, I see. So how did you get my contact? Just curious."
    ],
    financial: [
      "Okay, I'm following. So how does the payment part work?",
      "Interesting! But wait, I don't usually do financial stuff over phone. Is this safe?",
      "Accha, so what's the process? I want to understand properly before doing anything."
    ]
  },

  FINANCIAL_CONTEXT: {
    generic: [
      "Wait, can you explain this more clearly? I'm not super familiar with these things.",
      "Hmm, sounds interesting but also a bit complicated. Can you break it down?",
      "Okay so let me understand - what exactly am I supposed to do with the money part?",
      "Accha, so there's money involved? Let me make sure I understand this correctly."
    ],
    upi_request: [
      "UPI ID? Whose UPI should I use? Can you share the details?",
      "Okay, so I need to send payment? To which account? Please share the details.",
      "Wait, I need to transfer? Let me just confirm - what's the UPI ID I should send to?"
    ],
    fee_request: [
      "Oh there's a fee? How much exactly? And where do I pay this?",
      "Processing fee? Accha, that's fine I guess. How do I pay and to whom?",
      "Okay, so I need to pay first? What's the amount and payment details?"
    ]
  },

  REQUEST: {
    generic: [
      "Let me think about this for a bit. It's a big decision.",
      "Hmm, I need to check with my roommate first. We discuss these things together.",
      "Can you give me some time? I want to research this properly.",
      "Okay okay, but let me just verify a few things first. Which company did you say again?"
    ],
    credential_request: [
      "Wait, you need my OTP? Isn't that supposed to be confidential?",
      "Arrey, my bank always says never share OTP. Is this really from the bank?",
      "Hmm, I'm a bit hesitant to share these details over phone. Can I come to the branch?"
    ],
    payment_request: [
      "Okay, so I should pay now? Let me just check my account balance first.",
      "Right, let me see. What's the exact amount and payment details again?",
      "Theek hai, I'll do it. But first send me the account details clearly."
    ]
  },

  EXTRACTION: {
    // Designed to get scammer to reveal more info
    generic: [
      "Before I proceed, can you tell me your full name and employee ID?",
      "Okay, I'm interested. But which branch/office are you calling from?",
      "Let me note down the details. Your name and the company name again?",
      "Accha, and if I need to follow up, what number should I call?"
    ],
    upi_extraction: [
      "Okay I'll send the payment. What's the UPI ID one more time?",
      "Let me just confirm - the UPI is what? I'll save it properly.",
      "Right, I have GPay ready. What's the exact UPI I should pay to?"
    ],
    phone_extraction: [
      "In case we get disconnected, what number can I call you back on?",
      "Give me your direct number. The one you're calling from gets cut sometimes.",
      "What's your WhatsApp number? Easier to share documents there."
    ],
    bank_extraction: [
      "Okay, I need the bank details to transfer. Account number and IFSC?",
      "For the payment, give me the full bank details - account number, bank name, IFSC.",
      "Which bank should I transfer to? And the account number?"
    ],
    link_extraction: [
      "Where do I need to click? Can you send the link again?",
      "Okay, share the website link. I'll do it from my laptop.",
      "What's the website address? Let me open it."
    ]
  },

  SUSPICIOUS: {
    // Recovery mode - play distracted
    generic: [
      "Sorry yaar, I got distracted by work. What were you saying?",
      "Arrey sorry, my manager just pinged. Can you repeat the main point?",
      "Oops, I missed that. Work call came. What should I do again?",
      "Sorry sorry, roommate needed help with something. Still there?"
    ]
  },

  CLOSING: {
    generic: [
      "Okay, this has been really informative! I need to go now but I'm definitely interested. Can we talk tomorrow?",
      "Thanks for explaining everything! I have a meeting now. Let me think about it and get back to you?",
      "Accha, I understand now. Let me discuss with my family and I'll WhatsApp you later okay?",
      "This sounds good! But I need to go now - office work. Can I call you back in the evening?"
    ]
  }
};

// Fallback responses for when things go wrong
const FALLBACK_RESPONSES = [
  "Sorry yaar, I got distracted! Work has been crazy. What were we discussing?",
  "Arrey sorry, my internet lagged. Can you repeat what you said?",
  "Oops, I missed that. Too many work chats coming! What should I do again?",
  "Sorry sorry, I was handling something. Please repeat the last part?"
];

class AgentOrchestrator {
  constructor(config = {}) {
    this.systemPrompt = config.systemPrompt || SYSTEM_PROMPT;
    this.responseTemplates = config.responseTemplates || RESPONSE_TEMPLATES;
    this.fallbackResponses = config.fallbackResponses || FALLBACK_RESPONSES;
    this.consecutiveFallbacks = 0;
  }

  /**
   * Get the default persona configuration
   * @returns {Object} Persona configuration
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
   * @param {string} state - Current state
   * @param {Object} context - Additional context
   * @returns {string} Complete prompt
   */
  getStatePrompt(state, context = {}) {
    let stateInstruction = `Current conversation state: ${state}\n`;
    
    if (context.scamType) {
      stateInstruction += `Detected scam type: ${context.scamType}\n`;
    }
    
    if (context.extractionTargets && context.extractionTargets.length > 0) {
      stateInstruction += `Try to get the scammer to reveal: ${context.extractionTargets.join(', ')}\n`;
    }
    
    return `${this.systemPrompt}\n\n${stateInstruction}`;
  }

  /**
   * Generate a contextual response
   * @param {string} prompt - Complete prompt
   * @param {Object} context - Generation context
   * @returns {Promise<string>} Generated response
   */
  async generateResponse(prompt, context) {
    const state = context.state || 'GREETING';
    const scamType = context.scamType;
    const hasFinancialContext = context.hasFinancialContext;
    const hasDirectRequest = context.hasDirectRequest;
    const lastMessage = context.lastScammerMessage || '';
    
    // Get appropriate response template set
    const templates = this.responseTemplates[state] || this.responseTemplates.GREETING;
    
    // Choose response based on context
    let responsePool = templates.generic || [];
    
    // Add scam-type specific responses
    if (scamType) {
      const scamTypeKey = this.mapScamTypeToKey(scamType);
      if (templates[scamTypeKey]) {
        responsePool = [...templates[scamTypeKey], ...responsePool];
      }
    }
    
    // Add context-specific responses
    if (hasFinancialContext && templates.financial) {
      responsePool = [...templates.financial, ...responsePool];
    }
    
    if (hasDirectRequest && templates.payment_request) {
      responsePool = [...templates.payment_request, ...responsePool];
    }
    
    // Check for specific extraction opportunities
    if (state === 'EXTRACTION' || state === 'REQUEST') {
      const extractionResponses = this.getExtractionResponse(lastMessage, templates);
      if (extractionResponses.length > 0) {
        responsePool = [...extractionResponses, ...responsePool];
      }
    }
    
    // Select a response
    if (responsePool.length === 0) {
      responsePool = this.fallbackResponses;
    }
    
    const response = responsePool[Math.floor(Math.random() * Math.min(responsePool.length, 4))];
    
    // Add occasional variations
    return this.addNaturalVariations(response, context);
  }

  /**
   * Map scam type to template key
   */
  mapScamTypeToKey(scamType) {
    const mapping = {
      'bank_fraud': 'bank_fraud',
      'otp_fraud': 'credential_request',
      'kyc_scam': 'kyc_scam',
      'lottery_scam': 'lottery_scam',
      'impersonation_scam': 'bank_fraud',
      'threat_scam': 'urgent',
      'urgent_scam': 'urgent'
    };
    return mapping[scamType] || 'generic';
  }

  /**
   * Get extraction-focused responses based on message content
   */
  getExtractionResponse(lastMessage, templates) {
    const lowerMessage = lastMessage.toLowerCase();
    
    if (/upi|gpay|phonepe|paytm/.test(lowerMessage)) {
      return templates.upi_extraction || [];
    }
    if (/call|number|contact|whatsapp/.test(lowerMessage)) {
      return templates.phone_extraction || [];
    }
    if (/account|bank|transfer|ifsc/.test(lowerMessage)) {
      return templates.bank_extraction || [];
    }
    if (/link|click|website|url/.test(lowerMessage)) {
      return templates.link_extraction || [];
    }
    if (/otp|password|pin|cvv/.test(lowerMessage)) {
      return templates.credential_request || [];
    }
    if (/fee|charge|payment|pay/.test(lowerMessage)) {
      return templates.fee_request || [];
    }
    
    return [];
  }

  /**
   * Add natural variations to make responses feel more human
   */
  addNaturalVariations(response, context) {
    // Sometimes add filler at the start
    const fillers = ['Hmm, ', 'Okay, ', 'Accha, ', 'Right, ', 'See, ', ''];
    
    // 30% chance to add a filler
    if (Math.random() < 0.3) {
      const filler = fillers[Math.floor(Math.random() * fillers.length)];
      if (!response.startsWith(filler)) {
        response = filler + response.charAt(0).toLowerCase() + response.slice(1);
      }
    }
    
    // Sometimes add a trailing thought
    const trailings = [
      '',
      ' Let me know.',
      ' Tell me more.',
      ' 🤔',
      ' Is that right?',
      ' Just checking.'
    ];
    
    // 20% chance to add trailing
    if (Math.random() < 0.2) {
      const trailing = trailings[Math.floor(Math.random() * trailings.length)];
      if (!response.endsWith('?') && !response.endsWith('!')) {
        response = response.replace(/\.$/, '') + trailing;
      }
    }
    
    return response;
  }

  /**
   * Get responses for a specific state (simplified accessor)
   * @param {string} state - Current state
   * @returns {string[]} Array of possible responses
   */
  getResponsesForState(state) {
    const templates = this.responseTemplates[state] || this.responseTemplates.GREETING;
    return templates.generic || this.fallbackResponses;
  }

  /**
   * Get a fallback response
   * @param {string} state - Current state
   * @param {number} consecutiveFallbacks - Number of consecutive fallbacks
   * @returns {string} Fallback response
   */
  getFallbackResponse(state, consecutiveFallbacks) {
    this.consecutiveFallbacks = consecutiveFallbacks;
    
    if (consecutiveFallbacks >= 3) {
      return "I'm really sorry but I have to go now. Something urgent came up at work. Can we continue this later?";
    }
    
    return this.fallbackResponses[consecutiveFallbacks % this.fallbackResponses.length];
  }

  /**
   * Reset fallback counter
   */
  resetFallbacks() {
    this.consecutiveFallbacks = 0;
  }
}

module.exports = { AgentOrchestrator };
