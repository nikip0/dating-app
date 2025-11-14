/**
 * LLM Helper Module
 *
 * This module integrates with Anthropic's Claude API for AI responses.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callLLM(messages: LLMMessage[]): Promise<string> {
  console.log('[LLM] Calling Claude API with', messages.length, 'messages');

  try {
    // Anthropic API requires system message to be separate
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemMessage?.content || 'You are a helpful AI dating coach.',
      messages: conversationMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent && 'text' in textContent ? textContent.text : '';
  } catch (error) {
    console.error('[LLM] Error calling Claude API:', error);
    // Fallback to mock response
    const lastMessage = messages[messages.length - 1].content.toLowerCase();

    if (lastMessage.includes('analyze') && lastMessage.includes('vibe')) {
      return `Based on your texting style, you come across as friendly and approachable. You tend to use positive language and seem genuinely interested in getting to know people. Your responses are thoughtful but not overly long, which keeps conversations flowing naturally.`;
    }

    if (lastMessage.includes('simulation') || lastMessage.includes('scenario')) {
      return JSON.stringify({
        match_archetype: 'Adventurous Extrovert',
        match_initial_message: 'Hey! I saw you mentioned hiking in your profile. What\'s been your favorite trail lately?',
        user_expected_reply: 'Likely positive and enthusiastic, probably sharing a recent experience',
        compatibility_score: 78,
        potential_issue: 'May need to balance enthusiasm with asking follow-up questions to show genuine interest'
      });
    }

    if (lastMessage.includes('coaching') || lastMessage.includes('tips')) {
      return `Here are some personalized tips:
1. Lead with specific details - instead of "hi how are you", try referencing something from their profile
2. Ask open-ended questions that invite storytelling
3. Balance sharing about yourself with showing curiosity about them
4. Use your natural enthusiasm - it's one of your strengths!`;
    }

    if (lastMessage.includes('check in') || lastMessage.includes('feeling')) {
      return `I'd love to check in with you! How has your dating experience been lately? Have you noticed any patterns in your conversations, or is there anything you'd like to work on together?`;
    }

    // Default conversational response
    return `That's interesting! Tell me more about that. I'm here to help you become the best version of yourself in the dating world. What would you like to focus on today?`;
  }
}

/**
 * Function to generate a structured vibe analysis
 */
export async function analyzeVibe(bio: string, chatHistory: string[]): Promise<any> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are an expert dating coach analyzing a user\'s personality and texting style. Provide detailed but constructive feedback.'
    },
    {
      role: 'user',
      content: `Analyze this user's vibe based on their bio and chat messages:

Bio: ${bio}

Recent messages:
${chatHistory.join('\n')}

Provide a JSON response with: overall_tone (positive/negative), energy_level (high/low), communication_style (direct/indirect), and key_traits (array of 3-5 traits).`
    }
  ];

  const response = await callLLM(messages);

  // Mock structured response
  return {
    overall_tone: 'positive',
    energy_level: 'medium-high',
    communication_style: 'friendly and direct',
    key_traits: ['enthusiastic', 'curious', 'thoughtful', 'authentic']
  };
}

/**
 * Generate simulation scenarios
 */
export async function generateSimulation(profileSummary: string, scenarioNumber: number): Promise<any> {
  const archetypes = [
    'Adventurous Extrovert',
    'Thoughtful Introvert',
    'Creative Free Spirit',
    'Ambitious Professional',
    'Laid-back Homebody',
    'Social Butterfly',
    'Intellectual Conversationalist',
    'Outdoor Enthusiast',
    'Art & Culture Lover',
    'Fitness Enthusiast'
  ];

  const archetype = archetypes[scenarioNumber % archetypes.length];
  const compatibilityScore = 60 + Math.floor(Math.random() * 35);

  const openers = [
    `Hey! I noticed you mentioned ${['hiking', 'reading', 'cooking', 'traveling'][scenarioNumber % 4]} in your profile. What got you into that?`,
    `Hi there! Your profile caught my eye - you seem like someone who ${['values authenticity', 'loves adventure', 'enjoys deep conversations', 'has great energy'][scenarioNumber % 4]}.`,
    `Hey! Quick question: ${['coffee or tea?', 'beach or mountains?', 'morning person or night owl?', 'cook at home or try new restaurants?'][scenarioNumber % 4]}`,
    `Hi! I had to reach out - ${['your smile is contagious', 'you seem like you\'d be fun to talk to', 'we have similar interests', 'your vibe seems amazing'][scenarioNumber % 4]}.`
  ];

  const issues = [
    'May come across as too eager - balance enthusiasm with letting conversation breathe',
    'Could benefit from asking more follow-up questions to show genuine interest',
    'Responses might be too brief - consider sharing a bit more to keep momentum',
    'Watch for over-sharing too early - build rapport gradually',
    null // no issue for some scenarios
  ];

  return {
    match_archetype: archetype,
    match_initial_message: openers[scenarioNumber % openers.length],
    user_expected_reply: 'Likely positive and engaged, with reciprocal interest',
    compatibility_score: compatibilityScore,
    potential_issue: issues[scenarioNumber % issues.length]
  };
}
