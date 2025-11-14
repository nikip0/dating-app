export interface UserProfile {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  interestedIn: string;
  bio: string;
  relationshipGoals: string;
  textingTone: {
    positivity: number; // 0-100
    playfulness: number; // 0-100
    responseLength: number; // 0-100
  };
  selfRatedAttractiveness?: number; // 1-5
  photos: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface SimulationResult {
  match_archetype: string;
  match_initial_message: string;
  user_expected_reply: string;
  compatibility_score: number; // 0-100
  potential_issue?: string;
}

export interface SimulationSummary {
  total_simulations: number;
  average_compatibility: number;
  top_archetypes: string[];
  common_issues: string[];
  coaching_tips: string[];
  suggested_openers: string[];
  vibe_analysis: {
    overall_impression: string;
    strengths: string[];
    areas_to_improve: string[];
  };
}

export interface PhotoVerification {
  status: 'success' | 'inconclusive' | 'failed';
  confidence: number; // 0-100
  message: string;
}
