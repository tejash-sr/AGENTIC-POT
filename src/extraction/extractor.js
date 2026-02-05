/**
 * Intelligence Extraction Engine
 * Enhanced for HCL GUVI Buildathon
 * 
 * Extracts actionable intelligence from scammer messages.
 * Optimized for Indian financial data: UPI IDs, bank accounts, phone numbers, etc.
 */

// Comprehensive extraction patterns for Indian market
const EXTRACTION_PATTERNS = [
  // === UPI IDs (Critical) ===
  {
    type: 'upi',
    // Match common UPI handles: name@bank, name@upi, name@paytm etc
    pattern: /[a-zA-Z0-9._-]+@(upi|paytm|ybl|okaxis|okhdfcbank|okicici|oksbi|apl|axisb|axl|barodampay|citi|citibank|dbs|dlb|federal|freecharge|hdfcbank|hsbc|icici|idbi|idfcfirst|ikwik|imobile|indus|iob|jio|jupiteraxis|kotak|kvb|mahb|obc|payzapp|pnb|pockets|postbank|rbl|sbi|scbl|slicepay|syndicate|tjsb|ubi|uboi|uco|united|upi|waaxis|wahdfcbank|waicici|wasbi|yesbankltd|yesbank)/i,
    confidence: 0.92
  },
  {
    type: 'upi',
    // UPI with upi:// prefix
    pattern: /upi:\/\/pay\?[^\s]+/i,
    confidence: 0.95
  },
  {
    type: 'upi',
    // Generic email-like UPI (excluding common email domains)
    pattern: /[a-zA-Z0-9._-]+@(?!gmail|yahoo|hotmail|outlook|rediff|live|icloud|proton)[a-zA-Z0-9]+/i,
    confidence: 0.75,
    validation: (value) => {
      // Validate it's likely a UPI, not an email
      const domain = value.split('@')[1]?.toLowerCase();
      const emailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediff.com', 'live.com', 'icloud.com', 'protonmail.com'];
      return !emailDomains.some(d => domain?.includes(d.split('.')[0]));
    }
  },
  
  // === Phone Numbers (India format) ===
  {
    type: 'phone',
    // +91 with 10 digit number
    pattern: /(?:\+91[\s.-]?)?[6-9]\d{9}\b/,
    confidence: 0.88,
    validation: (value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length === 10 || digits.length === 12;
    }
  },
  {
    type: 'phone',
    // Phone with spacing: 98765 43210 or 9876-543-210
    pattern: /[6-9]\d{4}[\s.-]?\d{5}\b/,
    confidence: 0.85
  },
  
  // === Bank Account Numbers ===
  {
    type: 'bank_account',
    // 9-18 digit account numbers with context
    pattern: /\b\d{9,18}\b/,
    confidence: 0.65,
    context_required: ['account', 'bank', 'number', 'a/c', 'ac no', 'acc', 'saving', 'current', 'transfer to'],
    validation: (value, context) => {
      // Only accept if there's banking context
      const contextStr = context?.toLowerCase() || '';
      const bankingTerms = ['account', 'bank', 'a/c', 'transfer', 'deposit', 'saving', 'current'];
      return bankingTerms.some(term => contextStr.includes(term));
    }
  },
  
  // === IFSC Codes ===
  {
    type: 'ifsc',
    // Standard IFSC format: 4 letters + 0 + 6 alphanumeric
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/i,
    confidence: 0.95
  },
  
  // === URLs/Phishing Links ===
  {
    type: 'url',
    // Standard URLs
    pattern: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
    confidence: 0.80
  },
  {
    type: 'url',
    // Shortened URLs (high suspicion)
    pattern: /(bit\.ly|tinyurl\.com|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|cutt\.ly|rb\.gy|shorturl\.at)\/[a-zA-Z0-9]+/gi,
    confidence: 0.90
  },
  {
    type: 'url',
    // Suspicious TLD URLs
    pattern: /(?:https?:\/\/)?[a-zA-Z0-9][a-zA-Z0-9-]*\.(tk|ml|ga|cf|gq|xyz|top|work|click|link|info)\b[^\s]*/gi,
    confidence: 0.85
  },
  
  // === Cryptocurrency ===
  {
    type: 'crypto',
    // Bitcoin addresses (Legacy: 1..., SegWit: 3..., Native SegWit: bc1...)
    pattern: /\b(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})\b/,
    confidence: 0.92
  },
  {
    type: 'crypto',
    // Ethereum addresses
    pattern: /\b0x[a-fA-F0-9]{40}\b/,
    confidence: 0.92
  },
  
  // === PAN Card (India) ===
  {
    type: 'pan',
    // PAN format: 5 letters + 4 digits + 1 letter
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i,
    confidence: 0.90
  },
  
  // === Aadhaar (India) ===
  {
    type: 'aadhaar',
    // 12 digit Aadhaar with optional spaces
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    confidence: 0.70,
    context_required: ['aadhaar', 'aadhar', 'uid', 'verify', 'link']
  }
];

// Patterns to extract names
const NAME_PATTERNS = [
  /(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:call me|contact)\s+([A-Z][a-z]+)/i,
  /(?:mr\.?|ms\.?|mrs\.?|shri|smt\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /speaking with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
];

// Patterns to extract organizations
const ORG_PATTERNS = [
  /(?:from|with|at|of)\s+([A-Z][a-zA-Z\s&]+(?:Bank|Ltd|Inc|Pvt|Private|Limited|LLC|Corp|Company|Foundation|Trust|Insurance))/i,
  /([A-Z][a-zA-Z]+)\s+(?:Bank|Customer Care|Support|Helpline)/i,
  /(?:we(?:'re| are) from|i represent|calling from)\s+([A-Z][a-zA-Z\s]+)/i
];

class IntelligenceExtractor {
  constructor(config = {}) {
    this.patterns = config.patterns || EXTRACTION_PATTERNS;
    this.namePatterns = config.namePatterns || NAME_PATTERNS;
    this.orgPatterns = config.orgPatterns || ORG_PATTERNS;
    this.extractedItems = new Map();
    this.conversationIntelligence = new Map();
  }

  /**
   * Extract intelligence from a message
   * @param {string} message - Message to analyze
   * @param {Array} history - Previous messages
   * @returns {Object} Extraction result
   */
  extract(message, history = []) {
    const result = {
      items: [],
      targets: this.getExtractionTargets(message),
      message_context: this.analyzeContext(message)
    };

    // Extract using patterns
    for (const patternInfo of this.patterns) {
      const matches = this.extractMatches(message, patternInfo);
      
      for (const match of matches) {
        const contextValidation = this.validateContext(match, message, patternInfo);
        
        // Skip if context validation fails
        if (patternInfo.context_required && !contextValidation.is_valid) {
          continue;
        }
        
        // Apply custom validation if exists
        if (patternInfo.validation) {
          const passesValidation = patternInfo.validation(match.value, message);
          if (!passesValidation) continue;
        }
        
        const confidence = this.calculateConfidence(match, patternInfo, contextValidation);
        
        result.items.push({
          type: patternInfo.type,
          value: this.cleanValue(match.value, patternInfo.type),
          confidence: confidence,
          source_turn: history.length + 1,
          context: match.context,
          validated: contextValidation.is_valid,
          extraction_method: patternInfo.validation ? 'regex_validated' : 'regex'
        });
      }
    }

    // Extract names
    for (const pattern of this.namePatterns) {
      const matches = this.extractNameMatches(message, pattern);
      result.items.push(...matches);
    }

    // Extract organizations
    for (const pattern of this.orgPatterns) {
      const matches = this.extractOrgMatches(message, pattern);
      result.items.push(...matches);
    }

    // Deduplicate
    result.items = this.deduplicate(result.items);

    // Store for tracking
    this.trackExtractions(result.items);

    return result;
  }

  /**
   * Clean extracted value based on type
   */
  cleanValue(value, type) {
    switch (type) {
      case 'phone':
        // Remove non-digits except leading +
        return value.replace(/[^\d+]/g, '');
      case 'upi':
        return value.toLowerCase().trim();
      case 'url':
        return value.trim();
      case 'bank_account':
        return value.replace(/\D/g, '');
      case 'ifsc':
        return value.toUpperCase();
      case 'pan':
        return value.toUpperCase();
      case 'aadhaar':
        return value.replace(/\D/g, '');
      default:
        return value.trim();
    }
  }

  /**
   * Extract matches using a pattern
   */
  extractMatches(message, patternInfo) {
    const matches = [];
    const regex = new RegExp(patternInfo.pattern, 'gi');
    let match;

    while ((match = regex.exec(message)) !== null) {
      const value = match[0];
      
      matches.push({
        value,
        index: match.index,
        context: this.extractContext(message, match.index, value.length)
      });
    }

    return matches;
  }

  /**
   * Extract name matches
   */
  extractNameMatches(message, pattern) {
    const matches = [];
    const regex = new RegExp(pattern, 'gi');
    let match;

    while ((match = regex.exec(message)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length >= 2 && name.length <= 50) {
        // Filter out common false positives
        const falsePositives = ['Sir', 'Madam', 'Customer', 'User', 'Member', 'Dear'];
        if (!falsePositives.includes(name)) {
          matches.push({
            type: 'name',
            value: name,
            confidence: 0.75,
            source_turn: 1,
            context: match[0],
            validated: true,
            extraction_method: 'pattern'
          });
        }
      }
    }

    return matches;
  }

  /**
   * Extract organization matches
   */
  extractOrgMatches(message, pattern) {
    const matches = [];
    const regex = new RegExp(pattern, 'gi');
    let match;

    while ((match = regex.exec(message)) !== null) {
      const org = match[1]?.trim();
      if (org && org.length >= 3 && org.length <= 100) {
        matches.push({
          type: 'organization',
          value: org,
          confidence: 0.70,
          source_turn: 1,
          context: match[0],
          validated: true,
          extraction_method: 'pattern'
        });
      }
    }

    return matches;
  }

  /**
   * Extract surrounding context for a match
   */
  extractContext(message, index, length) {
    const contextWindow = 40;
    const start = Math.max(0, index - contextWindow);
    const end = Math.min(message.length, index + length + contextWindow);
    
    let context = message.substring(start, end);
    if (start > 0) context = '...' + context;
    if (end < message.length) context = context + '...';
    
    return context;
  }

  /**
   * Validate extraction context
   */
  validateContext(match, message, patternInfo) {
    const lowerMessage = message.toLowerCase();
    
    // If no context required, consider valid
    if (!patternInfo.context_required) {
      return { is_valid: true, keyword_count: 0, indicators: [] };
    }
    
    const keywordCount = patternInfo.context_required.filter(k => 
      lowerMessage.includes(k.toLowerCase())
    ).length;

    return {
      is_valid: keywordCount >= 1,
      keyword_count: keywordCount,
      indicators: patternInfo.context_required.filter(k => lowerMessage.includes(k.toLowerCase()))
    };
  }

  /**
   * Calculate extraction confidence
   */
  calculateConfidence(match, patternInfo, context) {
    let confidence = patternInfo.confidence;
    
    // Context boost
    if (context.is_valid && context.keyword_count >= 2) {
      confidence += 0.08;
    }
    
    // Multiple mentions boost
    if (context.keyword_count >= 3) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get extraction targets based on message content
   */
  getExtractionTargets(message) {
    const lowerMessage = message.toLowerCase();
    const targets = [];
    
    if (/upi|gpay|phonepe|paytm|bhim|payment/i.test(lowerMessage)) {
      targets.push('UPI ID');
    }
    
    if (/bank|account|transfer|ifsc/i.test(lowerMessage)) {
      targets.push('Bank Account', 'IFSC');
    }
    
    if (/link|url|click|website|visit/i.test(lowerMessage)) {
      targets.push('URL');
    }
    
    if (/call|contact|number|whatsapp/i.test(lowerMessage)) {
      targets.push('Phone Number');
    }
    
    if (/name|who|calling from/i.test(lowerMessage)) {
      targets.push('Name');
    }
    
    if (/company|organization|business|bank name/i.test(lowerMessage)) {
      targets.push('Organization');
    }
    
    return targets;
  }

  /**
   * Analyze message context
   */
  analyzeContext(message) {
    return {
      has_payment_language: /payment|transfer|send|pay|upi/i.test(message),
      has_contact_request: /call|reach|contact|whatsapp/i.test(message),
      has_link: /http|www|bit\.ly|click/i.test(message),
      has_name_reference: /name|called|i am|this is/i.test(message),
      has_organization: /company|organization|bank|we/i.test(message),
      has_credential_request: /otp|password|pin|cvv/i.test(message),
      has_verification_request: /verify|update|confirm|kyc/i.test(message)
    };
  }

  /**
   * Deduplicate extraction items
   */
  deduplicate(items) {
    const seen = new Map();
    const result = [];
    
    for (const item of items) {
      const key = `${item.type}:${this.normalizeValue(item.value, item.type)}`;
      
      if (!seen.has(key)) {
        seen.set(key, item);
        result.push(item);
      } else {
        // If duplicate, keep higher confidence
        const existing = seen.get(key);
        if (item.confidence > existing.confidence) {
          existing.confidence = item.confidence;
        }
      }
    }
    
    return result;
  }

  /**
   * Normalize value for comparison
   */
  normalizeValue(value, type) {
    switch (type) {
      case 'phone':
        return value.replace(/\D/g, '').slice(-10);
      case 'upi':
        return value.toLowerCase().trim();
      case 'bank_account':
        return value.replace(/\D/g, '');
      case 'url':
        return value.toLowerCase().replace(/https?:\/\//, '').replace(/\/$/, '');
      case 'crypto':
        return value.toLowerCase();
      case 'ifsc':
        return value.toUpperCase();
      case 'pan':
        return value.toUpperCase();
      case 'aadhaar':
        return value.replace(/\D/g, '');
      default:
        return value.trim().toLowerCase();
    }
  }

  /**
   * Track extractions for statistics
   */
  trackExtractions(items) {
    for (const item of items) {
      const type = item.type;
      if (!this.extractedItems.has(type)) {
        this.extractedItems.set(type, 0);
      }
      this.extractedItems.set(type, this.extractedItems.get(type) + 1);
    }
  }

  /**
   * Get extraction statistics
   */
  getStats() {
    const stats = {};
    for (const [type, count] of this.extractedItems) {
      stats[type] = count;
    }
    return stats;
  }
}

module.exports = { IntelligenceExtractor };
