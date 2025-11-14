export interface UserProfile {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  interestedIn: string;
  bio: string;
  relationshipGoals: string;
  textingTone: {
    positivity: number;
    playfulness: number;
    responseLength: number;
  };
  selfRatedAttractiveness?: number;
  photos: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface SimulationResults {
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
  confidence: number;
  message: string;
}

export type AppStep = 'onboarding' | 'photos' | 'chat';
