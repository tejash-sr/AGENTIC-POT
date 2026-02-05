/**
 * Response Validation & Safety Layer
 * 
 * Filters forbidden phrases, controls output length, and provides fallbacks.
 */

// Forbidden patterns that must never appear in responses
const FORBIDDEN_PATTERNS = [
  // Critical - Never allow
  { pattern: /\b(scammer|fraud|fake|con artist|thief)\b/i, severity: 'critical', action: 'block' },
  { pattern: /\b(police|investigation|arrest|jail|legal action|report)\b/i, severity: 'critical', action: 'block' },
  { pattern: /\b(i know you're|i can tell|you're a|you scammed)\b/i, severity: 'critical', action: 'block' },
  { pattern: /\b(i'm an ai|i'm a bot|i'm not human|ai model)\b/i, severity: 'critical', action: 'block' },
  
  // High - Replace or block
  { pattern: /\b(scam|fraudulent|suspicious)\b/i, severity: 'high', action: 'replace', replacement: 'concerned' },
  { pattern: /\b(fbi|cia|court|lawyer|attorney)\b/i, severity: 'high', action: 'replace', replacement: '[redacted]' },
  
  // Medium - Warn
  { pattern: /\b(verify|confirm|check)\s+(your|that)/i, severity: 'medium', action: 'warn' }
];

// Revealing AI patterns
const REVEALING_PATTERNS = [
  /as an ai/i,
  /i was designed/i,
  /my programming/i,
  /i cannot/i,
  /i'm not allowed/i,
  /system prompt/i
];

// Length constraints by state
const LENGTH_CONSTRAINTS = {
  INITIAL: { min: 20, max: 100, optimal: { min: 40, max: 80 } },
  GREETING: { min: 30, max: 150, optimal: { min: 50, max: 120 } },
  BUILDING_RAPPORT: { min: 30, max: 150, optimal: { min: 50, max: 120 } },
  FINANCIAL_CONTEXT: { min: 40, max: 180, optimal: { min: 60, max: 140 } },
  REQUEST: { min: 30, max: 200, optimal: { min: 50, max: 150 } },
  EXTRACTION: { min: 25, max: 250, optimal: { min: 40, max: 180 } },
  SUSPICIOUS: { min: 20, max: 120, optimal: { min: 35, max: 90 } },
  CLOSING: { min: 30, max: 150, optimal: { min: 45, max: 120 } }
};

// Fallback responses
const FALLBACK_RESPONSES = [
  "Hey sorry about that! Work got chaotic for a moment. What were we discussing? I want to make sure I didn't miss anything important.",
  "I apologize if I seem distracted! My day has been incredibly hectic. I am genuinely interested in what you're saying. Can you please continue?",
  "OK I think I've been overthinking this. I'm actually quite interested in this opportunity. Can you tell me what the next steps would be?",
  "I'm really sorry, I got completely distracted! Work has been crazy today. Can you remind me what we were talking about?"
];

class ResponseValidator {
  constructor(config = {}) {
    this.forbiddenPatterns = config.forbiddenPatterns || FORBIDDEN_PATTERNS;
    this.revealingPatterns = config.revealingPatterns || REVEALING_PATTERNS;
    this.lengthConstraints = config.lengthConstraints || LENGTH_CONSTRAINTS;
    this.fallbackResponses = config.fallbackResponses || FALLBACK_RESPONSES;
  }

  /**
   * Validate and clean a response
   * @param {string} response - Response to validate
   * @param {string} state - Current state
   * @returns {Object} Validation result
   */
  validate(response, state) {
    const violations = [];
    let cleaned = response;

    // Check for forbidden patterns
    for (const forbidden of this.forbiddenPatterns) {
      if (forbidden.pattern.test(cleaned)) {
        const match = cleaned.match(forbidden.pattern);
        violations.push({
          pattern: forbidden.pattern.source,
          severity: forbidden.severity,
          matchedText: match?.[0] || '',
          action: forbidden.action
        });
      }
    }

    // Check for revealing AI patterns
    for (const pattern of this.revealingPatterns) {
      if (pattern.test(cleaned)) {
        const match = cleaned.match(pattern);
        violations.push({
          pattern: pattern.source,
          severity: 'critical',
          matchedText: match?.[0] || '',
          action: 'block'
        });
      }
    }

    // Apply replacements for non-blocking violations
    for (const violation of violations.filter(v => v.action === 'replace')) {
      cleaned = cleaned.replace(
        new RegExp(violation.pattern, 'gi'),
        violation.replacement || '[filtered]'
      );
    }

    // Remove violations from the violations list that were replaced
    violations.filter(v => v.action !== 'replace');

    // Check if any critical violations remain
    const hasCriticalViolation = violations.some(v => v.action === 'block');

    // Validate length
    const lengthValidation = this.validateLength(cleaned, state);
    if (!lengthValidation.isValid) {
      cleaned = lengthValidation.adjusted;
    }

    return {
      is_valid: !hasCriticalViolation,
      cleaned_response: cleaned,
      violations,
      length_valid: lengthValidation.isValid
    };
  }

  /**
   * Validate response length
   * @param {string} response - Response to validate
   * @param {string} state - Current state
   * @returns {Object} Length validation result
   */
  validateLength(response, state) {
    const constraints = this.lengthConstraints[state] || this.lengthConstraints.GREETING;
    const charCount = response.length;

    if (charCount >= constraints.min && charCount <= constraints.max) {
      return {
        isValid: true,
        adjusted: response
      };
    }

    let adjusted = response;

    if (charCount < constraints.min) {
      adjusted = this.padResponse(response, constraints.min);
    } else if (charCount > constraints.max) {
      adjusted = this.truncateResponse(response, constraints.max);
    }

    return {
      isValid: adjusted.length >= constraints.min,
      adjusted
    };
  }

  /**
   * Pad response to minimum length
   * @param {string} response - Response to pad
   * @param {number} targetLength - Target length
   * @returns {string} Padded response
   */
  padResponse(response, targetLength) {
    const paddingOptions = [
      " Let me know what you think!",
      " What do you think about that?",
      " I'm curious to hear more.",
      " That sounds interesting to me.",
      " How does that work exactly?"
    ];

    let padded = response;
    while (padded.length < targetLength && paddingOptions.length > 0) {
      const padding = paddingOptions.splice(
        Math.floor(Math.random() * paddingOptions.length),
        1
      )[0];
      padded += padding;
    }

    return padded;
  }

  /**
   * Truncate response to maximum length
   * @param {string} response - Response to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated response
   */
  truncateResponse(response, maxLength) {
    if (response.length <= maxLength) return response;

    // Try to cut at sentence boundary
    const sentences = response.split(/[.!?]+/);
    let truncated = '';

    for (const sentence of sentences) {
      if ((truncated + sentence).length < maxLength - 3) {
        truncated += sentence + '.';
      } else {
        break;
      }
    }

    return truncated.trim() + '...';
  }

  /**
   * Get a fallback response
   * @param {string} state - Current state
   * @param {number} consecutiveFallbacks - Number of consecutive fallbacks
   * @returns {string} Fallback response
   */
  getFallbackResponse(state, consecutiveFallbacks) {
    if (consecutiveFallbacks >= 3) {
      return "I'm really sorry but I have to go now. Emergency situation. Hope we can talk again soon!";
    }

    return this.fallbackResponses[consecutiveFallbacks % this.fallbackResponses.length];
  }

  /**
   * Check for specific forbidden content
   * @param {string} content - Content to check
   * @returns {Object} Check result
   */
  checkForbidden(content) {
    const matches = [];

    for (const pattern of this.forbiddenPatterns) {
      if (pattern.pattern.test(content)) {
        matches.push({
          pattern: pattern.pattern.source,
          severity: pattern.severity,
          action: pattern.action
        });
      }
    }

    return {
      hasForbidden: matches.length > 0,
      matches
    };
  }

  /**
   * Sanitize content by removing or replacing forbidden elements
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized content
   */
  sanitize(content) {
    let sanitized = content;

    for (const pattern of this.forbiddenPatterns) {
      if (pattern.action === 'replace') {
        sanitized = sanitized.replace(
          new RegExp(pattern.pattern, 'gi'),
          pattern.replacement || '[filtered]'
        );
      }
    }

    return sanitized;
  }
}

module.exports = { ResponseValidator };
