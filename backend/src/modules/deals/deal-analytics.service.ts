import { HealthStatus, RiskSignal, RiskAssessment } from './deals.types.js';

export class DealAnalyticsService {
  computeEngagementScore(views: any[]): number {
    if (!views.length) return 0;
    
    let totalDuration = 0;
    let maxCompletion = 0;
    let visitCount = views.length;
    let lastVisit = views[0].viewedAt;

    for (const v of views) {
      totalDuration += Number(v.duration) || 0;
      const completion = v.totalPages > 0 ? (Number(v.pagesViewed) || 0) / Number(v.totalPages) : 0;
      maxCompletion = Math.max(maxCompletion, completion);
      if (v.viewedAt > lastVisit) lastVisit = v.viewedAt;
    }

    const timeScore = Math.min(25, (totalDuration / 600) * 25);
    const completionScore = maxCompletion * 25;
    const visitScore = Math.min(25, (visitCount / 5) * 25);
    const daysSinceLastVisit = (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 25 - (daysSinceLastVisit / 30) * 25);

    return Math.round(timeScore + completionScore + visitScore + recencyScore);
  }

  computeHealthStatus(riskScore: number): HealthStatus {
    if (riskScore >= 70) return 'healthy';
    if (riskScore >= 40) return 'at_risk';
    return 'critical';
  }

  async assessRisk(deal: any, stakeholders: any[], allViews: any[]): Promise<RiskAssessment> {
    let riskScore = 100;
    const signals: RiskSignal[] = [];

    const stakeholderScores = stakeholders.map((s) => {
      const myViews = allViews.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = this.computeEngagementScore(myViews);
      const lastView = myViews.length > 0 ? myViews[0].viewedAt : null;
      return { ...s, score, lastView, viewCount: myViews.length };
    });

    // Signal 1: stalled
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentViews = allViews.filter((v) => v.viewedAt >= sevenDaysAgo);
    if (allViews.length > 0 && recentViews.length === 0) {
      signals.push({
        signal: 'stalled',
        severity: 'high',
        penalty: -30,
        description: 'No document views in the last 7 days',
      });
      riskScore -= 30;
    }

    // Signal 2: single_threaded
    if (stakeholders.length > 1) {
      const engagingCount = stakeholderScores.filter((s) => s.viewCount > 0).length;
      if (engagingCount <= 1) {
        signals.push({
          signal: 'single_threaded',
          severity: 'medium',
          penalty: -20,
          description: `Only ${engagingCount} of ${stakeholders.length} stakeholders have engaged`,
        });
        riskScore -= 20;
      }
    }

    // Signal 3: champion_weak
    const champion = stakeholderScores.find((s) => s.role === 'champion');
    if (champion) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const championOldViews = allViews.filter(
        (v) => v.viewerEmail && v.viewerEmail.toLowerCase() === champion.email.toLowerCase() && v.viewedAt < fourteenDaysAgo
      );
      const oldScore = this.computeEngagementScore(championOldViews);
      if (oldScore > 0 && oldScore - champion.score > 15) {
        signals.push({
          signal: 'champion_weak',
          severity: 'high',
          penalty: -25,
          description: `Champion engagement dropped from ${oldScore} to ${champion.score}`,
        });
        riskScore -= 25;
      }
    }

    // Signal 4: legal_delay
    if (deal.stage === 'negotiation') {
      const legalStakeholder = stakeholderScores.find((s) => s.role === 'legal');
      if (legalStakeholder && legalStakeholder.viewCount === 0) {
        signals.push({
          signal: 'legal_delay',
          severity: 'medium',
          penalty: -15,
          description: 'Legal stakeholder has not viewed any documents',
        });
        riskScore -= 15;
      }
    }

    // Signal 5: ghost_risk
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    let ghostPenalty = 0;
    for (const s of stakeholderScores) {
      if (s.viewCount === 1 && s.lastView && s.lastView < fiveDaysAgo) {
        if (ghostPenalty < 20) {
          signals.push({
            signal: 'ghost_risk',
            severity: 'low',
            penalty: -10,
            description: `${s.name} viewed once but went silent`,
          });
          ghostPenalty += 10;
          riskScore -= 10;
        }
      }
    }

    riskScore = Math.max(0, riskScore);
    const healthStatus = this.computeHealthStatus(riskScore);

    return {
      riskScore,
      healthStatus,
      signals,
      stakeholderScores: stakeholderScores.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        score: s.score,
        viewCount: s.viewCount,
        lastView: s.lastView,
      })),
    };
  }

  computeIntentGraph(stakeholders: any[], wsDocs: any[], views: any[]) {
    // Build stakeholder nodes
    const stakeholderNodes = stakeholders.map((s) => {
      const myViews = views.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = this.computeEngagementScore(myViews);
      return {
        id: `s-${s.id}`,
        type: 'stakeholder',
        name: s.name,
        email: s.email,
        role: s.role,
        score,
        tier: score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold',
      };
    });

    // Build document nodes
    const documentNodes = wsDocs.map((d) => {
      const docViews = views.filter((v) => v.documentId === d.documentId);
      return {
        id: `d-${d.documentId}`,
        type: 'document',
        title: d.title,
        totalViews: docViews.length,
      };
    });

    // Build edges
    const edges = [];
    for (const s of stakeholders) {
      const myViews = views.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const byDoc: Record<number, { totalTime: number; maxCompletion: number; views: number }> = {};
      
      for (const v of myViews) {
        if (!byDoc[v.documentId]) byDoc[v.documentId] = { totalTime: 0, maxCompletion: 0, views: 0 };
        byDoc[v.documentId].totalTime += Number(v.duration) || 0;
        const comp = v.totalPages > 0 ? (Number(v.pagesViewed) || 0) / Number(v.totalPages) : 0;
        byDoc[v.documentId].maxCompletion = Math.max(byDoc[v.documentId].maxCompletion, comp);
        byDoc[v.documentId].views += 1;
      }
      
      for (const [docId, data] of Object.entries(byDoc)) {
        edges.push({
          source: `s-${s.id}`,
          target: `d-${docId}`,
          timeSpent: data.totalTime,
          completion: Math.round(data.maxCompletion * 100),
          views: data.views,
        });
      }
    }

    return { stakeholderNodes, documentNodes, edges };
  }

  computeActions(deal: any, stakeholders: any[], allViews: any[]) {
    const actions = [];
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const stakeholderScores = stakeholders.map((s) => {
      const myViews = allViews.filter((v) => v.viewerEmail && v.viewerEmail.toLowerCase() === s.email.toLowerCase());
      const score = this.computeEngagementScore(myViews);
      const lastView = myViews.length > 0 ? myViews[0].viewedAt : null;
      return { ...s, score, lastView, viewCount: myViews.length, views: myViews };
    });

    const engagingCount = stakeholderScores.filter((s) => s.viewCount > 0).length;

    // 1. re_engage_stalled
    for (const s of stakeholderScores) {
      if (s.viewCount > 0 && s.lastView && s.lastView < eightDaysAgo) {
        actions.push({
          action: 're_engage_stalled',
          priority: 'high',
          type: 'contact',
          target: s.name,
          email: s.email,
          description: `Re-engage ${s.name} — no activity in 8+ days`,
        });
      }
    }

    // 2. expand_thread
    if (stakeholders.length > 1 && engagingCount <= 1) {
      const inactive = stakeholderScores.filter((s) => s.viewCount === 0);
      for (const s of inactive) {
        actions.push({
          action: 'expand_thread',
          priority: 'high',
          type: 'contact',
          target: s.name,
          email: s.email,
          description: `Bring ${s.name} (${s.role}) into the conversation — deal is single-threaded`,
        });
      }
    }

    // 3. add_technical
    const advancedStages = ['proposal', 'negotiation', 'closed_won'];
    if (advancedStages.includes(deal.stage)) {
      const hasTechnical = stakeholders.some((s) => s.role === 'technical');
      if (!hasTechnical) {
        actions.push({
          action: 'add_technical',
          priority: 'medium',
          type: 'contact',
          target: null,
          description: 'Add a technical stakeholder — deal is in advanced stage with no technical reviewer',
        });
      }
    }

    // 4. send_updated_pricing
    for (const s of stakeholderScores) {
      for (const v of s.views) {
        if ((Number(v.duration) || 0) >= 180) {
          actions.push({
            action: 'send_updated_pricing',
            priority: 'high',
            type: 'send_doc',
            target: s.name,
            email: s.email,
            description: `${s.name} spent ${Math.round((Number(v.duration) || 0) / 60)}+ min on "${v.documentTitle}" — consider sending updated materials`,
          });
          break;
        }
      }
    }

    // 5. schedule_followup
    for (const s of stakeholderScores) {
      if (s.role === 'decision_maker' || s.role === 'champion') {
        const recentHighCompletion = s.views.some((v: any) => {
          const completion = v.totalPages > 0 ? (Number(v.pagesViewed) || 0) / Number(v.totalPages) : 0;
          return completion >= 0.85 && v.viewedAt >= fortyEightHoursAgo;
        });
        if (recentHighCompletion) {
          actions.push({
            action: 'schedule_followup',
            priority: 'high',
            type: 'schedule',
            target: s.name,
            email: s.email,
            description: `Schedule follow-up with ${s.name} — they completed 85%+ of a document recently`,
          });
        }
      }
    }

    // 6. champion_cooling
    const champion = stakeholderScores.find((s) => s.role === 'champion');
    if (champion) {
      const championOldViews = allViews.filter(
        (v) => v.viewerEmail && v.viewerEmail.toLowerCase() === champion.email.toLowerCase() && v.viewedAt < fourteenDaysAgo
      );
      const oldScore = this.computeEngagementScore(championOldViews);
      if (oldScore > 0 && oldScore - champion.score > 15) {
        actions.push({
          action: 'champion_cooling',
          priority: 'high',
          type: 'contact',
          target: champion.name,
          email: champion.email,
          description: `Champion ${champion.name} engagement cooling down — dropped from ${oldScore} to ${champion.score}`,
        });
      }
    }

    return actions;
  }
}
