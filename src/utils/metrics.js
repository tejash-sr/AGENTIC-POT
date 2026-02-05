/**
 * Metrics Tracker
 * 
 * Tracks conversation metrics and calculates engagement scores.
 * Optimizes for scoring criteria.
 */

class MetricsTracker {
  constructor(config = {}) {
    this.conversations = [];
    this.sessionStats = {
      totalConversations: 0,
      totalTurns: 0,
      totalDuration: 0,
      totalIntelligenceItems: 0,
      totalExtractionScore: 0,
      totalSafetyViolations: 0
    };
  }

  /**
   * Record a conversation response
   * @param {Object} response - Response data
   */
  recordConversation(response) {
    const metrics = response.metrics;
    const intelligence = response.intelligence;

    const conversationRecord = {
      conversation_id: response.conversation_id,
      turn_count: metrics.turn_count,
      engagement_duration_ms: metrics.engagement_duration_ms,
      extraction_score: metrics.extraction_score,
      persona_consistency: metrics.persona_consistency,
      intelligence_items: intelligence.extracted?.length || 0,
      is_scam: intelligence.is_scam,
      scam_confidence: intelligence.scam_confidence,
      state: response.state.current,
      timestamp: new Date().toISOString()
    };

    this.conversations.push(conversationRecord);

    // Update session stats
    this.sessionStats.totalConversations++;
    this.sessionStats.totalTurns += metrics.turn_count;
    this.sessionStats.totalDuration += metrics.engagement_duration_ms;
    this.sessionStats.totalExtractionScore += metrics.extraction_score;
    this.sessionStats.totalIntelligenceItems += intelligence.extracted?.length || 0;
  }

  /**
   * Get current session metrics
   * @returns {Object} Session metrics
   */
  getMetrics() {
    const stats = this.sessionStats;
    const conversationCount = stats.totalConversations || 1;

    return {
      session: {
        totalConversations: stats.totalConversations,
        averageTurnsPerConversation: (stats.totalTurns / conversationCount).toFixed(2),
        averageDurationMs: Math.round(stats.totalDuration / conversationCount),
        averageExtractionScore: (stats.totalExtractionScore / conversationCount).toFixed(4),
        averageIntelligenceItems: (stats.totalIntelligenceItems / conversationCount).toFixed(2)
      },
      scoring: {
        turnScore: stats.totalTurns * 2,
        durationScore: Math.floor(stats.totalDuration * 0.001),
        intelligenceScore: stats.totalIntelligenceItems * 5,
        extractionScore: (stats.totalExtractionScore * 10).toFixed(2),
        stabilityPenalty: stats.totalSafetyViolations * 3,
        estimatedTotalScore: this.calculateEstimatedScore()
      },
      recentConversations: this.conversations.slice(-10)
    };
  }

  /**
   * Calculate estimated total score
   * @returns {number} Estimated score
   */
  calculateEstimatedScore() {
    const stats = this.sessionStats;
    
    const turnScore = stats.totalTurns * 2;
    const durationScore = Math.floor(stats.totalDuration * 0.001);
    const intelligenceScore = stats.totalIntelligenceItems * 5;
    const extractionScore = stats.totalExtractionScore * 10;
    const stabilityPenalty = stats.totalSafetyViolations * 3;

    return turnScore + durationScore + intelligenceScore + extractionScore - stabilityPenalty;
  }

  /**
   * Calculate engagement score for a conversation
   * @param {Object} conversation - Conversation data
   * @returns {number} Engagement score (0-100)
   */
  calculateEngagementScore(conversation) {
    let score = 0;

    // Turn count contribution (max 30 points)
    const turnScore = Math.min(conversation.turn_count * 1.5, 30);
    score += turnScore;

    // Duration contribution (max 25 points)
    const durationMinutes = conversation.engagement_duration_ms / 60000;
    const durationScore = Math.min(durationMinutes * 2, 25);
    score += durationScore;

    // Intelligence extraction (max 30 points)
    const intelligenceScore = Math.min(conversation.intelligence_items * 5, 30);
    score += intelligenceScore;

    // Extraction confidence (max 10 points)
    const confidenceScore = conversation.extraction_score * 10;
    score += confidenceScore;

    // Persona consistency (max 5 points)
    score += conversation.persona_consistency * 5;

    return Math.min(score, 100);
  }

  /**
   * Get conversation quality assessment
   * @param {Object} conversation - Conversation data
   * @returns {Object} Quality assessment
   */
  assessConversationQuality(conversation) {
    const engagementScore = this.calculateEngagementScore(conversation);
    
    let rating;
    if (engagementScore >= 80) rating = 'excellent';
    else if (engagementScore >= 60) rating = 'good';
    else if (engagementScore >= 40) rating = 'average';
    else if (engagementScore >= 20) rating = 'poor';
    else rating = 'failed';

    return {
      engagementScore: engagementScore.toFixed(2),
      rating,
      strengths: this.identifyStrengths(conversation),
      improvements: this.identifyImprovements(conversation)
    };
  }

  /**
   * Identify conversation strengths
   * @param {Object} conversation - Conversation data
   * @returns {Array} Strengths
   */
  identifyStrengths(conversation) {
    const strengths = [];

    if (conversation.turn_count >= 15) {
      strengths.push('High engagement (15+ turns)');
    }
    if (conversation.engagement_duration_ms >= 600000) {
      strengths.push('Extended engagement (10+ minutes)');
    }
    if (conversation.intelligence_items >= 5) {
      strengths.push('Comprehensive intelligence extraction (5+ items)');
    }
    if (conversation.extraction_score >= 0.8) {
      strengths.push('High confidence extraction');
    }
    if (conversation.persona_consistency >= 0.9) {
      strengths.push('Consistent persona behavior');
    }

    return strengths;
  }

  /**
   * Identify conversation improvements
   * @param {Object} conversation - Conversation data
   * @returns {Array} Improvements
   */
  identifyImprovements(conversation) {
    const improvements = [];

    if (conversation.turn_count < 10) {
      improvements.push('Increase turn count through stalling tactics');
    }
    if (conversation.engagement_duration_ms < 300000) {
      improvements.push('Extend engagement duration with delays');
    }
    if (conversation.intelligence_items < 3) {
      improvements.push('Improve extraction prompts and context validation');
    }
    if (conversation.extraction_score < 0.5) {
      improvements.push('Review regex patterns for better coverage');
    }
    if (conversation.persona_consistency < 0.8) {
      improvements.push('Strengthen persona constraints');
    }

    return improvements;
  }

  /**
   * Get extraction statistics
   * @returns {Object} Extraction stats
   */
  getExtractionStats() {
    const extractionTypes = {};
    let totalItems = 0;
    let highConfidenceItems = 0;

    for (const conv of this.conversations) {
      // Count extracted items from recent conversations
      // In production, track this more precisely
    }

    return {
      totalItems,
      highConfidenceItems,
      byType: extractionTypes
    };
  }

  /**
   * Reset session metrics
   */
  reset() {
    this.conversations = [];
    this.sessionStats = {
      totalConversations: 0,
      totalTurns: 0,
      totalDuration: 0,
      totalIntelligenceItems: 0,
      totalExtractionScore: 0,
      totalSafetyViolations: 0
    };
  }

  /**
   * Export metrics for analysis
   * @returns {Object} Full metrics export
   */
  export() {
    return {
      exportedAt: new Date().toISOString(),
      session: this.getMetrics(),
      conversations: this.conversations,
      extractionStats: this.getExtractionStats()
    };
  }
}

module.exports = { MetricsTracker };
