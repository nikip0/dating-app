import { UserProfile, ChatMessage, SimulationResult, SimulationSummary } from './types';
import { generateSimulation, analyzeVibe, callLLM, LLMMessage } from './llm';

/**
 * Run 50 simulated dating scenarios based on user profile and chat history
 */
export async function runSimulations(
  profile: UserProfile,
  chatHistory: ChatMessage[]
): Promise<SimulationSummary> {
  console.log('[Simulations] Starting 50 scenario simulations...');

  // Build profile summary
  const profileSummary = buildProfileSummary(profile, chatHistory);

  // Analyze user's vibe from their chat messages
  const userMessages = chatHistory
    .filter(msg => msg.sender === 'user')
    .map(msg => msg.content);

  const vibeAnalysis = await analyzeVibe(profile.bio, userMessages);

  // Generate 50 simulations
  const simulations: SimulationResult[] = [];
  for (let i = 0; i < 50; i++) {
    const simulation = await generateSimulation(profileSummary, i);
    simulations.push(simulation);

    // Log progress every 10 simulations
    if ((i + 1) % 10 === 0) {
      console.log(`[Simulations] Completed ${i + 1}/50 scenarios`);
    }
  }

  // Analyze results
  const summary = await analyzeSimulations(simulations, vibeAnalysis, profile);

  console.log('[Simulations] All simulations complete!');
  return summary;
}

/**
 * Build a structured profile summary for LLM context
 */
function buildProfileSummary(profile: UserProfile, chatHistory: ChatMessage[]): string {
  const userMessages = chatHistory
    .filter(msg => msg.sender === 'user')
    .slice(-10) // Last 10 messages
    .map(msg => msg.content);

  return `
Profile Summary:
- Name: ${profile.name}
- Age Range: ${profile.ageRange}
- Gender: ${profile.gender}
- Interested In: ${profile.interestedIn}
- Bio: ${profile.bio}
- Relationship Goals: ${profile.relationshipGoals}
- Texting Style: ${profile.textingTone.positivity}% positive, ${profile.textingTone.playfulness}% playful, ${profile.textingTone.responseLength}% verbose
- Self-rated Attractiveness: ${profile.selfRatedAttractiveness || 'Not specified'}/5
- Recent Messages: ${userMessages.join(' | ')}
`.trim();
}

/**
 * Analyze simulation results and generate insights
 */
async function analyzeSimulations(
  simulations: SimulationResult[],
  vibeAnalysis: any,
  profile: UserProfile
): Promise<SimulationSummary> {
  // Calculate average compatibility
  const totalCompatibility = simulations.reduce((sum, sim) => sum + sim.compatibility_score, 0);
  const averageCompatibility = Math.round(totalCompatibility / simulations.length);

  // Find top archetypes (highest compatibility scores)
  const archetypeScores = new Map<string, number[]>();
  simulations.forEach(sim => {
    if (!archetypeScores.has(sim.match_archetype)) {
      archetypeScores.set(sim.match_archetype, []);
    }
    archetypeScores.get(sim.match_archetype)!.push(sim.compatibility_score);
  });

  const topArchetypes = Array.from(archetypeScores.entries())
    .map(([archetype, scores]) => ({
      archetype,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)
    .map(item => item.archetype);

  // Extract common issues
  const issues = simulations
    .map(sim => sim.potential_issue)
    .filter((issue): issue is string => issue !== null && issue !== undefined);

  const issueFrequency = new Map<string, number>();
  issues.forEach(issue => {
    issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1);
  });

  const commonIssues = Array.from(issueFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(item => item[0]);

  // Generate coaching tips based on patterns
  const coachingTips = generateCoachingTips(profile, vibeAnalysis, commonIssues, averageCompatibility);

  // Generate suggested openers
  const suggestedOpeners = generateOpeners(profile, vibeAnalysis);

  // Build vibe analysis summary
  const vibeAnalysisSummary = {
    overall_impression: buildOverallImpression(vibeAnalysis, averageCompatibility),
    strengths: identifyStrengths(profile, vibeAnalysis, averageCompatibility),
    areas_to_improve: identifyImprovements(commonIssues, vibeAnalysis)
  };

  return {
    total_simulations: 50,
    average_compatibility: averageCompatibility,
    top_archetypes: topArchetypes,
    common_issues: commonIssues,
    coaching_tips: coachingTips,
    suggested_openers: suggestedOpeners,
    vibe_analysis: vibeAnalysisSummary
  };
}

function generateCoachingTips(
  profile: UserProfile,
  vibeAnalysis: any,
  commonIssues: string[],
  avgCompatibility: number
): string[] {
  const tips: string[] = [];

  // Tip based on compatibility score
  if (avgCompatibility >= 75) {
    tips.push('Your vibe is strong! Keep being authentic and let your personality shine through.');
  } else if (avgCompatibility >= 60) {
    tips.push('You have good potential. Focus on showing more of your unique interests and values.');
  } else {
    tips.push('Consider refining your approach. Be more specific about your interests and what makes you unique.');
  }

  // Tip based on texting tone
  if (profile.textingTone.positivity < 50) {
    tips.push('Try incorporating more positive language and enthusiasm in your messages.');
  }

  if (profile.textingTone.playfulness < 40) {
    tips.push('Don\'t be afraid to be a bit more playful and show your sense of humor.');
  } else if (profile.textingTone.playfulness > 80) {
    tips.push('Balance your playfulness with moments of genuine depth and sincerity.');
  }

  if (profile.textingTone.responseLength < 30) {
    tips.push('Your responses might be too brief. Try sharing a bit more to keep conversations flowing.');
  } else if (profile.textingTone.responseLength > 80) {
    tips.push('Keep your messages concise. Long responses can sometimes overwhelm the conversation.');
  }

  // Tip based on common issues
  if (commonIssues.some(issue => issue.includes('question'))) {
    tips.push('Ask more open-ended questions to show genuine interest and keep the conversation balanced.');
  }

  if (commonIssues.some(issue => issue.includes('eager') || issue.includes('enthusias'))) {
    tips.push('Let conversations breathe naturally. Sometimes less is more when building connection.');
  }

  return tips.slice(0, 5); // Return top 5 tips
}

function generateOpeners(profile: UserProfile, vibeAnalysis: any): string[] {
  return [
    `Hey! I noticed [specific detail from their profile] - that's really cool. What got you into that?`,
    `Hi there! Your profile caught my eye. Quick question: ${profile.relationshipGoals.includes('casual') ? 'what\'s your favorite spontaneous activity?' : 'what\'s something you\'re passionate about?'}`,
    `Hey! I had to reach out - ${profile.textingTone.playfulness > 60 ? 'you seem like you\'d be fun to grab coffee with' : 'we seem to have similar interests'}. How's your [day/week] going?`,
    `Hi! I'm curious - [question based on their interests]. Also, ${profile.textingTone.playfulness > 60 ? 'coffee or tea? (This is important)' : 'what brings you to [dating app]?'}`,
    `Hey there! I saw you mentioned [interest] in your profile. I'm actually into that too! What's been your recent favorite?`
  ];
}

function buildOverallImpression(vibeAnalysis: any, avgCompatibility: number): string {
  const tone = vibeAnalysis.overall_tone || 'positive';
  const energy = vibeAnalysis.energy_level || 'medium';
  const style = vibeAnalysis.communication_style || 'friendly';

  if (avgCompatibility >= 75) {
    return `You come across as ${style} with a ${tone} energy. Your ${energy} enthusiasm is appealing and you seem genuinely interested in making connections. People likely find you approachable and authentic.`;
  } else if (avgCompatibility >= 60) {
    return `You have a ${style} vibe with ${tone} energy. While you're making good connections, there's room to let more of your personality shine through in conversations.`;
  } else {
    return `Your communication style is ${style} but could benefit from more ${tone === 'positive' ? 'consistency' : 'positivity'}. Focus on being more open and engaging in your approach.`;
  }
}

function identifyStrengths(profile: UserProfile, vibeAnalysis: any, avgCompatibility: number): string[] {
  const strengths: string[] = [];

  if (profile.textingTone.positivity >= 70) {
    strengths.push('Positive and upbeat communication style');
  }

  if (profile.textingTone.playfulness >= 60) {
    strengths.push('Good sense of humor and playfulness');
  }

  if (profile.bio.length > 50) {
    strengths.push('Clear about who you are and what you want');
  }

  if (avgCompatibility >= 70) {
    strengths.push('Strong overall compatibility with diverse personality types');
  }

  if (vibeAnalysis.key_traits?.includes('authentic')) {
    strengths.push('Authentic and genuine in your interactions');
  }

  if (profile.textingTone.responseLength >= 40 && profile.textingTone.responseLength <= 70) {
    strengths.push('Well-balanced message length - not too brief, not too long');
  }

  return strengths.length > 0 ? strengths : ['Open to new connections', 'Willing to put yourself out there'];
}

function identifyImprovements(commonIssues: string[], vibeAnalysis: any): string[] {
  const improvements: string[] = [];

  commonIssues.forEach(issue => {
    if (issue.includes('question')) {
      improvements.push('Ask more engaging questions to show genuine curiosity');
    } else if (issue.includes('eager')) {
      improvements.push('Let conversations develop naturally without rushing');
    } else if (issue.includes('brief')) {
      improvements.push('Share more details to give matches something to respond to');
    } else if (issue.includes('sharing')) {
      improvements.push('Build rapport gradually rather than over-sharing early');
    }
  });

  // Remove duplicates
  return Array.from(new Set(improvements)).slice(0, 4);
}
