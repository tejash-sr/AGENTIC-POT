/**
 * Scam Detection Engine
 * Enhanced for Indian market scams - HCL GUVI Buildathon
 * 
 * Rule-based + probabilistic hybrid detection system.
 * Optimized for: Bank fraud, UPI fraud, KYC scams, OTP fraud, and phishing
 */

// Comprehensive scam patterns with India-specific focus
const SCAM_PATTERNS = [
  // === URGENCY INDICATORS (High weight) ===
  { pattern: /urgent|immediately|within \d+ (hours?|minutes?)|right now/i, weight: 0.18, category: 'urgency', urgency_boost: true },
  { pattern: /act now|don't delay|time (is|was) running|last chance/i, weight: 0.15, category: 'urgency', urgency_boost: true },
  { pattern: /final (warning|notice)|action required|expire/i, weight: 0.16, category: 'urgency', urgency_boost: true },
  { pattern: /today only|limited time|hurry|asap/i, weight: 0.14, category: 'urgency', urgency_boost: true },

  // === AUTHORITY IMPERSONATION (Very High weight) ===
  { pattern: /bank (manager|official|officer|executive)|rbi|reserve bank/i, weight: 0.22, category: 'authority', urgency_boost: false },
  { pattern: /government|police|court|income tax|it department/i, weight: 0.20, category: 'authority', urgency_boost: false },
  { pattern: /your (account|number|email|pan|aadhaar) (is|has been|will be)/i, weight: 0.18, category: 'authority', urgency_boost: true },
  { pattern: /sbi|hdfc|icici|axis|kotak|pnb|bob|canara/i, weight: 0.12, category: 'authority', urgency_boost: false },
  { pattern: /customer (care|support|service)|helpline|toll.?free/i, weight: 0.14, category: 'authority', urgency_boost: false },

  // === FINANCIAL REQUESTS (Critical weight) ===
  { pattern: /send (money|payment|amount|funds|rs\.?|rupees|inr)/i, weight: 0.25, category: 'financial', urgency_boost: true },
  { pattern: /transfer (to|into|money)|wire|remittance/i, weight: 0.22, category: 'financial', urgency_boost: false },
  { pattern: /upi:\/\/|@(upi|paytm|gpay|phonepe|ybl|okaxis|okhdfcbank)/i, weight: 0.20, category: 'financial', urgency_boost: false },
  { pattern: /pay (to|now|immediately|using)|payment link/i, weight: 0.18, category: 'financial', urgency_boost: true },
  { pattern: /processing fee|activation (fee|charge)|registration (fee|charge)/i, weight: 0.20, category: 'financial', urgency_boost: true },

  // === KYC / VERIFICATION SCAMS (India-specific) ===
  { pattern: /kyc (update|verify|pending|expired|required)/i, weight: 0.22, category: 'verification', urgency_boost: true },
  { pattern: /verify your (account|identity|details|kyc|pan|aadhaar)/i, weight: 0.20, category: 'verification', urgency_boost: true },
  { pattern: /pan (card|number|verification|update|link)/i, weight: 0.18, category: 'verification', urgency_boost: true },
  { pattern: /aadhaar (card|number|verification|update|link)/i, weight: 0.18, category: 'verification', urgency_boost: true },
  { pattern: /update (your )?details|complete verification/i, weight: 0.15, category: 'verification', urgency_boost: true },

  // === OTP / CREDENTIAL THEFT ===
  { pattern: /otp|one.?time.?password|verification code/i, weight: 0.25, category: 'credential', urgency_boost: true },
  { pattern: /share (your )?(otp|password|pin|cvv|card number)/i, weight: 0.28, category: 'credential', urgency_boost: true },
  { pattern: /enter (otp|password|pin)|confirm (otp|password)/i, weight: 0.22, category: 'credential', urgency_boost: true },
  { pattern: /card (number|details|cvv|expiry)/i, weight: 0.20, category: 'credential', urgency_boost: true },
  { pattern: /netbanking|internet banking|mobile banking/i, weight: 0.12, category: 'credential', urgency_boost: false },

  // === ACCOUNT SUSPENSION / BLOCKING ===
  { pattern: /account (blocked|suspended|frozen|closed|deactivated)/i, weight: 0.22, category: 'threat', urgency_boost: true },
  { pattern: /will be (blocked|suspended|frozen|closed|deactivated)/i, weight: 0.20, category: 'threat', urgency_boost: true },
  { pattern: /unauthorized (access|transaction|activity)/i, weight: 0.18, category: 'threat', urgency_boost: true },
  { pattern: /suspicious (activity|transaction|login)/i, weight: 0.16, category: 'threat', urgency_boost: true },
  { pattern: /security (alert|warning|issue|breach)/i, weight: 0.15, category: 'threat', urgency_boost: true },

  // === PRIZE / LOTTERY SCAMS ===
  { pattern: /winner|won|prize|lottery|jackpot|selected|lucky/i, weight: 0.20, category: 'prize', urgency_boost: true },
  { pattern: /claim (your|now)|congratulations|you('ve| have) been (selected|chosen)/i, weight: 0.18, category: 'prize', urgency_boost: true },
  { pattern: /reward|cashback|bonus|gift|voucher|coupon/i, weight: 0.12, category: 'prize', urgency_boost: false },

  // === JOB / EMPLOYMENT SCAMS ===
  { pattern: /work from home|home based job|part.?time job/i, weight: 0.16, category: 'employment', urgency_boost: true },
  { pattern: /easy money|quick money|earn (daily|weekly|monthly)/i, weight: 0.18, category: 'employment', urgency_boost: true },
  { pattern: /no experience|no investment|guaranteed income/i, weight: 0.15, category: 'employment', urgency_boost: true },
  { pattern: /data entry|typing job|online job|freelance/i, weight: 0.10, category: 'employment', urgency_boost: false },

  // === LOAN / CREDIT SCAMS ===
  { pattern: /instant loan|easy loan|pre.?approved loan/i, weight: 0.18, category: 'loan', urgency_boost: true },
  { pattern: /loan (approved|sanctioned)|credit (limit|card) (approved|ready)/i, weight: 0.16, category: 'loan', urgency_boost: true },
  { pattern: /low interest|no documentation|instant approval/i, weight: 0.14, category: 'loan', urgency_boost: false },

  // === ROMANCE / RELATIONSHIP (Lower weight) ===
  { pattern: /love|miss you|heart|feelings|relationship/i, weight: 0.08, category: 'romance', urgency_boost: false },
  { pattern: /dating|marry|life partner|soul ?mate/i, weight: 0.10, category: 'romance', urgency_boost: false },

  // === UNUSUAL CONTACT ===
  { pattern: /new number|changed (my )?number|whatsapp me/i, weight: 0.10, category: 'contact', urgency_boost: false },
  { pattern: /call (me|this number)|contact (me|us)/i, weight: 0.08, category: 'contact', urgency_boost: false }
];

// High-risk keywords specific to Indian scams
const HIGH_RISK_KEYWORDS = [
  // Financial
  'bitcoin', 'ethereum', 'crypto', 'wallet', 'private key',
  'gift card', 'steam card', 'google play card', 'amazon gift',
  'bank transfer', 'wire transfer', 'western union', 'moneygram',
  'upi id', 'gpay', 'phonepe', 'paytm', 'bhim',
  
  // Threats
  'account suspended', 'account blocked', 'verify identity', 'confirm details',
  'legal action', 'police complaint', 'fir', 'arrest warrant',
  
  // Fees
  'processing fee', 'activation fee', 'delivery fee', 'registration fee',
  'customs duty', 'import tax', 'clearance fee', 'gst payment',
  
  // Credentials
  'otp', 'cvv', 'pin', 'password', 'card number', 'expiry date',
  'pan card', 'aadhaar', 'voter id',
  
  // Classic scams
  'inheritance', 'lottery winner', 'prince', 'oil money', 'gold investment'
];

const MEDIUM_RISK_KEYWORDS = [
  'investment', 'returns', 'profit', 'passive income', 'mutual fund',
  'opportunity', 'business proposal', 'partnership', 'offer',
  'dating', 'relationship', 'marriage', 'love',
  'job offer', 'work from home', 'freelance', 'recruitment',
  'prize', 'winner', 'selected', 'lucky', 'congratulations',
  'verify', 'update', 'confirm', 'kyc', 'link aadhaar'
];

// Context phrases that increase scam likelihood
const SCAM_CONTEXT_PHRASES = [
  /dear (customer|user|member|valued)/i,
  /this is to inform you/i,
  /we (regret|notice|observe)/i,
  /as per (rbi|bank|government) (guidelines|rules|regulations)/i,
  /failure to (comply|respond|verify)/i,
  /within (24|48|72) hours/i,
  /click (the|on|below) link/i,
  /download (the|this) app/i
];

class ScamDetector {
  constructor(config = {}) {
    this.threshold = config.threshold || 0.60; // Lowered for better detection
    this.urgencyMultiplier = config.urgencyMultiplier || 1.4;
    this.contextBoost = config.contextBoost || 0.15;
  }

  /**
   * Analyze message for scam indicators
   * @param {string} message - Current message
   * @param {string[]} history - Previous messages
   * @returns {Object} Detection result
   */
  analyze(message, history = []) {
    const result = {
      is_scam: false,
      confidence: 0,
      indicators: [],
      scam_type: null,
      has_financial_context: false,
      has_direct_request: false,
      urgency_level: 'normal',
      risk_factors: []
    };

    // Rule-based detection
    const ruleScore = this.calculateRuleScore(message, history, result);
    
    // Keyword detection
    const keywordScore = this.calculateKeywordScore(message, result);
    
    // Behavioral analysis
    const behavioralScore = this.calculateBehavioralScore(message, history, result);
    
    // Context phrase analysis
    const contextScore = this.calculateContextScore(message, result);
    
    // Weighted combination with context boost
    let totalScore = (ruleScore * 0.50) + (keywordScore * 0.25) + (behavioralScore * 0.15) + (contextScore * 0.10);
    
    // Apply context boost if multiple risk factors present
    if (result.risk_factors.length >= 3) {
      totalScore *= 1.2;
    }
    
    result.confidence = Math.min(totalScore, 1.0);
    result.is_scam = result.confidence >= this.threshold;
    
    // Determine scam type
    result.scam_type = this.determineScamType(result.indicators);
    
    // Check for financial context
    result.has_financial_context = this.checkFinancialContext(message);
    
    // Check for direct request
    result.has_direct_request = this.checkDirectRequest(message);
    
    // Determine urgency level
    result.urgency_level = this.determineUrgencyLevel(message);

    return result;
  }

  calculateRuleScore(message, history, result) {
    let score = 0;
    let hasUrgency = false;

    // Check current message
    for (const indicator of SCAM_PATTERNS) {
      if (indicator.pattern.test(message)) {
        score += indicator.weight;
        result.indicators.push({
          category: indicator.category,
          weight: indicator.weight,
          matched: message.match(indicator.pattern)?.[0]
        });
        result.risk_factors.push(indicator.category);
        if (indicator.urgency_boost) hasUrgency = true;
      }
    }

    // Check conversation history (accumulative evidence)
    for (const msg of history) {
      for (const indicator of SCAM_PATTERNS) {
        if (indicator.pattern.test(msg)) {
          score += indicator.weight * 0.4; // 40% weight for history
        }
      }
    }

    // Apply urgency boost
    if (hasUrgency && score > 0.25) {
      score *= this.urgencyMultiplier;
    }

    return Math.min(score, 1.0);
  }

  calculateKeywordScore(message, result) {
    let risk = 0;
    const lowerMsg = message.toLowerCase();

    for (const keyword of HIGH_RISK_KEYWORDS) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        risk += 0.12;
        if (!result.risk_factors.includes('high_risk_keyword')) {
          result.risk_factors.push('high_risk_keyword');
        }
      }
    }

    for (const keyword of MEDIUM_RISK_KEYWORDS) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        risk += 0.06;
      }
    }

    return Math.min(risk, 1.0);
  }

  calculateBehavioralScore(message, history, result) {
    let risk = 0;

    // Quick escalation check (scammers often escalate quickly)
    if (history.length > 0 && history.length <= 5) {
      const financialKeywords = ['money', 'payment', 'transfer', 'send', 'bank', 'upi', 'otp', 'verify'];
      let escalationCount = 0;
      
      for (const msg of history) {
        if (financialKeywords.some(k => msg.toLowerCase().includes(k))) {
          escalationCount++;
        }
      }
      
      if (escalationCount >= 2) {
        risk += 0.18;
        result.risk_factors.push('quick_escalation');
      }
    }

    // Check for emotional manipulation
    const manipulationPatterns = [
      /i need your help/i,
      /trust me/i,
      /between you and me/i,
      /our little secret/i,
      /don't tell anyone/i,
      /only for you/i,
      /special offer/i,
      /exclusive/i
    ];
    
    for (const pattern of manipulationPatterns) {
      if (pattern.test(message)) {
        risk += 0.08;
        if (!result.risk_factors.includes('manipulation')) {
          result.risk_factors.push('manipulation');
        }
      }
    }

    // Pressure tactics
    const pressurePatterns = [
      /last chance/i,
      /final warning/i,
      /no other option/i,
      /only way/i,
      /must (do|act|respond)/i
    ];

    for (const pattern of pressurePatterns) {
      if (pattern.test(message)) {
        risk += 0.10;
        if (!result.risk_factors.includes('pressure_tactics')) {
          result.risk_factors.push('pressure_tactics');
        }
      }
    }

    return Math.min(risk, 1.0);
  }

  calculateContextScore(message, result) {
    let score = 0;
    
    for (const pattern of SCAM_CONTEXT_PHRASES) {
      if (pattern.test(message)) {
        score += 0.12;
        if (!result.risk_factors.includes('scam_context')) {
          result.risk_factors.push('scam_context');
        }
      }
    }
    
    return Math.min(score, 1.0);
  }

  determineScamType(indicators) {
    if (indicators.length === 0) return null;

    const categoryCounts = {};
    for (const indicator of indicators) {
      categoryCounts[indicator.category] = (categoryCounts[indicator.category] || 0) + indicator.weight;
    }

    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (!topCategory) return 'general_scam';

    const typeMap = {
      'financial': 'bank_fraud',
      'credential': 'otp_fraud',
      'verification': 'kyc_scam',
      'prize': 'lottery_scam',
      'romance': 'romance_scam',
      'employment': 'job_scam',
      'authority': 'impersonation_scam',
      'urgency': 'urgent_scam',
      'threat': 'threat_scam',
      'loan': 'loan_scam',
      'contact': 'phishing_scam'
    };

    return typeMap[topCategory[0]] || 'general_scam';
  }

  checkFinancialContext(message) {
    const financialPatterns = [
      /money|payment|transfer|bank|account/i,
      /upi|gpay|phonepe|paytm|bhim/i,
      /send|receive|deposit|withdraw/i,
      /fee|charge|cost|price|amount|rs\.?|rupees|inr/i,
      /loan|credit|emi|interest/i
    ];
    return financialPatterns.some(p => p.test(message));
  }

  checkDirectRequest(message) {
    const requestPatterns = [
      /send (me|us|your|the)/i,
      /transfer (me|us|to)/i,
      /give (me|us|your)/i,
      /pay (me|us|to|now)/i,
      /share (your|the|otp|password|pin)/i,
      /click (here|on|this|the link)/i,
      /download (this|the) app/i,
      /call (me|this number|now)/i,
      /verify (your|now|immediately)/i
    ];
    return requestPatterns.some(p => p.test(message));
  }

  determineUrgencyLevel(message) {
    const urgencyPatterns = [
      { pattern: /urgent|immediately|asap|right now|this moment/i, level: 'critical' },
      { pattern: /within \d+ (minutes?|hours?)|today|tonight/i, level: 'high' },
      { pattern: /soon|this week|within \d+ days/i, level: 'medium' },
      { pattern: /when possible|at your convenience/i, level: 'low' }
    ];

    for (const { pattern, level } of urgencyPatterns) {
      if (pattern.test(message)) return level;
    }
    return 'normal';
  }

  /**
   * Get detection statistics
   */
  getStats() {
    return {
      threshold: this.threshold,
      urgencyMultiplier: this.urgencyMultiplier,
      patternCount: SCAM_PATTERNS.length,
      highRiskKeywords: HIGH_RISK_KEYWORDS.length,
      mediumRiskKeywords: MEDIUM_RISK_KEYWORDS.length,
      contextPhrases: SCAM_CONTEXT_PHRASES.length
    };
  }
}

module.exports = { ScamDetector };
