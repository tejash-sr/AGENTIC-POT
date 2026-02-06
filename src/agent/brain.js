/**
 * INTELLIGENT CONVERSATION BRAIN
 * HCL GUVI Buildathon - Competition Winning Module
 * 
 * This is the "advanced brain" that differentiates REAL vs SCAM,
 * handles ANY conversation, and responds like a genuine human.
 * 
 * Key Capabilities:
 * 1. Real-time scam vs legitimate classification
 * 2. Natural human personality with quirks
 * 3. Memory and context awareness
 * 4. Emotional intelligence
 * 5. Handles unexpected/out-of-blue messages
 */

class ConversationBrain {
  constructor() {
    this.persona = this.createRichPersona();
    this.conversationMemory = new Map();
    this.emotionalState = 'neutral'; // neutral, happy, confused, worried, suspicious, annoyed
    this.trustLevel = 0.5; // 0-1 scale, starts neutral
  }

  /**
   * Create a rich, believable persona with backstory
   */
  createRichPersona() {
    return {
      name: 'Priya',
      fullName: 'Priya Sharma',
      age: 28,
      occupation: 'Software Engineer at TCS',
      location: 'Mumbai, Andheri West',
      
      // Personal details (for authenticity)
      husband: 'Rahul',
      familySize: 'joint family with in-laws',
      pet: 'no pets, but wants a dog',
      
      // Daily life context
      workTiming: '9 AM to 6 PM',
      commute: 'WFH mostly, sometimes goes to office in BKC',
      hobbies: ['watching Netflix', 'cooking', 'yoga'],
      recentEvents: ['attended cousin wedding last month', 'planning vacation to Goa'],
      
      // Banking details (believable fake)
      banks: ['HDFC savings account', 'SBI salary account', 'ICICI credit card'],
      preferredUPI: 'PhonePe and GPay',
      
      // Personality traits
      traits: {
        cautious: 0.7,
        friendly: 0.8,
        talkative: 0.65,
        curious: 0.9,
        trusting: 0.4, // Not too trusting
        impatient: 0.3
      },
      
      // Speech patterns
      speechPatterns: {
        usesHinglish: true,
        commonPhrases: ['actually', 'you know', 'wait wait', 'hmm', 'okay okay', 'one second'],
        endingPhrases: ['na?', 'right?', 'haina?', 'you know?'],
        fillerWords: ['umm', 'like', 'basically', 'so like'],
        exclamations: ['arrey!', 'oh god!', 'wait!', 'haan haan', 'accha accha']
      }
    };
  }

  /**
   * CORE FUNCTION: Determine if message is SCAM or LEGITIMATE
   * Returns: { isScam: boolean, confidence: number, type: string, reasoning: string }
   */
  classifyMessage(message, conversationHistory = [], detectionResult = {}) {
    const lowerMsg = message.toLowerCase();
    
    // Strong scam indicators (high confidence scam)
    const strongScamIndicators = [
      { pattern: /otp|one.?time.?password|verification code/i, weight: 0.9, type: 'otp_fraud' },
      { pattern: /won|lottery|prize|jackpot|lucky winner/i, weight: 0.85, type: 'lottery_scam' },
      { pattern: /kyc.*(expired?|pending|update|block)/i, weight: 0.9, type: 'kyc_scam' },
      { pattern: /account.*(block|suspend|freeze|close)/i, weight: 0.85, type: 'threat_scam' },
      { pattern: /send.*(money|payment|rs|rupees|fee)/i, weight: 0.8, type: 'advance_fee' },
      { pattern: /transfer.*urgent|urgent.*transfer/i, weight: 0.85, type: 'urgency_scam' },
      { pattern: /(cvv|card number|expiry date|pin)/i, weight: 0.9, type: 'card_fraud' },
      { pattern: /processing fee|activation fee|clearance/i, weight: 0.85, type: 'advance_fee' },
      { pattern: /income tax.*refund|refund.*income tax/i, weight: 0.8, type: 'tax_scam' },
      { pattern: /arrest warrant|legal action|court case/i, weight: 0.85, type: 'legal_threat' },
      { pattern: /crypto|bitcoin|investment.*guarantee/i, weight: 0.8, type: 'investment_scam' },
      { pattern: /work from home.*earn|earn.*daily.*rs/i, weight: 0.75, type: 'job_scam' }
    ];

    // Legitimate conversation indicators
    const legitimateIndicators = [
      { pattern: /^(hi|hello|hey|good morning|good evening)[\s!?.]*$/i, weight: 0.7 },
      { pattern: /^how are you|what's up|kaise ho/i, weight: 0.6 },
      { pattern: /thanks|thank you|dhanyavaad/i, weight: 0.5 },
      { pattern: /^(ok|okay|alright|sure|yes|no|haan|nahi)[\s!?.]*$/i, weight: 0.6 },
      { pattern: /how.*(help|assist)|can i help/i, weight: 0.4 },
      { pattern: /^bye|goodbye|talk later|see you/i, weight: 0.7 },
      // Casual topics - NOT scam related
      { pattern: /weather|rain|sunny|hot|cold|monsoon|humid/i, weight: 0.6 },
      { pattern: /cricket|match|ipl|kohli|rohit|dhoni|india.*(vs|match)/i, weight: 0.6 },
      { pattern: /food|biryani|pizza|lunch|dinner|breakfast|eat|restaurant/i, weight: 0.6 },
      { pattern: /movie|film|bollywood|netflix|watch/i, weight: 0.5 },
      { pattern: /family|husband|wife|kids|children|parents/i, weight: 0.5 },
      { pattern: /weekend|vacation|holiday|travel|trip/i, weight: 0.5 },
      { pattern: /genuine.*(inquiry|question)|real.*customer/i, weight: 0.6 },
      // Polite small talk
      { pattern: /nice to (meet|talk)|pleasure/i, weight: 0.5 },
      { pattern: /take care|have a (good|nice) day/i, weight: 0.6 }
    ];

    // Neutral/ambiguous indicators (need more context)
    const ambiguousIndicators = [
      { pattern: /bank|account|transaction/i, weight: 0 }, // Could be either
      { pattern: /call.*regarding|calling about/i, weight: 0 },
      { pattern: /update|verify|confirm/i, weight: 0 }
    ];

    let scamScore = 0;
    let legitScore = 0;
    let detectedType = 'unknown';
    let matchedPatterns = [];

    // Check scam indicators
    for (const indicator of strongScamIndicators) {
      if (indicator.pattern.test(lowerMsg)) {
        scamScore += indicator.weight;
        detectedType = indicator.type;
        matchedPatterns.push(indicator.type);
      }
    }

    // Check legitimate indicators
    for (const indicator of legitimateIndicators) {
      if (indicator.pattern.test(lowerMsg)) {
        legitScore += indicator.weight;
      }
    }

    // Use detection result if available
    if (detectionResult.is_scam && detectionResult.confidence > 0.6) {
      scamScore += detectionResult.confidence * 0.5;
    }

    // Analyze conversation history for escalation pattern (scammers escalate quickly)
    if (conversationHistory.length >= 2) {
      const recentMessages = conversationHistory.slice(-5);
      let financialMentions = 0;
      let urgencyMentions = 0;
      
      for (const msg of recentMessages) {
        const text = (msg.text || '').toLowerCase();
        if (/money|payment|transfer|upi|bank|fee|charge/i.test(text)) financialMentions++;
        if (/urgent|immediate|now|hurry|quick/i.test(text)) urgencyMentions++;
      }
      
      // Rapid escalation is a strong scam indicator
      if (financialMentions >= 2 && conversationHistory.length <= 5) {
        scamScore += 0.3;
      }
      if (urgencyMentions >= 2) {
        scamScore += 0.2;
      }
    }

    // Normalize scores
    const totalScore = scamScore + legitScore;
    const scamConfidence = totalScore > 0 ? scamScore / Math.max(totalScore, 1) : 0.5;
    
    // Classification decision
    let isScam = false;
    let reasoning = '';

    if (scamScore >= 0.7) {
      isScam = true;
      reasoning = `High scam indicators detected: ${matchedPatterns.join(', ')}`;
    } else if (scamScore >= 0.4 && legitScore < 0.3) {
      isScam = true;
      reasoning = `Moderate scam indicators with low legitimate signals`;
    } else if (legitScore >= 0.5 && scamScore < 0.3) {
      isScam = false;
      reasoning = `Appears to be legitimate conversation`;
    } else {
      // Ambiguous - lean towards caution (treat as potential scam but respond normally)
      isScam = scamScore > legitScore;
      reasoning = `Ambiguous - monitoring closely`;
    }

    return {
      isScam,
      confidence: Math.min(scamConfidence, 1.0),
      type: detectedType,
      reasoning,
      scamScore,
      legitScore,
      matchedPatterns
    };
  }

  /**
   * Analyze emotional content and intent of message
   */
  analyzeEmotionalContext(message) {
    const lowerMsg = message.toLowerCase();
    
    return {
      // Sender's apparent emotion
      senderTone: this.detectSenderTone(lowerMsg),
      
      // Manipulation tactics
      usesUrgency: /urgent|immediate|now|quick|fast|hurry|asap/i.test(lowerMsg),
      usesFear: /block|suspend|arrest|legal|police|court|freeze|close/i.test(lowerMsg),
      usesGreed: /won|prize|lottery|reward|free|bonus|cashback|crore|lakh/i.test(lowerMsg),
      usesAuthority: /officer|manager|department|government|rbi|bank official/i.test(lowerMsg),
      usesRapport: /dear|valued|respected|sir|madam|friend/i.test(lowerMsg),
      
      // Question types
      isQuestion: /\?|kya|kaun|kaise|kab|kyun|where|what|when|why|how|who/i.test(lowerMsg),
      isGreeting: /^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening))[\s!?,.]*/i.test(lowerMsg),
      isGoodbye: /bye|goodbye|talk later|see you|alvida|phir milenge/i.test(lowerMsg),
      
      // Pressure level (0-1)
      pressureLevel: this.calculatePressureLevel(lowerMsg)
    };
  }

  detectSenderTone(message) {
    if (/please|kindly|request|help|sorry/i.test(message)) return 'polite';
    if (/urgent|important|critical|serious/i.test(message)) return 'urgent';
    if (/angry|upset|disappointed|complaint/i.test(message)) return 'upset';
    if (/!{2,}|URGENT|WARNING|ALERT/i.test(message)) return 'aggressive';
    if (/thank|grateful|appreciate/i.test(message)) return 'grateful';
    return 'neutral';
  }

  calculatePressureLevel(message) {
    let pressure = 0;
    
    if (/urgent|immediate/i.test(message)) pressure += 0.2;
    if (/\d+\s*(minute|hour|second)/i.test(message)) pressure += 0.3;
    if (/block|suspend|freeze/i.test(message)) pressure += 0.25;
    if (/!{2,}/i.test(message)) pressure += 0.1;
    if (/last chance|final warning/i.test(message)) pressure += 0.2;
    if (/must|have to|need to.*now/i.test(message)) pressure += 0.15;
    
    return Math.min(pressure, 1.0);
  }

  /**
   * Update brain's emotional state based on conversation
   */
  updateEmotionalState(classification, emotionalContext) {
    if (classification.isScam && classification.confidence > 0.7) {
      // Getting suspicious
      if (emotionalContext.usesFear) {
        this.emotionalState = 'worried';
      } else if (emotionalContext.usesUrgency) {
        this.emotionalState = 'confused';
      } else {
        this.emotionalState = 'suspicious';
      }
      this.trustLevel = Math.max(0, this.trustLevel - 0.1);
    } else if (!classification.isScam) {
      // Normal conversation
      if (emotionalContext.isGreeting) {
        this.emotionalState = 'happy';
        this.trustLevel = Math.min(1, this.trustLevel + 0.05);
      } else {
        this.emotionalState = 'neutral';
      }
    }
  }

  /**
   * Generate a NATURAL, HUMAN-LIKE response
   * This is the core intelligence - responds appropriately to ANY message
   */
  generateHumanResponse(message, classification, emotionalContext, turnCount, sessionMemory = {}) {
    const { isScam, type, confidence, legitScore, scamScore } = classification;
    
    // Store context for this turn
    this.storeMemory(message, sessionMemory);
    
    // Handle special cases first
    if (emotionalContext.isGreeting && turnCount <= 1) {
      return this.respondToGreeting(message, isScam);
    }
    
    if (emotionalContext.isGoodbye) {
      return this.respondToGoodbye(message, isScam);
    }
    
    // If clearly NOT a scam (high legit score or very low scam score), respond naturally
    if (!isScam || (legitScore > 0.4 && scamScore < 0.3)) {
      return this.respondToLegitimateMessage(message, emotionalContext, turnCount);
    }
    
    // If SCAM detected with reasonable confidence, engage strategically
    if (isScam && confidence > 0.4) {
      return this.respondToScamMessage(message, type, emotionalContext, turnCount, sessionMemory);
    }
    
    // Ambiguous (low confidence either way) - respond cautiously but naturally
    return this.respondToAmbiguousMessage(message, emotionalContext, turnCount);
  }

  /**
   * Respond to greeting messages
   */
  respondToGreeting(message, isPotentialScam) {
    const greetings = [
      "Hello! Who's this? I don't have this number saved.",
      "Hi hi! Yes, who am I speaking with?",
      "Hello? Sorry, didn't catch your name. Who's calling?",
      "Hey! Yes tell me, who is this?",
      "Hi, this number's not saved. May I know who's calling?",
      "Hello ji! Han bolo, kaun hai?"
    ];
    
    return this.addPersonalityFlair(this.pickRandom(greetings));
  }

  /**
   * Respond to goodbye messages
   */
  respondToGoodbye(message, wasScam) {
    if (wasScam) {
      // Try to extract one last piece of info
      const responses = [
        "Wait wait, before you go - can you share your WhatsApp number? I'll message you.",
        "Okay but send me your contact details na? I want to follow up.",
        "Alright, but what's your email? I'll confirm everything in writing.",
        "Sure, but let me save your number. What was your name again?"
      ];
      return this.pickRandom(responses);
    } else {
      const responses = [
        "Okay, bye bye! Take care!",
        "Alright, talk later. Bye!",
        "Sure, no problem. Bye!",
        "Okay bye! Nice talking to you."
      ];
      return this.pickRandom(responses);
    }
  }

  /**
   * Respond to clearly legitimate messages
   */
  respondToLegitimateMessage(message, emotionalContext, turnCount) {
    const lowerMsg = message.toLowerCase();
    
    // Handle common legitimate conversations
    if (/how are you|kaise ho|how's it going/i.test(lowerMsg)) {
      const responses = [
        "I'm good, thanks for asking! Just busy with work. How about you?",
        "Doing well! Work se thoda tired but managing. You tell?",
        "All good here! Weekend ki planning chal rahi hai. And you?",
        "Theek hai, life chal rahi hai! How are you doing?"
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    if (/thank|thanks|dhanyavaad/i.test(lowerMsg)) {
      const responses = [
        "You're welcome! Happy to help.",
        "No problem at all!",
        "Anytime! Let me know if you need anything else.",
        "Most welcome! Take care."
      ];
      return this.pickRandom(responses);
    }
    
    if (/sorry|apologize|maafi/i.test(lowerMsg)) {
      const responses = [
        "No worries at all! It's okay.",
        "Arrey koi baat nahi! Don't worry about it.",
        "It's totally fine, no need to apologize!",
        "All good, don't stress about it!"
      ];
      return this.pickRandom(responses);
    }
    
    // Weather talk
    if (/weather|rain|hot|cold|sunny|monsoon/i.test(lowerMsg)) {
      const responses = [
        "Haan yaar, the weather is crazy these days! But tell me, what's up?",
        "I know right! Mumbai weather is so unpredictable. Anyway, what can I do for you?",
        "Yes yes! I stepped out today and it was so humid. But anyway, you were saying?"
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    // Cricket/Sports
    if (/cricket|match|india|ipl|worldcup|kohli|rohit/i.test(lowerMsg)) {
      const responses = [
        "Arrey don't get me started on cricket! My husband watches every match. But anyway, what were you calling about?",
        "Haha yes! Did you see that catch? Amazing! But wait, what did you need from me?",
        "Cricket! My whole family was glued to the TV. But tell me, what's the purpose of your call?"
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    // Food
    if (/food|eat|lunch|dinner|breakfast|biryani|pizza|chai/i.test(lowerMsg)) {
      const responses = [
        "Oh nice! I'm actually getting hungry now haha. But anyway, what were we discussing?",
        "Yaar don't talk about food, I'm on diet! But tell me, what did you call for?",
        "Mmm that sounds delicious! I just had maggi. Anyway, how can I help you?"
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    // Family
    if (/family|husband|wife|kids|children|parents|mother|father/i.test(lowerMsg)) {
      const responses = [
        "Family is everything na! My husband always says the same. But tell me, what's the matter?",
        "So nice! Family time is the best. Anyway, what can I do for you?",
        "Haan, family first always! But coming back to the topic, what were you saying?"
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    // General friendly response
    const responses = [
      "Hmm interesting! Tell me more about that?",
      "Oh I see. And then what happened?",
      "Accha accha, I'm listening. Go on...",
      "That's nice! What else?",
      "Okay okay, understood. Anything else?",
      "Haha nice! But anyway, what brings you to call me today?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  /**
   * Respond to scam messages - CORE HONEYPOT LOGIC
   */
  respondToScamMessage(message, scamType, emotionalContext, turnCount, sessionMemory) {
    const lowerMsg = message.toLowerCase();
    
    // Different strategies based on scam type
    switch(scamType) {
      case 'otp_fraud':
        return this.handleOTPScam(message, emotionalContext, turnCount);
      
      case 'kyc_scam':
        return this.handleKYCScam(message, emotionalContext, turnCount);
      
      case 'lottery_scam':
      case 'advance_fee':
        return this.handlePrizeScam(message, emotionalContext, turnCount);
      
      case 'threat_scam':
      case 'legal_threat':
        return this.handleThreatScam(message, emotionalContext, turnCount);
      
      case 'card_fraud':
        return this.handleCardScam(message, emotionalContext, turnCount);
      
      case 'investment_scam':
        return this.handleInvestmentScam(message, emotionalContext, turnCount);
      
      case 'job_scam':
        return this.handleJobScam(message, emotionalContext, turnCount);
      
      default:
        return this.handleGenericScam(message, emotionalContext, turnCount);
    }
  }

  // Specific scam type handlers
  handleOTPScam(message, emotionalContext, turnCount) {
    // Extract phone if mentioned
    const phoneMatch = message.match(/\+91[\s-]?(\d{10})|(\d{10})/);
    const phone = phoneMatch ? phoneMatch[0] : null;
    
    if (turnCount <= 2) {
      const responses = phone ? [
        `OTP bhejun ${phone} pe? But SMS mein likha hai ki share mat karo... You're really from the bank?`,
        `Wait, ${phone} pe send karu? But mera bank says OTP confidential hai. Why do you need it?`,
        `${phone}? Hmm, I got the OTP but it says never share. Can you explain why you need it?`,
        `Send to ${phone}... but something feels weird. OTP is secret right? My husband says never share.`
      ] : [
        "OTP? But my bank always says never share OTP with anyone on call. Is this official?",
        "Wait wait, OTP share karna hai? But SMS mein likha hai confidential. Why do you need?",
        "I got the OTP but... banks don't usually ask for this right? I'm confused.",
        "OTP aaya but before I share, tell me - which bank and which branch are you from?"
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    } else {
      const responses = [
        "Look, I talked to my husband. He said NEVER share OTP on call. Can we do this at the branch?",
        "Sorry but I'm not comfortable. I'll visit the bank tomorrow. Which branch should I go?",
        "Maine socha but nahi ho payega. Let me verify at the bank. What documents should I bring?",
        "My brother works in SBI and he said this sounds suspicious. Let me call the official helpline."
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
  }

  handleKYCScam(message, emotionalContext, turnCount) {
    const responses = turnCount <= 3 ? [
      "KYC pending? But I remember submitting everything. When did this issue come up?",
      "Arrey, I thought my KYC was complete! Which document is missing exactly?",
      "My Aadhaar and PAN are both linked since 2020. What specific problem are you seeing?",
      "I don't understand - I did KYC at the branch itself. Can you check again?",
      "KYC expired? But I got no SMS or email about this. When was it supposed to be done?"
    ] : [
      "Okay I'm worried now. Let me visit the branch directly. Which location should I come to?",
      "I'll come to the bank tomorrow with all documents. What's the branch address?",
      "Can you send me official email about this? I want everything documented.",
      "Let me call the customer care number on the back of my card to verify this."
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  handlePrizeScam(message, emotionalContext, turnCount) {
    // Extract UPI if mentioned
    const upiMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z]+)/i);
    const upi = upiMatch ? upiMatch[0] : null;
    
    // Extract amount if mentioned
    const amountMatch = message.match(/rs\.?\s*(\d+(?:,\d+)?)|(\d+(?:,\d+)?)\s*(rupees|rs)/i);
    const amount = amountMatch ? amountMatch[0] : null;
    
    if (upi) {
      const responses = [
        `${upi} pe bhejun? Okay wait, let me open GPay. What name should I see when I search?`,
        `Sending to ${upi}... but first confirm - is this your personal account or company's?`,
        `${upi} right? Okay. Before I pay, what's your full name as registered on UPI?`,
        `Got it - ${upi}. But tell me, what organization is this from? I want to note down.`
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    if (amount) {
      const responses = [
        `${amount}? That's quite a bit. But okay for lottery I can manage. What's the UPI ID?`,
        `Hmm ${amount}... let me check my balance. Tell me the exact payment details?`,
        `${amount} I'll arrange. Give me the account number, IFSC, and beneficiary name.`,
        `Okay ${amount}. Before I transfer - what's the company name and your employee ID?`
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    const responses = [
      "Wait, I won something?! But I don't remember entering any contest. Which one was this?",
      "Arrey wah! Prize for me? But sounds too good to be true. How do I verify this is real?",
      "Lottery?? I never buy lottery tickets though. Can you explain how I was selected?",
      "This sounds amazing but suspicious also. Send me official email with all details please."
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  handleThreatScam(message, emotionalContext, turnCount) {
    // Extract time pressure if mentioned
    const timeMatch = message.match(/(\d+)\s*(minute|hour|second)/i);
    const time = timeMatch ? timeMatch[0] : null;
    
    if (time) {
      const responses = [
        `Only ${time}?? You're scaring me! But wait - let me confirm, what's your official number?`,
        `${time}?! That's too fast, I can't think properly. What's your supervisor's number?`,
        `Arrey ${time} mein kaise! At least tell me your name and branch so I can verify!`,
        `${time} is very less! I'm panicking now. Give me the helpdesk number I can call back on.`
      ];
      return this.addPersonalityFlair(this.pickRandom(responses));
    }
    
    const responses = [
      "Oh god! You're scaring me. But even in emergency I should be careful. What's your employee ID?",
      "This is so stressful! But before I panic - which bank and which branch are you calling from?",
      "Wait wait, let me calm down. Can you give me a reference number for this issue?",
      "Okay I'm worried now. But tell me your name and designation - I need to verify first.",
      "If my account is blocked, I'll go to branch directly. Which address should I come to?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  handleCardScam(message, emotionalContext, turnCount) {
    const responses = [
      "Card details? Okay, but first tell me - what's your name and employee ID for my records?",
      "Before I share card number, I need to verify. What's the official customer care number?",
      "I can share but I always note down who I'm talking to. Your name, department, branch?",
      "Let me find my card. Meanwhile, what's your direct phone number and email?",
      "Which card are you asking about? I have multiple. And what's your employee code?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  handleInvestmentScam(message, emotionalContext, turnCount) {
    const responses = [
      "Guaranteed returns? That sounds risky. What's your company name and SEBI registration?",
      "Investment opportunity? Interesting but I need to verify. What's your official website?",
      "My CA handles my investments. Can I share your details with him? What's your company name?",
      "Hmm, I'm interested but cautious. Send me documentation to my email. What's your company?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  handleJobScam(message, emotionalContext, turnCount) {
    const responses = [
      "Work from home job? Sounds interesting! But what company is this? I need to research first.",
      "Daily earning? That's good but sounds too easy. What exactly is the work involved?",
      "Tell me more - what's the company name, website, and your designation?",
      "I'm interested but need details. What qualifications required? And interview process?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  handleGenericScam(message, emotionalContext, turnCount) {
    const lowerMsg = message.toLowerCase();
    
    // Try to extract any details mentioned
    const phoneMatch = message.match(/\+91[\s-]?(\d{10})|(\d{10})/);
    const upiMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z]+)/i);
    const amountMatch = message.match(/rs\.?\s*(\d+)|(\d+)\s*rupees/i);
    
    if (phoneMatch) {
      const phone = phoneMatch[0];
      return this.addPersonalityFlair(`Okay noted ${phone}. Is this your direct number? I'll call back to verify.`);
    }
    
    if (upiMatch) {
      const upi = upiMatch[0];
      return this.addPersonalityFlair(`${upi} - got it. Before I proceed, what name will show on this UPI?`);
    }
    
    if (amountMatch) {
      const amount = amountMatch[0];
      return this.addPersonalityFlair(`${amount}? Okay let me check. What's the exact UPI ID or account number?`);
    }
    
    // Default extraction responses
    const responses = [
      "Okay I understand. But before we proceed - what's your name and employee ID?",
      "Hmm alright. Tell me clearly - which organization are you from exactly?",
      "I'm following. But I always keep records - your name, department, and contact number?",
      "Okay okay. Let me note down - what's your full name and official email?",
      "Understood. But first, what's the official helpline number I can call to verify?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  /**
   * Respond to ambiguous messages
   */
  respondToAmbiguousMessage(message, emotionalContext, turnCount) {
    const responses = [
      "Sorry, can you explain that in more detail? I want to understand properly.",
      "Hmm okay. Tell me more - what exactly is this regarding?",
      "I see. And what should I do about it? Walk me through the process.",
      "Interesting. But who am I speaking with? Which company/organization?",
      "Okay okay, I'm listening. Please continue, what's the full situation?"
    ];
    return this.addPersonalityFlair(this.pickRandom(responses));
  }

  /**
   * Add personality quirks to make response more human
   */
  addPersonalityFlair(response) {
    const random = Math.random();
    
    // 30% chance to add filler words
    if (random < 0.3) {
      const fillers = ['Umm, ', 'So like, ', 'Actually, ', 'You know, ', 'Basically, '];
      response = this.pickRandom(fillers) + response.charAt(0).toLowerCase() + response.slice(1);
    }
    
    // 20% chance to add ending phrase
    if (random > 0.8) {
      const endings = [' na?', ' right?', ' you know?', '...', ' haina?'];
      response = response.replace(/[.?!]$/, '') + this.pickRandom(endings);
    }
    
    // 15% chance for typo then correction (very human!)
    if (random > 0.85 && response.length > 50) {
      // Add a small typo correction
      const corrections = [
        ' *sorry, typing fast* ',
        ' - wait let me rephrase - ',
        ' oops, I mean '
      ];
      // Don't actually add typos, just the corrections to seem human
    }
    
    return response;
  }

  /**
   * Store conversation memory
   */
  storeMemory(message, sessionMemory) {
    // Extract key information to remember
    const phoneMatch = message.match(/\+91[\s-]?(\d{10})|(\d{10})/);
    const nameMatch = message.match(/(?:my name is|i am|this is)\s+([A-Za-z]+)/i);
    const orgMatch = message.match(/(?:from|with)\s+([A-Za-z]+\s*(?:bank|ltd|pvt|private|limited)?)/i);
    
    if (phoneMatch) sessionMemory.mentionedPhone = phoneMatch[0];
    if (nameMatch) sessionMemory.mentionedName = nameMatch[1];
    if (orgMatch) sessionMemory.mentionedOrg = orgMatch[1];
  }

  /**
   * Utility function
   */
  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

module.exports = { ConversationBrain };
